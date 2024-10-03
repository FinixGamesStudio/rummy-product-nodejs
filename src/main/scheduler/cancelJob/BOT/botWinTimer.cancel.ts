import logger from "../../../../logger";
import QueueBaseClass from "../../queues/queueBaseClass";

class BotWinTimerCancel extends QueueBaseClass {
    constructor() {
        super("BotWinTimerQueue");
    }

    botwinTimerCancel = async (jobId: any) => {
        try {
            const jobData = await this.queue.getJob(jobId)
            logger.debug('------>> botwinTimerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> botwinTimerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> botwinTimerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> botwinTimerCancel :: JOB NOT AVAILABLE :: ");
            }

            return jobData;
            
        } catch (error) {
            logger.error('CATCH_ERROR : botwinTimerCancel ----:', jobId, error);
        }
    }
}

export = new BotWinTimerCancel().botwinTimerCancel;