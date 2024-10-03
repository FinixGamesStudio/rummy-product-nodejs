import { NextFunction, Request, Response } from "express";
import { MESSAGES, STATUS_CODE } from "../../constants";

interface ErrorHttpException {
  status?: number;
  message?: string;
}

export const eroorMiddleware = (
  error: ErrorHttpException,
  req: Request,
  res: Response,
  next: NextFunction
): boolean => {
  const statusCode =
    res.statusCode || error.status || STATUS_CODE.INTERNAL_SERVER_ERROR;
  const message = error.message || MESSAGES.ERROR.COMMON_ERROR;
  res.status(statusCode).send({
    message,
    status: MESSAGES.ERROR.MSG_ERROR,
    success: false,
    statusCode,
  });
  return false;
};

interface SuccessHttpException {
  status?: number;
  message?: string;
  data: any;
}

export const successMiddleware = (
  success: SuccessHttpException,
  req: Request,
  res: Response,
  next: NextFunction
): boolean => {
  const statusCode = success.status || STATUS_CODE.OK;
  const message = success.message || MESSAGES.successMessages.SUCCESSFUL;

  res.status(statusCode).send({
    message,
    status: MESSAGES.successMessages.SUCCESS,
    statusCode,
    success: true,
    data: success.data,
  });
  return false;
};

export const successPopupMiddleware = (
  success: SuccessHttpException,
  req: Request,
  res: Response,
  next: NextFunction
): boolean => {
  const statusCode =
    res.statusCode || success.status || STATUS_CODE.INTERNAL_SERVER_ERROR;
  const message = success.message || MESSAGES.ERROR.COMMON_ERROR;
  res.status(statusCode).send({
    message,
    status: MESSAGES.ERROR.MSG_ERROR,
    success: false,
    statusCode,
    data: success.data,
  });
  return false;
};
