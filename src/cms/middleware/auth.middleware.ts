import jwt from "jsonwebtoken";
import logger from "../../logger";
import RequestWithUser from "../interfaces/requestWithUser.interface";
import { NextFunction, Response } from "express";
import config from '../../connections/config';
import { userDataIf } from "../interfaces/user_interfaces";
import { MESSAGES } from "../../constants";
import { eroorMiddleware } from "./response_middleware";



export const auth = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  const { JWT_SECRET } = config();
  try {
    const token = req.headers?.authorization;
    logger.info("auth :: token :=====>> ", token);
    if (token) {
      const userData = jwt.verify(token, JWT_SECRET) as userDataIf;
      logger.info("auth :: userData :==>> ", userData);
      if (!userData) {
        throw new Error( MESSAGES.ERROR.COMMON_ERROR);

      }
      req.user = userData;
      next();
    }
  } catch (error: any) {
    logger.error("auth :: error :>> ", error);
    return eroorMiddleware(error, req, res, next);
  }
};
