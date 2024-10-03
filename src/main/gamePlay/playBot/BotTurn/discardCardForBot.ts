import logger from "../../../../logger";
import { getLock } from "../../../lock";
import { throwErrorIF } from '../../../interfaces/throwError';
import { getTableData } from '../../cache/Tables';
import {
    BOT,
    ERROR_TYPE,
    MESSAGES
} from '../../../../constants';
import { roundTableIf } from "../../../interfaces/roundTableIf";
import { getRoundTableData } from "../../cache/Rounds";
import { getPlayerGamePlay } from "../../cache/Players";
import { botRandomDiscardCard } from "../../../common/botcCommon/botRandomDiscardCard";
import discardCard from "../../play/cards/discardCard";
import { getRandomNumber } from "../../../common/botcCommon/botCount";

export async function discardCardForBot(tableId: string, currentTurn: string) {
    logger.info('call discardCardForBot ::: ----->>> tableId :: ', tableId, " currentTurn :: >> ", currentTurn);
    let discardCardRobotLock = await getLock().acquire([`${tableId}`], 2000);
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
        logger.info(`----->> discardCardForBot :: playerData ::`, playerData);

        let randomDiscardCard = await botRandomDiscardCard(currentTurn,tableId)
        logger.info(`----->> discardCardForBot :: randomDiscardCard ::`, randomDiscardCard);

        // Get a random card from the first array
        const randomIndex = await getRandomNumber(0, playerData.currentCards[0].length - 1);
        logger.info(`----->> discardCardForBot :: randomIndex ::`, randomIndex);

        const randomCard = playerData.currentCards[0][Number(randomIndex)];
        logger.info(`----->> discardCardForBot :: randomCard ::`, randomCard);

        logger.info(`----->> discardCardForBot :: [playerData.currentCards[playerData.currentCards.length - 1][0]] ::`, [playerData.currentCards[playerData.currentCards.length - 1][0]]);

        const data = {
            userId: currentTurn,
            tableId,
            currentRound: tableGamePlay.currentRound,
            cards: randomDiscardCard ? randomDiscardCard : [randomCard]
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

        if (discardCardRobotLock) {
            await getLock().release(discardCardRobotLock);
            discardCardRobotLock = null;
        }

        await discardCard(data, socket, () => { });

        return true;

    } catch (error) {
        logger.error('CATCH_ERROR :: discardCardForBot :: --->>', tableId, error);
    } finally {
        if (discardCardRobotLock) {
            await getLock().release(discardCardRobotLock);
        }
    }
}
