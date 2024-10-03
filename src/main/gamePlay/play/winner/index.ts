import { gameRunningStatusManage } from "../../../../cms/helper/gameRunningStatus";
import { winnerScoreHandle } from "../../../../cms/helper/winnerScore";
import { privateTableKey } from "../../../../cms/interfaces/privateTableKey.interface";
import { playedGames} from "../../../../cms/interfaces/playedGames";
import { User } from "../../../../cms/interfaces/user_interfaces";
import privateTableKeyModel from "../../../../cms/model/privateTableKey.model";
import playedGamesModel from "../../../../cms/model/playedGamesSchema";
import userAllGameRecordModel from "../../../../cms/model/playedGamesSchema";
import UserModel from "../../../../cms/model/user_model";
import { DB } from "../../../../cms/mongoDBServices";
import {
  EVENTS,
  MESSAGES,
  NUMERICAL,
  PLAYER_STATE,
} from "../../../../constants";
import { PREFIX } from "../../../../constants/redis";
import logger from "../../../../logger";
import { multiPlayerWinnScore } from "../../../clientsideapi";
import { markCompletedGameStatus } from "../../../clientsideapi/markCompletedGameStatus";
import commonEventEmitter from "../../../commonEventEmitter";
import { roundTableIf } from "../../../interfaces/roundTableIf";
import { leaveClientInRoom } from "../../../socket";
import { getPlayerGamePlay, removePlayerGameData } from "../../cache/Players";
import { removeRoundTableHistory } from "../../cache/RoundHistory";
import {
  getRoundTableData,
  removeRoundTableData,
  setRoundTableData,
} from "../../cache/Rounds";
import { removeScoreBoardHistory } from "../../cache/ScoreBoardHistory";
import { removeRejoinTableHistory } from "../../cache/TableHistory";
import {
  getTableData,
  popTableFromQueue,
  removeTableData,
} from "../../cache/Tables";
import { removeTurnHistoy } from "../../cache/TurnHistory";
import { getUser, setUser } from "../../cache/User";
import { formatLeaveTableInfo, formatWinnerInfo } from "../../formatResponse";
import { formatMultiPlayerScore } from "../../utils/formatMultiPlayerScore";
import cancelAllTimers from "./helper/cancelTimers";
import { getUserInfoForCreaditAmount } from "./helper/getUserInfoForCreaditAmount";
import { removeReffCode } from "../../utils/reffCodeData";

