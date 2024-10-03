import logger from "../../../../logger";
import QueueBaseClass from "../../queues/queueBaseClass";

class BotFinishCardTimerCancel extends QueueBaseClass {
    constructor() {
        super("BotFinishCardTimerQueue");
    }

    botFinishCardTimerCancel = async (jobId: any) => {
        try {
            const jobData = await this.queue.getJob(jobId)
            logger.debug('------>> botFinishCardTimerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> botFinishCardTimerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> botFinishCardTimerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> botFinishCardTimerCancel :: JOB NOT AVAILABLE :: ");
            }

            return jobData;
            
        } catch (error) {
            logger.error('CATCH_ERROR : botFinishCardTimerCancel ----:', jobId, error);
        }
    }
}

export = new BotFinishCardTimerCancel().botFinishCardTimerCancel;