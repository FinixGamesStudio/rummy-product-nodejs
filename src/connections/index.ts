import httpServer from "./http"
import rdsOps from './redis';
import socketOps from './socket';
import config from './config';
import mongo from './mongo';
import cms_mongoDB from './mongodb_cms'

const exportObject = {
    httpServer,
    rdsOps,
    socketOps,
    config,
    mongo,
    cms_mongoDB
}

export = exportObject