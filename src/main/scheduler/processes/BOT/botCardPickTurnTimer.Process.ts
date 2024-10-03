import { EVENT_EMITTER } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";

async function botCardPickTurnTimerProcess(job: any) {
    try {
        logger.info("------->> botCardPickTurnTimerProcess :: JOB :: ", job)
        logger.info("------->> botCardPickTurnTimerProcess :: Job Data :: ", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.BOT_CARD_PICK_TURN_TIMER_EXPIRED, job.data);

    } catch (error) {
        logger.error(" bot Card Pick Turn Timer Process Process :: ERROR :: ", error);
        return undefined;
    }
}

export = botCardPickTurnTimerProcess;
