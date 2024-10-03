import lock from "./main/lock"
(async () => {
    const config = require("./connections/config");
    const logger = await import("./logger");
    const { socketOps, httpServer, cms_mongoDB, rdsOps } = await import("./connections");
    (async () => {

        try {
            logger.info("--->> config :: ", config())
            const { SERVER_TYPE, HTTP_SERVER_PORT } = config();
            const promise = await Promise.all([
                cms_mongoDB.init(),
                rdsOps.init(),
                socketOps.createSocketServer()
            ]);

            await lock.init();

            httpServer.listen(HTTP_SERVER_PORT, () => {
                logger.info(
                    `${SERVER_TYPE} Server listening to the port ${HTTP_SERVER_PORT}`,
                );
            });
        } catch (error) {
            console.trace(error);
            logger.error(`Server listen error ${error}`);
        }
    })();
    process
        .on('unhandledRejection', (reason, p) => {
            console.log(reason)
            console.log(p)
            logger.error(
                reason,
                'Unhandled Rejection at Promise >> ',
                new Date(),
                ' >> ',
                p,
            );
        })
        .on('uncaughtException', (err) => {
            logger.error('Uncaught Exception thrown', new Date(), ' >> ', '\n', err);
        });
})()