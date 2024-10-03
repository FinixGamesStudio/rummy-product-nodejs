import logger from "../../../../logger";
import QueueBaseClass from "../../queues/queueBaseClass";

class FindBotTimerCancel extends QueueBaseClass {
    constructor() {
        super("FindBotTimerQueue");
    }

    findBotTimerCancel = async (jobId: any) => {
        try {
            const jobData = await this.queue.getJob(jobId)
            logger.debug('------>> FindBotTimerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> FindBotTimerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> FindBotTimerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> FindBotTimerCancel :: JOB NOT AVAILABLE :: ");
            }

            return jobData;
            
        } catch (error) {
            logger.error('CATCH_ERROR : FindBotTimerCancel ----:', jobId, error);
        }
    }
}

export = new FindBotTimerCancel().findBotTimerCancel;