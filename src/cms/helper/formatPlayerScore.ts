import logger from "../../logger";
import { NUMERICAL } from "../../constants";
import { battleFinishPayload } from "../interfaces/battle";
import { getTableData } from "../../main/gamePlay/cache/Tables";
import { formatedwinnerData, formatedwinnerScoreData } from "../interfaces/winner.interface";

export async function formatPlayerScoreManage(
  tableId: string,
  allUserData: battleFinishPayload
) {
  try {

    logger.info(tableId, "formatPlayerScoreManage :: allUserData :>> ", allUserData, tableId);

    const tableGamePlay = await getTableData(tableId);
    logger.info(tableId, `tableGamePlay :: `, tableGamePlay);
    if (!tableGamePlay) throw new Error("get Table data not available");
    logger.info(tableId, `tableGamePlay ::>> `, tableGamePlay.winner[0]);

    const tournamentId = tableGamePlay.lobbyId;
    let playersScore = <Array<formatedwinnerScoreData>>[];
    // let winnertoken: string = EMPTY;
    // let winnerSocketId: string = EMPTY;

    logger.info("tableGamePlay.winners.length>>>>>", tableGamePlay.winner.length);
    let rank = NUMERICAL.ONE;
    for (let i = 0; i < allUserData.payload.players.length; i++) {
      const player = allUserData.payload.players[i];
      logger.info("player::::>>>>", player);
      const tempObj = <formatedwinnerScoreData>{};
      logger.info("player.winType::::>>>>>", player.winType);
      if (player.winType === "tie") {
        tempObj.userId = String(player.userId);
        tempObj.score = player.score;
        tempObj.rank = `${rank}`;
        tempObj.winLossStatus = "Tie";
        tempObj.winningAmount = `${Number(tableGamePlay.winPrice) / tableGamePlay.winner.length}`;
        playersScore.push(tempObj);
        rank++;
      }
      else if (player.winType === "win") {
        tempObj.userId = String(player.userId);
        tempObj.score = player.score;
        tempObj.rank = `${rank}`;
        tempObj.winLossStatus = "Win";
        tempObj.winningAmount = String(player.winAmount);
        playersScore.push(tempObj);
        rank++;
      }
      else if (player.winType === "lost") {
        tempObj.userId = String(player.userId);
        tempObj.score = player.score;
        tempObj.rank = `${rank}`;
        tempObj.winLossStatus = "Loss";
        tempObj.winningAmount = String(player.winAmount);
        playersScore.push(tempObj);
        rank++;
      }
    }

    logger.info(
      tableId,
      "formatPlayerScoreManage :: playersScore :>> ",
      playersScore
    );

    const resObj: formatedwinnerData = {
      tableId,
      tournamentId,
      playersScore,
    };
    return resObj;

  } catch (error: any) {
    logger.error("CATCH :: formatPlayerScoreManage :: ERROR :: error ::>>", error);
    logger.error(
      "CATCH :: formatPlayerScoreManage :: ERROR :: err.message ::>> ",
      error?.message
    );
    throw error;
  }

}

