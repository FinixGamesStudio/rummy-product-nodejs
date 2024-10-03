import { EVENT_EMITTER } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";

async function botTurnTimerProcess(job: any) {
    try {
        logger.info("------->> botTurnTimerProcess :: JOB :: ", job)
        logger.info("------->> botTurnTimerProcess :: Job Data :: ", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.BOT_TURN_TIMER_EXPIRED, job.data);

    } catch (error) {
        logger.error(" bot Turn Timer Process :: ERROR :: ", error);
        return undefined;
    }
}

export = botTurnTimerProcess;
