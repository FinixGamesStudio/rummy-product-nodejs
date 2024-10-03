import QueueBaseClass from "./../queueBaseClass";
import Errors from "../../../errors"
import logger from "../../../../logger";
import botTurnTimerProcess from "../../processes/BOT/botTurnTimer.Process";
import { startTurnTimerQueueIf } from "../../../interfaces/schedulerIf";

class BotTurnTimerQueue extends QueueBaseClass {

    constructor() {
        super("BotTurnTimerQueue");
        this.queue.process(botTurnTimerProcess)
    }
    botTurnTimerQueue = async (data: startTurnTimerQueueIf) => {
        try {

            logger.info(" BotTurnTimerQueue :: data :: ----->>", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: `botTurn:${data.tableId}`,
                removeOnComplete: true,
            };

            logger.info('---------------------------------------------');
            logger.info(' BotTurnTimerQueue --------->>>', queueOption);
            logger.info('---------------------------------------------');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error(" BotTurnTimerQueue :: ERROR ::----->>>", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new BotTurnTimerQueue().botTurnTimerQueue;

