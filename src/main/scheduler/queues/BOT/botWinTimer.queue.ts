import QueueBaseClass from "./../queueBaseClass";
import Errors from "../../../errors"
import logger from "../../../../logger";
import botWinTimerProcess from "../../processes/BOT/botWinTimer.Process";
import { botWinTimerIf } from "../../../interfaces/botIf";

class BotWinTimerQueue extends QueueBaseClass {

    constructor() {
        super("BotWinTimerQueue");
        this.queue.process(botWinTimerProcess)
    }
    botWinTimerQueue = async (data: botWinTimerIf) => {
        try {

            logger.info(" BotWinTimerQueue :: data :: ----->>", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: `botWin:${data.tableId}`,
                removeOnComplete: true,
            };

            logger.info('---------------------------------------------');
            logger.info(' BotWinTimerQueue --------->>>', queueOption);
            logger.info('---------------------------------------------');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error(" BotWinTimerQueue :: ERROR ::----->>>", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new BotWinTimerQueue().botWinTimerQueue;
