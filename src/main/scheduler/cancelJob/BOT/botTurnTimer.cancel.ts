import logger from "../../../../logger";
import QueueBaseClass from "../../queues/queueBaseClass";

class BotTurnTimerCancel extends QueueBaseClass {
    constructor() {
        super("BotTurnTimerQueue");
    }

    botTurnTimerCancel = async (jobId: any) => {
        try {
            const jobData = await this.queue.getJob(jobId)
            logger.debug('------>> BotTurnTimerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> BotTurnTimerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> BotTurnTimerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> BotTurnTimerCancel :: JOB NOT AVAILABLE :: ");
            }

            return jobData;
            
        } catch (error) {
            logger.error('CATCH_ERROR : BotTurnTimerCancel ----:', jobId, error);
        }
    }
}

export = new BotTurnTimerCancel().botTurnTimerCancel;