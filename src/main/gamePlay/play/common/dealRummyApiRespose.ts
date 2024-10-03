import { gameRunningStatusManage } from "../../../../cms/helper/gameRunningStatus";
import { winnerScoreHandle } from "../../../../cms/helper/winnerScore";
import { playedGames } from "../../../../cms/interfaces/playedGames";
import { User } from "../../../../cms/interfaces/user_interfaces";
import playedGamesModel from "../../../../cms/model/playedGamesSchema";
import UserModel from "../../../../cms/model/user_model";
import { DB } from "../../../../cms/mongoDBServices";
import { NUMERICAL } from "../../../../constants";
import logger from "../../../../logger";
import { formateScoreIf } from "../../../interfaces/clientApiIf";
import { roundTableIf } from "../../../interfaces/roundTableIf";
import { getPlayerGamePlay } from "../../cache/Players";
import { getTableData } from "../../cache/Tables";
import { getUser, setUser } from "../../cache/User";
import { formatMultiPlayerScore } from "../../utils/formatMultiPlayerScore";

export async function dealRummyWinApi(
  roundTableData: roundTableIf,
  tableId: string
) {
  try {
    const winnerPlayerUserIds: string[] = [];

    for await (const seat of Object.keys(roundTableData.seats)) {
      if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
        const playerData = await getPlayerGamePlay(
          roundTableData.seats[seat].userId,
          tableId
        );
        console.log(
          "------>> ------>> dealRummyWinApi : : :: playerData :: ",
          playerData
        );
        if (playerData.isWinner) {
          winnerPlayerUserIds.push(playerData.userId);
        }
      }
    }

    logger.info(
      "------>> ------>> dealRummyWinApi : : :: eventGTIdata :: ",
      winnerPlayerUserIds
    );

    const tableData = await getTableData(tableId);
    logger.info(
      "------>> ------>> dealRummyWinApi : : :: tableData :: ",
      tableData
    );

    const randomUserData = await getUser(winnerPlayerUserIds[NUMERICAL.ZERO]);
    logger.info(
      "------>> ------>> dealRummyWinApi : : :: randomUserData :: ",
      randomUserData
    );
    const allPlayerDetails: formateScoreIf[] = [];
    for await (const seat of Object.keys(roundTableData.seats)) {
      if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
        const playerData = await getPlayerGamePlay(
          roundTableData.seats[seat].userId,
          tableId
        );
        if (playerData) {
          if (playerData.isWinner) {
            if (winnerPlayerUserIds.length > NUMERICAL.ONE) {
              let tiePrize: number | string =
                tableData.winPrice / winnerPlayerUserIds.length;
              tiePrize = tiePrize.toFixed(2);
              const obj: formateScoreIf = {
                userId: playerData.userId,
                winLossStatus: "Tie",
                winningAmount: tiePrize,
                score: playerData.gamePoints,
              };

              allPlayerDetails.push(obj);
            } else {
              const obj: formateScoreIf = {
                userId: playerData.userId,
                winLossStatus: "Win",
                winningAmount: tableData.winPrice.toFixed(2),
                score: playerData.gamePoints,
              };
              allPlayerDetails.push(obj);
            }
          } else {
            const obj: formateScoreIf = {
              userId: playerData.userId,
              winLossStatus: "Loss",
              winningAmount: String(NUMERICAL.ZERO),
              score: playerData.gamePoints,
            };
            allPlayerDetails.push(obj);
          }

          /* mark complete all previous running game staus of user */
          await gameRunningStatusManage(playerData.userId, tableData.gameId);
        } else {
          const obj: formateScoreIf = {
            userId: roundTableData.seats[seat].userId,
            winLossStatus: "Loss",
            winningAmount: String(NUMERICAL.ZERO),
            score: NUMERICAL.ZERO,
          };
          allPlayerDetails.push(obj);
        }
      }
    }

    // winner get data for client side api
    const apiData = await formatMultiPlayerScore(
      tableId,
      tableData.lobbyId,
      allPlayerDetails
    );
    logger.info(
      "------>> ------>> dealRummyWinApi : : :: apiData :: ",
      apiData
    );

    // creadit amount for winner players
    const winnerApiData = await winnerScoreHandle(apiData, tableData.gameId);
    logger.info(
      "------>> ------>> dealRummyWinApi : : :: winnerApiData :: ",
      winnerApiData
    );

    let userDetail: any;
    for (let seat in roundTableData.seats) {
      userDetail = roundTableData.seats[seat];
      logger.info(
        " ------>> ------>> dealRummyWinApi  :: userDetail ::>> ",
        userDetail,
        " ------>> ------>> dealRummyWinApi  :: apiData.playersScore ::>> ",
        apiData.playersScore
      );

      if (userDetail && userDetail.userStatus != "LEFT") {
        //    create
        // for (const player of apiData.playersScore) {
        let playerData = apiData.playersScore.find((obj: any) => {
          return obj.userId === userDetail.userId;
        });
        console.log("------>> ------>> dealRummyWinApi : playerData ::::::: ", playerData);
        if (!playerData) {
          continue;
        }
        const { userId, winLossStatus } = playerData;
        logger.info(
          "------>> ------>> dealRummyWinApi : : :: playerData :: ",
          playerData
        );

        const findUser: User = await DB.findOne(UserModel, {
          query: { _id: userId },
        });
        logger.info(
          " ------>> ------>> dealRummyWinApi  :: findUser ::>> ",
          findUser
        );
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
        logger.info(" dealRummyWinApi :: updatedUser :: ==>> ", updatedUser);
        // }
      }
    }

    for await (const player of allPlayerDetails) {
      if (player.winLossStatus === "Win") {
        const userData = await getUser(player.userId);
        logger.info("------>> ------>> dealRummyWinApi : : :: Win Player :: ");
        logger.info(
          "------>> ------>> dealRummyWinApi : : :: userData :: ",
          userData
        );

        if (userData.isCash) {
          userData.winCash += tableData.winPrice;
        } else {
          userData.coins += tableData.winPrice;
        }
        // userData.balance += tableData.winPrice;

        await setUser(player.userId, userData);
        logger.info(
          "------>> ------>> dealRummyWinApi : : :: userData ::1 ",
          userData
        );
      } else if (player.winLossStatus === "Tie") {
        const userData = await getUser(player.userId);
        logger.info("------>> ------>> dealRummyWinApi : : :: Tie Player :: ");
        logger.info(
          "------>> ------>> dealRummyWinApi : : :: userData :: ",
          userData
        );

        if (userData.isCash) {
          userData.cash += tableData.winPrice;
        } else {
          userData.coins += tableData.winPrice;
        }
        // userData.balance += tableData.winPrice;

        await setUser(player.userId, userData);
        logger.info(
          "------>> ------>> dealRummyWinApi : : :: userData :: 2",
          userData
        );
      }
    }
  } catch (error) {
    logger.error(`---- ------>> dealRummyWinApi : :: ERROR :: `, error);
    throw error;
  }
}
