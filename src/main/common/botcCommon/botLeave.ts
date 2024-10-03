import { BOT, ERROR_TYPE, MESSAGES, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../constants";
import logger from "../../../logger";
import { getRoundTableData } from "../../gamePlay/cache/Rounds";
import { getTableData } from "../../gamePlay/cache/Tables";
import leaveTable from "../../gamePlay/play/leaveTable";
import { removeQueue } from "../../gamePlay/utils/manageQueue";
import { playingTableIf } from "../../interfaces/playingTableIf";
import { roundTableIf } from "../../interfaces/roundTableIf";
import { throwErrorIF } from "../../interfaces/throwError";
import findBotTimerCancel from "../../scheduler/cancelJob/BOT/findBot.cancel";


export async function botLeave(tableId:string, currentRound:number) {
    logger.info("========>> :: botLeave :: <<========")
    try {
        const playingTable: playingTableIf = await getTableData(tableId);
        logger.info(`----->> botLeave :: playingTable ::`, playingTable)

        if (playingTable === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.LEAVE_TABLE_ERROR,
                message: MESSAGES.ERROR.TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        const { currentRound, gameId, lobbyId, gameType } = playingTable;

        const roundTablePlayData: roundTableIf = await getRoundTableData(
            tableId,
            currentRound,
        );
        logger.info(`----->> botLeave :: roundTablePlayData :1:`, roundTablePlayData)
        if (roundTablePlayData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.LEAVE_TABLE_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
    
            logger.info(`----->> botLeave :: Bot Leave :: roundTablePlayData.seats :: --> `, roundTablePlayData.seats);

            // Find real and bot couter
            let realUserCounter: number = NUMERICAL.ZERO;
            let botUserCounter: number = NUMERICAL.ZERO;

            for await (const key of Object.keys(roundTablePlayData.seats)) {
                if (Object.keys(roundTablePlayData.seats[key]).length > 0) {
                    if (roundTablePlayData.seats[key].isBot && roundTablePlayData.seats[key].userStatus == PLAYER_STATE.PLAYING) {
                        botUserCounter++;
                    } else if (!roundTablePlayData.seats[key].isBot && roundTablePlayData.seats[key].userStatus != PLAYER_STATE.LEFT) {
                        realUserCounter++;
                    }
                }
            }

            logger.info(`--->> botLeave :: Bot Leave :: realUserCounter :: --> `, realUserCounter);
            logger.info(`--->> botLeave :: Bot Leave :: botUserCounter :: --> `, botUserCounter);

            if (realUserCounter === 0 && botUserCounter === 0) {
                await removeQueue(`${gameType}:${gameId}:${lobbyId}`, playingTable._id);
                await findBotTimerCancel(`botJoinTimer:${tableId}`);
            } else if (realUserCounter === 0 && botUserCounter > 0) {
                logger.info(`--->> botLeave :: Bot Leave :: IN --> `);

                await removeQueue(`${gameType}:${gameId}:${lobbyId}`, playingTable._id);
                await findBotTimerCancel(`botJoinTimer:${tableId}`);

                for await (const key of Object.keys(roundTablePlayData.seats)) {

                    if (Object.keys(roundTablePlayData.seats[key]).length > 0) {
                        if (roundTablePlayData.seats[key].userStatus != PLAYER_STATE.LEFT) {
                            if (roundTablePlayData.seats[key].isBot) {

                                const botSocket = {
                                    id: BOT.ID,
                                    userId: roundTablePlayData.seats[key].userId,
                                    tableId,
                                    eventMetaData: {
                                        userId: roundTablePlayData.seats[key].userId,
                                        tableId,
                                    },
                                    connected: true,
                                }

                                const roundTableData: roundTableIf = await getRoundTableData(
                                    tableId,
                                    currentRound,
                                );
                           
                                logger.info(`----->> botLeave :: roundTableData.tableState ::`, roundTableData?.tableState)

                                if (roundTableData && roundTableData.tableState !== TABLE_STATE.DISPLAY_SCOREBOARD) {
                                 
                                    return await leaveTable(tableId, botSocket);
                                }

                            }
                        }
                    }

                }
            }
        
    } catch (error) {
        logger.info(`--- botLeave :: ERROR :: `, error);
        throw error;
    }
    
}