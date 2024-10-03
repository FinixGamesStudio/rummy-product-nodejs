import { NextFunction, Request, Response } from "express";
import logger from "../../../logger";
import { validateRequest } from "../../middleware/validate.middleware";
import { User } from "../../interfaces/user_interfaces";
import { DB } from "../../mongoDBServices";
import UserModel from "../../model/user_model";
import { successMiddleware } from "../../middleware/response_middleware";
import successMessages from "../../../constants/messages/successMessages";
import RequestWithUser from "../../interfaces/requestWithUser.interface";
import { addCoinsValidator } from "../../validation/inAppPurches.validation";
import { InAppStore } from "../../interfaces/inAppStore.interface";
import InAppStoreModel from "../../model/inAppStore.model";

async function addCoins(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info("== :::: * addCoins * :::: == :: request :===>> ", req.body);
      const request = req as RequestWithUser;
      const userId = request.user?._id;
      logger.info("addCoins :: userId :=>> ", userId);
  
      let{data}=req.body;
      let bodyData = (typeof data === 'string') ? JSON.parse(data) : data;

      const validated = await validateRequest(addCoinsValidator, bodyData);
  
      const { coins } = bodyData;
  
      logger.info("addCoins :: coins :=>> ", coins, typeof coins);
  
      let updateData = { $inc: { coins: coins } };
      logger.info(" addCoins :: updateData :: ==>> ", updateData);
  
      // add coins into users table.
      const updatedUser: User = await DB.findOneAndUpdate(UserModel, {
        query: { _id: userId },
        updateData: updateData,
      });
      logger.info(" addCoins :: updatedUser :: ==>> ", updatedUser);
  
      const userData = { coins: updatedUser.coins };
  
      logger.info(" addCoins :: userData :: ==>> ", userData);
  
      return successMiddleware(
        {
          message: successMessages.COMMON.UPDATE_SUCCESS.replace(
            ":attribute",
            "Coins"
          ),
          data: userData,
        },
        req,
        res,
        next
      );
    } catch (error: any) {
      logger.error("CATCH :: addCoins :: ERROR :: error ::>>", error);
      logger.error(
        "CATCH :: addCoins :: ERROR :: err.message ::>> ",
        error?.message
      );
      return next(error);
    }
  }  

  /*================== only for standalone ================*/
  async function getAppStoreList(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      logger.info("getAppStoreList :: request.body :=>> ", req.body);
      const request = req as RequestWithUser;
      const userId = request.user?._id;
  
      // get In-app Store from table.
      const getAppStoreList: InAppStore = await DB.find(InAppStoreModel, {
        query: {},
        select: 'packageId inAppStoreImage price coins'
      });
      logger.info(" getAppStoreList :: ==>> ", getAppStoreList);
  
      return successMiddleware(
        {
          message: successMessages.COMMON.FETCH_SUCCESS.replace(
            ":attribute",
            "In-App Store"
          ),
          data: getAppStoreList,
        },
        req,
        res,
        next
      );
    } catch (error: any) {
      logger.error("CATCH :: addCoins :: ERROR :: error ::>>", error);
      logger.error(
        "CATCH :: addCoins :: ERROR :: err.message ::>> ",
        error?.message
      );
      return next(error);
    }
  }  

 


  const exportObj = {
    addCoins,
    getAppStoreList

}
export = exportObj