async function winner(
  tableId: string,
  roundTableData: roundTableIf,
  currentRound: number,
  lobbyId: string,
  gameId: string,
  userId: string,
  seatIndex: number
): Promise<void> {
  logger.info("----------------------->> winner <<---------------------------");
  try {
    let winnerId: string = userId;
    let winnerSI: number = seatIndex;

    await cancelAllTimers(tableId, roundTableData.seats, true);
    logger.info("---->> winner :: userId :: ", winnerId);
    logger.info("---->> winner :: seatIndex :: ", winnerSI);

    const userInfo = await getUser(winnerId);
    logger.info("---->> winner :: userInfo :: ", userInfo);

    const tableData = await getTableData(tableId);
    logger.info("---->> winner :: tableData :: ", tableData);

    // for all player data to client side api
    const allPlayerDetails = await getUserInfoForCreaditAmount(
      tableId,
      winnerId,
      roundTableData.seats,
      tableData.winPrice
    );

    // winner get data for client side api
    const apiData = await formatMultiPlayerScore(
      tableId,
      lobbyId,
      allPlayerDetails
    );
    logger.info("------>> ------>> winner : : :: apiData :: ", apiData);

    // creadit amount for winner players
    const winnerApiData = await winnerScoreHandle(apiData, tableData.gameId);
    logger.info(
      "------>> ------>> winner : : :: winnerApiData :: ",
      winnerApiData
    );

    let userDetail : any;
    for (let seat in roundTableData.seats) {
      userDetail = roundTableData.seats[seat];
      logger.info(
        " ------>> ------>> winner  :: userDetail ::>> ",
        userDetail,
        " ------>> ------>> winner  :: apiData.playersScore ::>> ",
        apiData.playersScore
      );

    //    create
    if (userDetail && userDetail.userStatus != "LEFT") {
    // for (const player of apiData.playersScore) {
      let playerData = apiData.playersScore.find((obj: any) => {
        return obj.userId === userDetail.userId;
      });
      console.log("------>> ------>> winner : playerData ::::::: ", playerData);
      if (!playerData) {
        continue;
      }
      const { userId, winLossStatus } = playerData;
      logger.info(
        "------>> ------>> winner : : :: playerData :: ",
        playerData
      );

      const findUser: User = await DB.findOne(UserModel, {
        query: { _id: userId },
      });
      logger.info(" ------>> ------>> winner  :: findUser ::>> ", findUser);
      if (!findUser) {
        throw new Error(`Can not found user for rummy game`);
      }

      let insertData;
      if (winLossStatus === "Win") {
        insertData = { $inc: { "status.win": 1 } };
      } else if (winLossStatus === "Loss") {
        insertData = { $inc: { "status.loss": 1 } };
      } else {
        insertData = { $inc: { "status.tie": 1 } };
      }
      // update userName into user table
      const updatedUser: playedGames = await DB.findOneAndUpdate(
        playedGamesModel,
        {
          query: { userId: userId },
          updateData: insertData,
        }
      );
      logger.info(" winner :: updatedUser :: ==>> ", updatedUser);
    }
  }
    // for lobby tracking
    // await addLobbyTracking(tableId, tableData, roundTableData.splitPlayers);

    // save all round history in mongodb all scoreboard
    // await addAllRoundHistory(tableId)

    const playerData = await getPlayerGamePlay(userId, tableId);
    logger.info("---->> winner :: playerData :: ", playerData);

    // make game complate
    for await (const seat of Object.keys(roundTableData.seats)) {
      if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
        const userData = await getUser(roundTableData.seats[seat].userId);
        // await markCompletedGameStatus({
        //     tableId,
        //     gameId: gameId,
        //     tournamentId: lobbyId
        // },
        //     userData.authToken,
        //     userData.socketId
        // );

        /* mark complete all previous running game staus of user */
        await gameRunningStatusManage(userId, gameId);
      }
    }
    if (userInfo.isCash) {
      userInfo.winCash += tableData.winPrice;
    } else {
      userInfo.coins += tableData.winPrice;
    }
    // userInfo.balance += tableData.winPrice;
    userInfo.OldLobbyId = "";
    await setUser(winnerId, userInfo);

    const formatedRes = await formatWinnerInfo(
      tableId,
      winnerId,
      winnerSI,
      tableData.winPrice,
      /*userInfo.balance*/ userInfo.isCash,
      userInfo.cash,
      userInfo.coins,
      userInfo.bonus,
      userInfo.winCash
    );
    logger.info("---->> winner :: formatWinnerInfo :: ", formatedRes);

    // commonEventEmitter.emit(EVENTS.WINNER, {
    //     tableId,
    //     data: formatedRes
    // });

    if (tableData.isCreateRoom && tableData.isReferralCode != "") {
      let nonProdMsg = "Your Game is Finish";
      commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
        socket: playerData.socketId,
        data: {
          isPopup: true,
          popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
          title: nonProdMsg,
          message: `if you want to play a New game , please create a new Private Table`,
          buttonCounts: NUMERICAL.ONE,
          button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
          button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
          button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
        },
      });
    } else {
      let nonProdMsg = "Play New Game";
      commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
        socket: playerData.socketId,
        data: {
          isPopup: true,
          popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
          title: nonProdMsg,
          message: `if you want to play game again, with Amount ${userInfo.bootAmount}, please click yes`,
          buttonCounts: NUMERICAL.TWO,
          button_text: [
            MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.YES,
            MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT,
          ],
          button_color: [
            MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.GREEN,
            MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED,
          ],
          button_methods: [
            MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.NEW_SIGNUP,
            MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT,
          ],
        },
      });
    }

    // leave player from table
    await leaveClientInRoom(playerData.socketId, tableId);

    const userIDs = Object.keys(roundTableData.seats).map((seat) => {
      return roundTableData.seats[seat].userId;
    });

    for await (const userId of userIDs) {
      await removePlayerGameData(userId, tableId);
    }

    for (let i = NUMERICAL.ONE; i <= currentRound; i++) {
      await removeRoundTableData(tableId, i);
    }

    // remove reffrealCode in mongoDB
    let isReferralCode = tableData.isReferralCode;
    const privateTableKeyStatus = await DB.deleteOne(privateTableKeyModel, {
      query: { isReferralCode },
    });
    logger.info(
      `------>> ---->> winner :: :: privateTableKeyStatus :: `,
      privateTableKeyStatus
    );

    const findTable: privateTableKey = await DB.findOne(privateTableKeyModel, {
      query: { isReferralCode },
    });
    logger.info("---->> winner :: :: findTable :=>> ", findTable);
    
      // referralCode remove in Redis
    await removeReffCode(isReferralCode)

    await removeTableData(tableId);
    await removeTurnHistoy(tableId);
    await removeRoundTableHistory(tableId);
    await removeScoreBoardHistory(tableId);
  } catch (error) {
    logger.error("---winner :: ERROR: " + error);
    throw error;
  }
}

export = winner;
