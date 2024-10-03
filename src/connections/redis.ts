// const redis = require('redis');
import { createClient } from 'redis';
import logger from '../logger';
import { Redis } from '../main';
import getConfig from './config';
const Redlock = require("redlock")

let connectionsMap: any = null;

const connectionCallback = async () => {
    return new Promise(async (resolve, reject) => {
        const {
            REDIS_HOST,
            REDIS_PASSWORD,
            REDIS_PORT,
            REDIS_DB,
            PUBSUB_REDIS_HOST,
            PUBSUB_REDIS_PORT,
            PUBSUB_REDIS_PASSWORD,
            PUBSUB_REDIS_DB,
            NODE_ENV,
            REDIS_CONNECTION_URL
        } = getConfig();

        let counter = 0;
        const redisConfig: {
            socket: {
                host: string,
                port: number
            },
            database: number,
            password?: string
        } = {
            socket: {
                host: REDIS_HOST,
                port: REDIS_PORT,
            },
            database: REDIS_DB,
        };

        const pubSubRedisConfig: {
            socket: {
                host: string,
                port: number
            },
            database: number,
            password?: string
        } = {
            socket: {
                host: PUBSUB_REDIS_HOST,
                port: PUBSUB_REDIS_PORT,
            },
            database: PUBSUB_REDIS_DB,
        };

        if (REDIS_PASSWORD !== "") {
            redisConfig.password = REDIS_PASSWORD;
        }

        if (PUBSUB_REDIS_PASSWORD !== "") {
            pubSubRedisConfig.password = REDIS_PASSWORD;
        }

        logger.info('redis :: data :: ', redisConfig);
        logger.info('redis pubsub ::  data :: ', pubSubRedisConfig);

        let client: any = null;
        let pubClient: any = null;
        if (NODE_ENV === "PRODUCTION") {
            logger.info(`------>> redis :: URL :: `, REDIS_CONNECTION_URL);
            logger.info(`----->> redis :: URL :: ${REDIS_CONNECTION_URL}/${Number(REDIS_DB)}`)
            client = createClient({ url: `${REDIS_CONNECTION_URL}/${Number(REDIS_DB)}` });
            pubClient = createClient({ url: `${REDIS_CONNECTION_URL}/${Number(REDIS_DB)}` });

        } else {
            client = createClient(redisConfig);
            pubClient = createClient(redisConfig);

        }

        const subClient = pubClient.duplicate();

        async function check() {
            if (counter === 2) {

                connectionsMap = { client, pubClient, subClient };
                const flushDB = await client.flushDb();
                logger.info('redis data :: flushDb ::', flushDB);
                resolve(connectionsMap);
            }
        }

        client.on('ready', () => {
            logger.info('Redis connected successfully.');
            Redis.init(client);
            counter += 1;
            check();
        });

        client.on('error', (error: any) => {
            console.log('CATCH_ERROR : Redis Client error:', error)
            logger.error('CATCH_ERROR : Redis Client error:', error);
            reject(error);
        });

        pubClient.on('ready', () => {
            logger.info('pubClient connected successfully.');
            counter += 1;
            check();
        });

        pubClient.on('error', (error: any) => {
            console.log('CATCH_ERROR : Redis Pub Client error:', error)
            logger.error('CATCH_ERROR : pubClient Client error:', error);
            reject(error);
        });

        await client.connect();
        await pubClient.connect();
        await subClient.connect();

    });                                                             
}

let redlock: any = null;

const init = async () => connectionsMap || connectionCallback();

export default { init };



