import { EVENTS } from "../constants";
import logger from "../logger";

// @ts-ignore
function ackMid(en, response, userId, tableId, ack) {
    try {
        if (response && 'tableId' in response && response.success)
            delete response.tableId;

            if (en != EVENTS.HEART_BEAT_SOCKET_EVENT) {
                logger.info(`------ SEND ACK :: ${en}`)
                logger.info("acknowleadgement event::>> ", en, JSON.stringify(response));
              }
              
        ack(
            JSON.stringify({
                en: en,
                data: response,
                // metrics: metrics,
                userId,
                tableId,
            }),
        );

    } catch (error) {
        console.log('CATCH_ERROR in ackMid: ', error);
        // @ts-ignore
        throw new Error('ackMid error catch  : ', error);
    }
}

const exportObject = {
    ackMid,
};

export = exportObject;