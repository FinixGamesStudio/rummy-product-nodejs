import logger from "../../logger";
import { getRoundTableData, setRoundTableData } from "../gamePlay/cache/Rounds";
import { getTableData } from "../gamePlay/cache/Tables";
import { roundTableIf } from "../interfaces/roundTableIf";
import { userIf } from "../interfaces/userSignUpIf";

export async function setRoundTableDataComman(userData:userIf,tableId:string){

    try {
        let tableData = await getTableData(tableId)
        let roundTableData =  await getRoundTableData(tableId,tableData.currentRound)
        logger.info(`------>> setRoundTableDataComman :: tableData ::  ::`, tableData);
        logger.info(`------>> setRoundTableDataComman :: roundTableData :: 1 ::`, roundTableData);
        logger.info(`------>> setRoundTableDataComman :: roundTableData.seats :: 1 ::`, roundTableData.seats);

        // set Coin in RoundTableData
        for  (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > 1) {
                if (roundTableData.seats[seat].userId === userData.userId) {
                    roundTableData.seats[seat].coins = userData.coins
                    logger.info(`----setRoundTableDataComman--> rroundTableData.seats[seat].coins <<--- ::`,roundTableData.seats[seat].coins)
                }else{
                    logger.info(`------------------>>> setRoundTableDataComman :: <<<<------------------- ::`)
                }
            }
        }
        logger.info(`------>> setRoundTableDataComman :: roundTableData :: 2 ::`, roundTableData);
        logger.info(`------>> setRoundTableDataComman :: roundTableData.seats :: 2 ::`, roundTableData.seats);  

      let data =  await setRoundTableData(tableId,tableData.currentRound,roundTableData)
      logger.info(`------>> setRoundTableDataComman :: data :: ::`, data);

      let roundData =  await getRoundTableData(tableId,tableData.currentRound)
      logger.info(`------>> setRoundTableDataComman :: roundData :: ::`, roundData);

    return

    } catch (error:any) {
        logger.error("CATCH :: setRoundTableDataComman :: ERROR :: error ::>>", error);
        logger.error(
            "CATCH :: setRoundTableDataComman :: ERROR :: err.message ::>> ",
            error?.message
        );
    }

}
