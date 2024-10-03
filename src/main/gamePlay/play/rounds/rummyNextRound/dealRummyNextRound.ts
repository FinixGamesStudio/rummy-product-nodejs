import { gameRunningStatusManage } from "../../../../../cms/helper/gameRunningStatus";
import { winnerScoreHandle } from "../../../../../cms/helper/winnerScore";
import { playedGames} from "../../../../../cms/interfaces/playedGames";
import { User } from "../../../../../cms/interfaces/user_interfaces";
import playedGamesModel from "../../../../../cms/model/playedGamesSchema";
import userAllGameRecordModel from "../../../../../cms/model/playedGamesSchema";
import UserModel from "../../../../../cms/model/user_model";
import { DB } from "../../../../../cms/mongoDBServices";
import { EVENTS, NUMERICAL } from "../../../../../constants";
import logger from "../../../../../logger";
import {
  markCompletedGameStatus,
  multiPlayerWinnScore,
} from "../../../../clientsideapi";
import commonEventEmitter from "../../../../commonEventEmitter";
import { formateScoreIf } from "../../../../interfaces/clientApiIf";
import { playingTableIf } from "../../../../interfaces/playingTableIf";
import { getPlayerGamePlay } from "../../../cache/Players";
import { removeRoundTableHistory } from "../../../cache/RoundHistory";
import { getRoundTableData, setRoundTableData } from "../../../cache/Rounds";
import { removeScoreBoardHistory } from "../../../cache/ScoreBoardHistory";
import { setTableData } from "../../../cache/Tables";
import { removeTurnHistoy } from "../../../cache/TurnHistory";
import { getUser, setUser } from "../../../cache/User";
import { formatGameTableInfo } from "../../../formatResponse";
import { formatMultiPlayerScore } from "../../../utils/formatMultiPlayerScore";
import getPlayerIdForRoundTable from "../../../utils/getPlayerIdForRoundTable";
import roundHistory from "../../History/roundHistory";
import { newGameStart } from "../../newGameStart";
import selectDealer from "../../turn/selectDealer";
import cancelAllTimers from "../../winner/helper/cancelTimers";
import filterPlayerForNextRound from "../helper/filterPlayerForNextRound";
import filterRoundTableForNextRound from "../helper/filterRoundTableForNextRound";
import { setScoketData } from "../helper/setSocketData";
import startRound from "../startRound";

