import logger from "../../../../logger";
import { getLock } from "../../../lock";
import { throwErrorIF } from '../../../interfaces/throwError';
import { getTableData } from '../../cache/Tables';
import {
    BOT,
    ERROR_TYPE,
    MESSAGES,
    NUMERICAL
} from '../../../../constants';
import { roundTableIf } from "../../../interfaces/roundTableIf";
import { getRoundTableData } from "../../cache/Rounds";
import { getPlayerGamePlay } from "../../cache/Players";
import finishTimerStartHandler from "../../../requestHandler/requestHelper/finishTimerStart";
import { declareRequestIf, finishTimerStartRequestIf } from "../../../interfaces/requestIf";
import { sleep } from "../../../common/getRandomNumber";
import declareHandler from "../../../requestHandler/requestHelper/declareEvent";

export async function finishCardForBot(tableId: string, currentTurn: string) {
    logger.info('call finishCardForBot ::: --->>> tableId :: ', tableId, " currentTurn :: >> ", currentTurn);
    let finishCardRobotLock = await getLock().acquire([`${tableId}`], 2000);
    try {

        const tableGamePlay = await getTableData(tableId);
        if (tableGamePlay === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.LEAVE_TABLE_ERROR,
                message: MESSAGES.ERROR.TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        const roundTableData: roundTableIf = await getRoundTableData(tableId, tableGamePlay.currentRound);
        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.LEAVE_TABLE_ERROR,
                message: MESSAGES.ERROR.TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        const playerData = await getPlayerGamePlay(currentTurn, tableId);
        if (playerData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.PICK_UP_FROM_OPEN_DECK_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info(`----->> finishCardForBot :: playerData ::`, playerData);
        
        const userCards = playerData.currentCards;
        logger.info(`----->> finishCardForBot :: userCards[userCards.length - 1][userCards[userCards.length - 1].length - 1] ::`, userCards[userCards.length - 1][userCards[userCards.length - 1].length - 1]);
        
        const data : finishTimerStartRequestIf = {
            userId: currentTurn,
            tableId,
            currentRound: tableGamePlay.currentRound,
            finishCard: [userCards[userCards.length - 1][userCards[userCards.length - 1].length - 1]]
        }

        const socket = {
            id: BOT.ID,
            userId: currentTurn,
            tableId,
            eventMetaData: {
                userId: currentTurn,
                tableId,
            },
            connected: true,
        }

        if (finishCardRobotLock) {
            await getLock().release(finishCardRobotLock);
            finishCardRobotLock = null;
        }

        logger.info(`----->> finishTimerStartHandler :: START `);
        await finishTimerStartHandler({data : data}, socket);

        await sleep(NUMERICAL.TWO * NUMERICAL.THOUSAND);

        logger.info(`----->> declareHandler :: START `);
        const declareData : declareRequestIf = {
            userId: currentTurn,
            tableId: tableId,
            currentRound: tableGamePlay.currentRound,
        }
        await declareHandler({data : declareData}, socket);

        return true;

    } catch (error) {
        logger.error('CATCH_ERROR :: finishCardForBot :: --->>', tableId, error);
    } finally {
        if (finishCardRobotLock) {
            await getLock().release(finishCardRobotLock);
        }
    }
}
