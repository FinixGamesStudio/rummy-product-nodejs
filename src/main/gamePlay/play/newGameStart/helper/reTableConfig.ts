import { privateTableKey } from "../../../../../cms/interfaces/privateTableKey.interface";
import privateTableKeyModel from "../../../../../cms/model/privateTableKey.model";
import { DB } from "../../../../../cms/mongoDBServices";
import { NUMERICAL, RUMMY_TYPES } from "../../../../../constants";
import logger from "../../../../../logger";
import { removeTableData } from "../../../cache/Tables";
import { getTableData, setTableData } from "../../../cache/Tables";
const { ObjectID } = require("mongodb")


export async function reTableConfig(
    tableId: string
) {
    try {
        logger.info(`------------------>> reTableConfig <<------------------`)
        const oldTableData = await getTableData(tableId);
        logger.info(`------>> reTableConfig :: old table config data :: `, oldTableData)
        const oldTableLastRound: number = JSON.parse(JSON.stringify(oldTableData.currentRound))

        oldTableData._id = ObjectID().toString();
        oldTableData.currentRound = NUMERICAL.ONE;
        oldTableData.winner = [];

        //create a new table 
        await setTableData(oldTableData)

        logger.info(`------>> reTableConfig :: new table config data :: `, oldTableData)
        logger.info(`------>> reTableConfig :: new tableID  :: `, oldTableData._id)

        const newTableData = await getTableData( oldTableData._id);
        logger.info(`------>> reTableConfig :: new tableData  :: `, newTableData)

        let updateNewTableId = newTableData._id
        logger.info(`------>> reTableConfig :: updateNewTableId  :: `, updateNewTableId)
        
        // update privateTable key in mongoDb

        if((oldTableData.rummyType === RUMMY_TYPES.POINT_RUMMY || oldTableData.rummyType === RUMMY_TYPES.DEALS_RUMMY) && oldTableData.isCreateRoom){
            let isReferralCode = oldTableData.isReferralCode
            let NewTableId ={
                tableId : updateNewTableId
            }
            const updatedTableId: privateTableKey = await DB.findOneAndUpdate(privateTableKeyModel, {
                query: { isReferralCode:isReferralCode },
                updateData: NewTableId,
              });
              logger.info(" ------>> reTableConfig :: :: updatedTableId :: ==>> ", updatedTableId);
            
              const TableData = { 
                tableId: updatedTableId.tableId,              
                };
            
              logger.info(" editUserData :: userData :: ==>> ", TableData);

        }

        // remove old table
        await removeTableData(tableId);

        return {
            newTableId: oldTableData._id,
            dealType: oldTableData.dealType,
            totalPlayers: oldTableData.maximumSeat,
            totalRounds: oldTableLastRound,
            gameId: oldTableData.gameId,
            lobbyId: oldTableData.lobbyId,
            gameType: oldTableData.gameType,
            currentRound: oldTableLastRound,
            minPlayerForPlay: oldTableData.minPlayerForPlay,
            isCreateRoom  : oldTableData.isCreateRoom,
            isReferralCode : oldTableData.isReferralCode
        }


    } catch (error) {
        console.log("--- reTableConfig :: ERROR :: ", error);
        logger.error("--- reTableConfig :: ERROR :: ", error);
        throw error;
    }
}
