import logger from "../../../../logger";
import QueueBaseClass from "../../queues/queueBaseClass";

class BotCardPickTurnTimerCancel extends QueueBaseClass {
    constructor() {
        super("BotCardPickTurnTimerQueue");
    }

    botCardPickTurnTimerCancel = async (jobId: any) => {
        try {
            const jobData = await this.queue.getJob(jobId)
            logger.debug('------>> botCardPickTurnTimerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> botCardPickTurnTimerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> botCardPickTurnTimerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> botCardPickTurnTimerCancel :: JOB NOT AVAILABLE :: ");
            }

            return jobData;
            
        } catch (error) {
            logger.error('CATCH_ERROR : botCardPickTurnTimerCancel ----:', jobId, error);
        }
    }
}

export = new BotCardPickTurnTimerCancel().botCardPickTurnTimerCancel;