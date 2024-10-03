import { EVENT_EMITTER } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";

async function botFinishCardTimerProcess(job: any) {
    try {
        logger.info("------->> botFinishCardTimerProcess :: JOB :: ", job)
        logger.info("------->> botFinishCardTimerProcess :: Job Data :: ", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.BOT_FINISH_CARD_TIMER_EXPIRED, job.data);

    } catch (error) {
        logger.error(" bot Finish Card Timer Process :: ERROR :: ", error);
        return undefined;
    }
}

export = botFinishCardTimerProcess;
