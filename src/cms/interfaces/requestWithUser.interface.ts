import { Request } from 'express';
import { userDataIf } from './user_interfaces';

interface RequestWithUser extends Request {
  user?: userDataIf;
}

export default RequestWithUser;
