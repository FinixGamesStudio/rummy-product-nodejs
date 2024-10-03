import logger from "../../../../logger";
import QueueBaseClass from "../../queues/queueBaseClass";

class BotAutoDeclareCancel extends QueueBaseClass {
    constructor() {
        super("BotAutoDeclareQueue");
    }

    botAutoDeclareCancel = async (jobId: any) => {
        try {
            const jobData = await this.queue.getJob(jobId)
            logger.debug('------>> botAutoDeclareCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> botAutoDeclareCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> botAutoDeclareCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> botAutoDeclareCancel :: JOB NOT AVAILABLE :: ");
            }

            return jobData;
            
        } catch (error) {
            logger.error('CATCH_ERROR : botAutoDeclareCancel ----:', jobId, error);
        }
    }
}

export = new BotAutoDeclareCancel().botAutoDeclareCancel;