export async function dealRummyNextRound(
  tableData: playingTableIf,
  currentRound: number
) {
  try {
    const { _id: tableId } = tableData;
    const roundTableData = await getRoundTableData(tableId, currentRound);
    logger.info(
      "------>> dealRummyNextRound : :: prevoiusRoundTableData :: roundTableData :: ",
      roundTableData
    );
    logger.info(
      "------>> ------>> dealRummyNextRound : : :: tableData :: ",
      tableData
    );

    const nextRound = currentRound + NUMERICAL.ONE;

    await roundHistory(roundTableData, currentRound);

    logger.info(
      "------>> dealRummyNextRound : :: tableData.currentRound :: ",
      tableData.currentRound
    );

    if (
      currentRound < tableData.dealType &&
      roundTableData.totalPlayers > NUMERICAL.ONE
    ) {
      logger.info(
        "-------->> ------>> dealRummyNextRound : : ::  player are more than one so next round start :: "
      );

      // round table for next round
      await filterRoundTableForNextRound(tableId, currentRound, nextRound);
      const nextRoundData = await getRoundTableData(tableId, nextRound);
      logger.info(
        "------->> ------>> dealRummyNextRound : : :: nextRoundData :: ",
        nextRoundData
      );

      // set Round in socket
      if (
        tableData.dealType !== currentRound &&
        roundTableData.totalPlayers > NUMERICAL.ONE
      ) {
        tableData.currentRound = nextRound;
        await setTableData(tableData);
        await setScoketData(roundTableData, tableId, nextRound);
      }

      const userIDs = await getPlayerIdForRoundTable(tableId, nextRound);
      logger.info(
        "------>> ------>> dealRummyNextRound : : :: getPlayerIdForRoundTable :: ",
        userIDs
      );

      const dealerPlayer = await selectDealer(
        nextRoundData.tossWinnerPlayer,
        tableId,
        nextRound
      );
      logger.info(
        "------>> ------>> dealRummyNextRound : : :: dealerPlayer :: ",
        dealerPlayer
      );

      nextRoundData.dealerPlayer = dealerPlayer;
      await setRoundTableData(tableId, nextRound, nextRoundData);
      await filterPlayerForNextRound(userIDs, tableId, currentRound);

      const eventGTIdata = await formatGameTableInfo(
        tableData,
        nextRoundData,
        nextRound
      );

      logger.info(
        "------>> ------>> dealRummyNextRound : :: eventGTIdata :: ",
        eventGTIdata
      );

      commonEventEmitter.emit(EVENTS.JOIN_TABLE_SOCKET_EVENT, {
        tableId,
        data: {
          selfPlayerData: {},
          tableInfo: eventGTIdata,
        },
      });

      // start next round
      await startRound({
        timer: 10,
        tableId,
        currentRound: nextRound,
      });
    } else {
      logger.info(
        "------>> ------>> dealRummyNextRound : : :: game winner declare :: "
      );
      // const winnerPlayerUserIds: string[] = [];

      await cancelAllTimers(tableId, roundTableData.seats, true);

      // for await (const seat of Object.keys(roundTableData.seats)) {
      //   if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
      //     const playerData = await getPlayerGamePlay(
      //       roundTableData.seats[seat].userId,
      //       tableId
      //     );
      //     console.log(
      //       "------>> ------>> dealRummyNextRound : : :: playerData :: ",
      //       playerData
      //     );
      //     if (playerData.isWinner) {
      //       winnerPlayerUserIds.push(playerData.userId);
      //     }
      //   }
      // }

      // logger.info(
      //   "------>> ------>> dealRummyNextRound : : :: eventGTIdata :: ",
      //   winnerPlayerUserIds
      // );

      // const randomUserData = await getUser(winnerPlayerUserIds[NUMERICAL.ZERO]);
      // logger.info(
      //   "------>> ------>> dealRummyNextRound : : :: randomUserData :: ",
      //   randomUserData
      // );

      // const allPlayerDetails: formateScoreIf[] = [];
      // for await (const seat of Object.keys(roundTableData.seats)) {
      //   if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
      //     const playerData = await getPlayerGamePlay(
      //       roundTableData.seats[seat].userId,
      //       tableId
      //     );
      //     if (playerData) {
      //       if (playerData.isWinner) {
      //         if (winnerPlayerUserIds.length > NUMERICAL.ONE) {
      //           let tiePrize: number | string =
      //             tableData.winPrice / winnerPlayerUserIds.length;
      //           tiePrize = tiePrize.toFixed(2);
      //           const obj: formateScoreIf = {
      //             userId: playerData.userId,
      //             winLossStatus: "Tie",
      //             winningAmount: tiePrize,
      //             score: playerData.gamePoints,
      //           };

      //           allPlayerDetails.push(obj);
      //         } else {
      //           const obj: formateScoreIf = {
      //             userId: playerData.userId,
      //             winLossStatus: "Win",
      //             winningAmount: tableData.winPrice.toFixed(2),
      //             score: playerData.gamePoints,
      //           };
      //           allPlayerDetails.push(obj);
      //         }
      //       } else {
      //         const obj: formateScoreIf = {
      //           userId: playerData.userId,
      //           winLossStatus: "Loss",
      //           winningAmount: String(NUMERICAL.ZERO),
      //           score: playerData.gamePoints,
      //         };
      //         allPlayerDetails.push(obj);
      //       }

      //       // await markCompletedGameStatus({
      //       //     tableId,
      //       //     gameId: tableData.gameId,
      //       //     tournamentId: tableData.lobbyId
      //       // },
      //       //     randomUserData.authToken,
      //       //     playerData.socketId
      //       // );

      //       /* mark complete all previous running game staus of user */
      //       await gameRunningStatusManage(playerData.userId, tableData.gameId);
      //     } else {
      //       const obj: formateScoreIf = {
      //         userId: roundTableData.seats[seat].userId,
      //         winLossStatus: "Loss",
      //         winningAmount: String(NUMERICAL.ZERO),
      //         score: NUMERICAL.ZERO,
      //       };
      //       allPlayerDetails.push(obj);
      //     }
      //   }
      // }

      // winner get data for client side api
      // const apiData = await formatMultiPlayerScore(
      //   tableId,
      //   tableData.lobbyId,
      //   allPlayerDetails
      // );
      // logger.info(
      //   "------>> ------>> dealRummyNextRound : : :: apiData :: ",
      //   apiData
      // );

      // creadit amount for winner players
      // const winnerApiData = await winnerScoreHandle(apiData, tableData.gameId);
      // logger.info(
      //   "------>> ------>> dealRummyNextRound : : :: winnerApiData :: ",
      //   winnerApiData
      // );

      //    create
      // for (const player of apiData.playersScore) {
      //   const { userId, winLossStatus } = player;
      //   logger.info(
      //     "------>> ------>> dealRummyNextRound : : :: player :: ",
      //     player
      //   );

      //   const findUser: User = await DB.findOne(UserModel, {
      //     query: { _id: userId },
      //   });
      //   logger.info(
      //     " ------>> ------>> dealRummyNextRound  :: findUser ::>> ",
      //     findUser
      //   );
      //   if (!findUser) {
      //     throw new Error(`Can not found user for rummy game`);
      //   }

      //   let insertData;
      //   if (winLossStatus === "Win") {
      //     insertData = { $inc: { "status.win": 1 } };
      //   } else if (winLossStatus === "Loss") {
      //     insertData = { $inc: { "status.loss": 1 } };
      //   } else {
      //     insertData = { $inc: { "status.tie": 1 } };
      //   }
      //   // update userName into user table
      //   const updatedUser: playedGames = await DB.findOneAndUpdate(
      //     playedGamesModel,
      //     {
      //       query: { userId: userId },
      //       updateData: insertData,
      //     }
      //   );
      //   logger.info(" dealRummyNextRound :: updatedUser :: ==>> ", updatedUser);
      // }

      // for await (const player of allPlayerDetails) {
      //   if (player.winLossStatus === "Win") {
      //     const userData = await getUser(player.userId);
      //     logger.info(
      //       "------>> ------>> dealRummyNextRound : : :: Win Player :: "
      //     );
      //     logger.info(
      //       "------>> ------>> dealRummyNextRound : : :: userData :: ",
      //       userData
      //     );

      //     if (userData.isCash) {
      //       userData.winCash += tableData.winPrice;
      //     } else {
      //       userData.coins += tableData.winPrice;
      //     }
      //     // userData.balance += tableData.winPrice;

      //     await setUser(player.userId, userData);
      //     logger.info(
      //       "------>> ------>> dealRummyNextRound : : :: userData ::1 ",
      //       userData
      //     );
      //   } else if (player.winLossStatus === "Tie") {
      //     const userData = await getUser(player.userId);
      //     logger.info(
      //       "------>> ------>> dealRummyNextRound : : :: Tie Player :: "
      //     );
      //     logger.info(
      //       "------>> ------>> dealRummyNextRound : : :: userData :: ",
      //       userData
      //     );

      //     if (userData.isCash) {
      //       userData.cash += tableData.winPrice;
      //     } else {
      //       userData.coins += tableData.winPrice;
      //     }
      //     // userData.balance += tableData.winPrice;

      //     await setUser(player.userId, userData);
      //     logger.info(
      //       "------>> ------>> dealRummyNextRound : : :: userData :: 2",
      //       userData
      //     );
      //   }
      // }

      // // for await (const userID of winnerPlayerUserIds) {
      // //     const userData = await getUser(userID);
      // //     userData.balance += tableData.winPrice / winnerPlayerUserIds.length
      // //     userData.balance = Number(userData.balance.toFixed(NUMERICAL.TWO));
      // //     await setUser(userID, userData)
      // // }

      await removeTurnHistoy(tableId);
      await removeRoundTableHistory(tableId);
      await removeScoreBoardHistory(tableId);

      await newGameStart(tableId);
    }
  } catch (error) {
    logger.error(`---- ------>> dealRummyNextRound : :: ERROR :: `, error);
    throw error;
  }
}
