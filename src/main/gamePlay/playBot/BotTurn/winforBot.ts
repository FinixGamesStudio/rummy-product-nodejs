import logger from "../../../../logger";
import { getLock } from "../../../lock";
import { throwErrorIF } from '../../../interfaces/throwError';
import { getTableData } from '../../cache/Tables';
import {
    ERROR_TYPE,
    MESSAGES
} from '../../../../constants';
import { roundTableIf } from "../../../interfaces/roundTableIf";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";

export async function winforBot(tableId: string) {
    logger.info('WIN :: winforBot ::: ------->>> tableId :: ', tableId);
    let pickCardRobotLock = await getLock().acquire([`${tableId}`], 2000);
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

        roundTableData.isBotWin = true;

        await setRoundTableData(tableId, tableGamePlay.currentRound, roundTableData);


        return true;

    } catch (error) {
        logger.error('CATCH_ERROR :: winforBot :: --->>', tableId, error);
    } finally {
        if (pickCardRobotLock) {
            await getLock().release(pickCardRobotLock);
        }
    }
}
