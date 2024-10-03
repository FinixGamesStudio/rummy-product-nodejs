import Bull from "bull";
import config from "../../../connections/config";
import logger from "../../../logger";
import url from "url";
class QueueBaseClass {
    public queue: any;

    constructor(queueName: string) {
        const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB, NODE_ENV, REDIS_CONNECTION_URL } = config();

        const redisConfig: {
            host: string,
            port: number,
            db: number,
            password?: string
        } = {
            host: REDIS_HOST,
            port: REDIS_PORT,
            db: REDIS_DB
        }

        if (REDIS_PASSWORD !== "") {
            redisConfig.password = REDIS_PASSWORD
        }

        if (NODE_ENV === "PRODUCTION") {
            logger.info(`------>> QueueBaseClass :: URL :: `, REDIS_CONNECTION_URL);
            let { port, hostname, auth }: any = url.parse(REDIS_CONNECTION_URL);
            logger.info(`------->> QueueBaseClass :: port :: ${port} :: hostname :: ${hostname} :: auth :: ${auth}`);
            this.queue = new Bull(queueName, { redis: { host: hostname, port: port, db: Number(REDIS_DB) } })
        } else {
            this.queue = new Bull(queueName, { redis: redisConfig })
        }
    }
}

export default QueueBaseClass;