import { EVENT_EMITTER } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";

async function botAutoDeclareProcess(job: any) {
    try {
        logger.info("------->> botAutoDeclareProcess :: JOB :: ", job)
        logger.info("------->> botAutoDeclareProcess :: Job Data :: ", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.BOT_AUTO_DECLARE, job.data);

    } catch (error) {
        logger.error(" bot Auto Declare Process :: ERROR :: ", error);
        return undefined;
    }
}

export = botAutoDeclareProcess;
