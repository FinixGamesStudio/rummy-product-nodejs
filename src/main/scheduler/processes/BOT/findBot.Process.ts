import { EVENT_EMITTER } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";

async function findBotTimerProcess(job: any) {
    try {
        logger.info("------->> findBotTimerProcess :: JOB :: ", job)
        logger.info("------->> findBotTimerProcess :: Job Data :: ", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.FIND_BOT_TIMER_EXPIRED, job.data);

    } catch (error) {
        logger.error("find Bot Timer Process :: ERROR :: ", error);
        return undefined;
    }
}

export = findBotTimerProcess;
