import QueueBaseClass from "./../queueBaseClass";
import Errors from "../../../../main/errors"
import findBotTimerProcess from "../../processes/BOT/findBot.Process";
import logger from "../../../../logger";
import { findBotTimerIf } from "../../../interfaces/schedulerIf";

class FindBotTimerQueue extends QueueBaseClass {

    constructor() {
        super("FindBotTimerQueue");
        this.queue.process(findBotTimerProcess)
    }
    findBotTimerQueue = async (data: findBotTimerIf) => {
        try {

            logger.info(" FindBotTimerQueue :: data :: ----->>", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: `botJoinTimer:${data.jobId}`,
                removeOnComplete: true,
            };

            logger.info('---------------------------------------------');
            logger.info(' FindBotTimerQueue --------->>>', queueOption);
            logger.info('---------------------------------------------');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error(" FindBotTimerQueue :: ERROR ::----->>>", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new FindBotTimerQueue().findBotTimerQueue;



