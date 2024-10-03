import { winnerScoreHandle } from "../../../../../cms/helper/winnerScore";
import { playedGames } from "../../../../../cms/interfaces/playedGames";
import { User } from "../../../../../cms/interfaces/user_interfaces";
import UsersGameRunningStatusModel from "../../../../../cms/model/runningGameStatus.model";
import playedGamesModel from "../../../../../cms/model/playedGamesSchema";
import userAllGameRecordModel from "../../../../../cms/model/playedGamesSchema";
import UserModel from "../../../../../cms/model/user_model";
import { DB } from "../../../../../cms/mongoDBServices";
import { NUMERICAL, PLAYER_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { playingTableIf } from "../../../../interfaces/playingTableIf";
import { getPlayerGamePlay } from "../../../cache/Players";
import {
  getRoundTableHistory,
  removeRoundTableHistory,
} from "../../../cache/RoundHistory";
import { getRoundTableData } from "../../../cache/Rounds";
import {
  getScoreBoardHistory,
  removeScoreBoardHistory,
} from "../../../cache/ScoreBoardHistory";
import { removeTurnHistoy } from "../../../cache/TurnHistory";
import { getUser, setUser } from "../../../cache/User";
import { formatMultiPlayerScore } from "../../../utils/formatMultiPlayerScore";
import roundHistory from "../../History/roundHistory";
import { newGameStart } from "../../newGameStart";
import cancelAllTimers from "../../winner/helper/cancelTimers";
import { getUserInfoForCreaditAmount } from "../helper/getUserInfoForCreaditAmount";

export async function pointRummyNextRound(
  tableData: playingTableIf,
  currentRound: number
) {
  try {
    logger.info("------->> pointRummyNextRound :: tableData :: ", tableData);
    const { _id: tableId, bootAmount, lobbyId } = tableData;

    const roundTableData = await getRoundTableData(tableId, currentRound);
    logger.info(
      "---->> pointRummyNextRound :: prevoiusRoundTableData :: roundTableData :: ",
      roundTableData
    );

    await roundHistory(roundTableData, currentRound);

    await cancelAllTimers(tableId, roundTableData.seats, true);

    let winPoints: number = NUMERICAL.ZERO;

    for await (const seat of Object.keys(roundTableData.seats)) {
      if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
        const playerData = await getPlayerGamePlay(
          roundTableData.seats[seat].userId,
          tableId
        );
        logger.info(
          "------->> pointRummyNextRound :: playerData :: ",
          playerData
        );
        logger.info(
          "------->> pointRummyNextRound :: player :: cardPoints :: ",
          playerData.cardPoints
        );

        const userData = await getUser(roundTableData.seats[seat].userId);
        logger.info("------->> pointRummyNextRound :: userData :: ", userData);

        // if (roundTableData.seats[seat].userId !== tableData.winner[NUMERICAL.ZERO]) {

        // winPoints += playerData.cardPoints

        // const scoreDiff = NUMERICAL.EIGHTEEN - playerData.cardPoints;
        // logger.info("------->> pointRummyNextRound :: scoreDiff :: ", scoreDiff);

        // if (scoreDiff > NUMERICAL.ZERO) {
        //     const userInfo = await getUser(playerData.userId)
        //     logger.info("------->> pointRummyNextRound :: userInfo :: ", userInfo);

        //     userInfo.balance += scoreDiff * tableData.bootAmount;
        //     logger.info("------->> pointRummyNextRound :: userInfo :: 1 ", userInfo);

        //     await setUser(userInfo.userId, userInfo);
        // }
        // }
      }
    }

    // logger.info("------->> pointRummyNextRound :: winPoints :: ", winPoints);

    const winnerUserData = await getUser(tableData.winner[NUMERICAL.ZERO]);
    logger.info(
      "------->> pointRummyNextRound :: winnerUserData :: ",
      winnerUserData
    );

    // winnerUserData.balance += (winPoints + NUMERICAL.EIGHTEEN) * tableData.bootAmount;
    // await setUser(winnerUserData.userId, winnerUserData);

    
    // let userDetail;
    // for (let seat in roundTableData.seats) {
    //   userDetail = roundTableData.seats[seat];
    //   logger.info(
    //     " ------>> ------>> pointRummyNextRound  :: userDetail ::>> ",
    //     userDetail
    //   );
    // }

    // //    create
    // for (const player of apiData.playersScore) {
    //   const { userId, winLossStatus } = player;
    //   logger.info(
    //     "------>> ------>> pointRummyNextRound : : :: player :: ",
    //     player
    //   );
    //   const getUserPlayed: playedGames = await DB.find(playedGamesModel, {
    //     query: { userId: userId },
    //   });
    //   logger.info(
    //     " ------>> ------>> pointRummyNextRound  :: getUserPlayed ::>> ",
    //     getUserPlayed
    //   );
    //   logger.info(
    //     " ------>> ------>> pointRummyNextRound  :: getUserPlayed.runningTableId !=roundTableData.tableId ::>> ",
    //     getUserPlayed.runningTableId != roundTableData.tableId
    //   );

    //   if (
    //     userDetail.userStatus != "LEFT" &&
    //     userDetail.userStatus != "WIN_ROUND" &&
    //     getUserPlayed.runningTableId != roundTableData.tableId
    //   ) {
    //     const findUser: User = await DB.findOne(UserModel, {
    //       query: { _id: userId },
    //     });
    //     logger.info(
    //       " ------>> ------>> pointRummyNextRound  :: findUser ::>> ",
    //       findUser
    //     );
    //     if (!findUser) {
    //       throw new Error(`Can not found user for rummy game`);
    //     }

    //     let insertData;
    //     if (winLossStatus === "Win") {
    //       insertData = { $inc: { "status.win": 1 } };
    //     } else if (winLossStatus === "Loss") {
    //       insertData = { $inc: { "status.loss": 1 } };
    //     } else {
    //       insertData = { $inc: { "status.tie": 1 } };
    //     }
    //     // update userName into user table
    //     const updatedUser: playedGames = await DB.findOneAndUpdate(
    //       playedGamesModel,
    //       {
    //         query: { userId: userId },
    //         updateData: insertData,
    //       }
    //     );
    //     logger.info(
    //       " pointRummyNextRound :: updatedUser :: ==>> ",
    //       updatedUser
    //     );
    //   }
    // }

    const roundTableHistoryData = await getRoundTableHistory(tableId);
    logger.info(
      "------>> ------>> pointRummyNextRound : : :: roundTableHistoryData :: ",
      roundTableHistoryData
    );

    const scoreBoardHistoryData = await getScoreBoardHistory(tableId);
    logger.info(
      "------>> ------>> pointRummyNextRound : : :: scoreBoardHistoryData :: ",
      scoreBoardHistoryData
    );

    await removeTurnHistoy(tableId);
    await removeRoundTableHistory(tableId);
    await removeScoreBoardHistory(tableId);

    await newGameStart(tableId);
  } catch (error) {
    logger.error(`---- pointRummyNextRound :: ERROR :: `, error);
    throw error;
  }
}
