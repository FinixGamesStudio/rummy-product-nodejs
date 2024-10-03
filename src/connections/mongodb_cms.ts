import logger from "../logger";
import config = require('./config');
import { connect, ConnectOptions} from 'mongoose';

const {MONGO_URL,DB_NAME,MONGO_SRV}=config()
class MongoConnection{

    async init(): Promise<void> {
      try {
        logger.info('MONGO_SRV :==>> ', MONGO_SRV);

        // const mongoUrl = `${MONGO_URL}${DB_NAME}`
        const mongoUrl = `${MONGO_SRV}`

        console.log("---------------",mongoUrl)
  
        await connect(mongoUrl, {
          useUnifiedTopology: true
        } as ConnectOptions);
  
        // set('debug', true);
  
        logger.info('MongoDB Connected successfully.........');
      } catch (err) {
  
        logger.info(err);
        process.exit(0);
      }
  
    }
    
  }
  
  export = new MongoConnection();