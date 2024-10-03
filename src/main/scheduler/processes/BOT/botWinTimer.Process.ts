import { EVENT_EMITTER } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";

async function botWinTimerProcess(job: any) {
    try {
        logger.info("------->> botWinTimerProcess :: JOB :: ", job)
        logger.info("------->> botWinTimerProcess :: Job Data :: ", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.BOT_WIN_TIMER_EXPIRED, job.data);

    } catch (error) {
        logger.error(" bot Win Timer  Process :: ERROR :: ", error);
        return undefined;
    }
}

export = botWinTimerProcess;