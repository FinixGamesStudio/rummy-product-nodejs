import morgan, { StreamOptions } from 'morgan';
import logger from '../../logger';

const stream: StreamOptions = {
  write: (message) => logger.http(message)
};

// const skip = () => {
//   const env = NODE_ENV || ENVIRONMENT.DEVELOPMENT;
//   return env !== ENVIRONMENT.DEVELOPMENT;
// };

const morganMiddleware = morgan(
  ':method  :url  :status  :res[content-length]  -   :response-time ms',
  { stream,  /*skip  */}
);

export default morganMiddleware;
