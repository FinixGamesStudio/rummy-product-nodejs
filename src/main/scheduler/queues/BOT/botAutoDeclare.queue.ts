import QueueBaseClass from "../queueBaseClass";
import Errors from "../../../errors";
import logger from "../../../../logger";
import botAutoDeclareProcess from "../../processes/BOT/botAutoDeclare.process";
import { botAutoDeclareIf } from "../../../interfaces/botIf";

class BotAutoDeclareQueue extends QueueBaseClass {

    constructor() {
        super("BotAutoDeclareQueue");
        this.queue.process(botAutoDeclareProcess)
    }
    botAutoDeclareQueue = async (data: botAutoDeclareIf) => {
        try {

            logger.info(" BotAutoDeclareQueue :: data :: ----->>", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: `botAutoDeclare:${data.tableId}`,
                removeOnComplete: true,
            };

            logger.info('---------------------------------------------');
            logger.info(' BotAutoDeclareQueue --------->>>', queueOption);
            logger.info('---------------------------------------------');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error(" BotAutoDeclareQueue :: ERROR ::----->>>", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new BotAutoDeclareQueue().botAutoDeclareQueue;

