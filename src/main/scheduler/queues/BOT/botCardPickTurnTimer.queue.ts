import QueueBaseClass from "../queueBaseClass";
import Errors from "../../../errors"
import botCardPickTurnTimerProcess from "../../processes/BOT/botCardPickTurnTimer.Process";
import logger from "../../../../logger";
import { botCardPickTurnTimerIf } from "../../../interfaces/botIf";

class BotCardPickTurnTimerQueue extends QueueBaseClass {

    constructor() {
        super("BotCardPickTurnTimerQueue");
        this.queue.process(botCardPickTurnTimerProcess)
    }
    botCardPickTurnTimerQueue = async (data: botCardPickTurnTimerIf) => {
        try {

            logger.info(" BotCardPickTurnTimerQueue :: data :: ----->>", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: `botPickCard:${data.tableId}`,
                removeOnComplete: true,
            };

            logger.info('---------------------------------------------');
            logger.info(' BotCardPickTurnTimerQueue --------->>>', queueOption);
            logger.info('---------------------------------------------');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error(" BotCardPickTurnTimerQueue :: ERROR ::----->>>", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new BotCardPickTurnTimerQueue().botCardPickTurnTimerQueue;

