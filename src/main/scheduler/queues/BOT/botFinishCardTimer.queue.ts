import QueueBaseClass from "../queueBaseClass";
import Errors from "../../../errors"
import logger from "../../../../logger";
import botFinishCardTimerProcess from "../../processes/BOT/botFinishCardTimer.Process";
import { botFinishCardTimerIf } from "../../../interfaces/botIf";

class BotFinishCardTimerQueue extends QueueBaseClass {

    constructor() {
        super("BotFinishCardTimerQueue");
        this.queue.process(botFinishCardTimerProcess)
    }
    botFinishCardTimerQueue = async (data: botFinishCardTimerIf) => {
        try {

            logger.info(" botFinishCardTimerQueue :: data :: ----->>", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: `botFinishCard:${data.tableId}`,
                removeOnComplete: true,
            };

            logger.info('---------------------------------------------');
            logger.info(' botFinishCardTimerQueue --------->>>', queueOption);
            logger.info('---------------------------------------------');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error(" botFinishCardTimerQueue :: ERROR ::----->>>", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new BotFinishCardTimerQueue().botFinishCardTimerQueue;

