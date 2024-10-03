import { NextFunction, Request, Response } from "express";
import logger from "../../../logger";
import RequestWithUser from "../../interfaces/requestWithUser.interface";
import UserModel from "../../model/user_model";
import { User } from "../../interfaces/user_interfaces";
import { DB } from "../../mongoDBServices";
import AvatarModel from "../../model/avatar.modelSchema";
import { NUMERICAL } from "../../../constants";
import { Avatar, avatarList } from "../../interfaces/avatars.interface";
import { successMiddleware } from "../../middleware/response_middleware";
import successMessages from "../../../constants/messages/successMessages";
import { validateRequest } from "../../middleware/validate.middleware";
import { buyAvatarValidator, useAvatarValidator } from "../../validation/avatars.validation";
import { commonPopup, lowBalancePopup } from "../../common/popUp";


async function getAllAavatar(req:Request , res:Response , next:NextFunction){
try {
    logger.info("== :::: * getAllAavatar * :::: == :: request :===>> ", req.body);
    const request = req as RequestWithUser
    const userId = request.user?._id;
    logger.info("getAllAvatar :: userId :=>> ", userId);

    const findUser: User = await DB.findOne(UserModel, {
      query: { _id: userId },
    });
    logger.info("findUser ::==>> ", findUser);
    if (!findUser) {
      // throw new Error(`Can not found user for rummy game`);
      // popuop send not user Found
       return commonPopup(req,res,next)
    }

       //get all avatar
       const getAvatars = await DB.find(AvatarModel, {
        query: {},
        select: 'avatarImage isFree coins'
      });
  
      if (!getAvatars || getAvatars.length === NUMERICAL.ZERO) {
        throw new Error(`Can not found avatar for rummy game`);
      }
      let avatarList: avatarList[] = JSON.parse(JSON.stringify(getAvatars));
      logger.info(" avatarList :: ==>> 1", avatarList);

      for (let i = 0; i < avatarList.length; i++) {
        if (findUser.coins > avatarList[i].coins) {
          avatarList[i].isCanBuy = true;
        } else {
          avatarList[i].isCanBuy = false;
        }
        avatarList[i].isPurchase = findUser.purchaseAvatars.includes(avatarList[i]._id);
        avatarList[i].isUsedAvatar = (avatarList[i]._id == findUser.useAvatar);
      }
      logger.info(" avatarList :: ==>> 2 ", avatarList);
  
      return successMiddleware(
        {
          message: successMessages.COMMON.UPDATE_SUCCESS.replace(
            ":attribute",
            "Avatar"
          ),
          data: avatarList,
        },
        req,
        res,
        next
      );

} catch (error:any) {
    logger.error("CATCH :: getAllAavatar :: ERROR :: error ::>>", error);
    logger.error(
      "CATCH :: getAllAavatar :: ERROR :: err.message ::>> ",
      error?.message
    );
    return next(error);
}
}

async function useAvatar(req:Request , res:Response, next:NextFunction) {
    try {
        logger.info("== :::: * useAvatar * :::: == :: request :===>> ", req.body);

        const request = req as RequestWithUser;
        const userId = request.user?._id;
        logger.info("useAvatar :: userId :=>> ", userId);

        let { data } = request.body;
        let bodyData = (typeof data === 'string') ? JSON.parse(data) : data;
        const validated = await validateRequest(useAvatarValidator, bodyData);
    
        const { avatarId } = bodyData;
        //get avatar
        const getAvatars : Avatar = await DB.findOne(AvatarModel, { query: {_id : avatarId} } );
        logger.info("buyAvatar :: getAvatars ::>> ", getAvatars);

        const findUser: User = await DB.findOne(UserModel, {
          query: { _id: userId },
        });
        logger.info("buyAvatar :: findUser ::>> ", findUser);
        if (!findUser) {
          // throw new Error(`Can not found user for rummy game`);
           // popuop send not user Found
           return commonPopup(req,res,next)
        }
        if (findUser.useAvatar == avatarId) {
            throw new Error(`this avatar already used.`);
          }

          if (!findUser.purchaseAvatars.includes(avatarId)) {
            throw new Error(`Not purchased this avatar. Please purchase !!`);
          }
        let updateAvtar = {
        useAvatar: avatarId,
        avatarName:getAvatars.avatarName
        }
        logger.info("useAvatar :: updateAvtar ::>> ", updateAvtar);
        
          // update avatar data into user table
          const updatedUser = await DB.findOneAndUpdate(UserModel, {
            query: { _id: userId },
            updateData: updateAvtar
          });
          logger.info("useAvatar :: updatedUser ::>> ", updatedUser);

          const responseData = {
            // tableData: {},
            serverPopupData:{},
            userData: updatedUser
          };
      
          return successMiddleware(
            {
              message: successMessages.COMMON.UPDATE_SUCCESS.replace(
                ":attribute",
                "Avatar used"
              ),
              data: responseData,
            },
            req,
            res,
            next
          );        
    } catch (error:any) {
        logger.error("CATCH :: useAvatar :: ERROR :: error ::>>", error);
        logger.error(
         "CATCH :: useAvatar :: ERROR :: err.message ::>> ",
         error?.messages
    );
    return next(error);
  }
}
    
async function buyAvatar(req:Request, res:Response, next:NextFunction) {
    try {
        logger.info("== :::: * buyAvatar * :::: == :: request :===>> ", req.body);

        const request = req as RequestWithUser;
        const userId = request.user?._id;
        logger.info("buyAvatar :: userId :=>> ", userId);
    
        let { data } = request.body;
        let bodyData = (typeof data === 'string') ? JSON.parse(data) : data;
        const validated = await validateRequest(buyAvatarValidator, bodyData);
    
        const { avatarId } = bodyData;

        //get avatar
         const getAvatars : Avatar = await DB.findOne(AvatarModel, { query: {_id : avatarId} } );
         logger.info("buyAvatar :: getAvatars ::>> ", getAvatars);

         if (!getAvatars) {
         throw new Error(`Can not found avatar for rummy game`);
         }
        const findUser: User = await DB.findOne(UserModel, {
            query: { _id: userId },
          });
          logger.info("buyAvatar :: findUser ::>> ", findUser);
          if (!findUser) {
            // throw new Error(`Can not found user for rummy game`);
            // popuop send not user Found
           return commonPopup(req,res,next)
          }
          logger.info("buyAvatar :: findUser.useAvatar ", findUser.useAvatar);
          logger.info("buyAvatar ::  avatarId :=>> ",  avatarId);
          logger.info("buyAvatar :: findUser.useAvatar === avatarId :=>> ", findUser.useAvatar === avatarId);

          if (findUser.useAvatar === avatarId) {
            throw new Error(`this avatar already used. not need to buy again !`);
          }
          logger.info("buyAvatar :: findUser.purchaseAvatars :=>> ", findUser.purchaseAvatars);
          logger.info("buyAvatar :: findUser.purchaseAvatars.includes(avatarId) :=>> ", findUser.purchaseAvatars.includes(avatarId));

          if (findUser.purchaseAvatars.includes(avatarId)) {
            throw new Error(`this avatar already. not need to buy again !`);
          }

          logger.info("buyAvatar :: findUser.coins < getAvatars.coins :=>> ", findUser.coins < getAvatars.coins);
          logger.info("buyAvatar :: findUser.coins  :=>> ", findUser.coins);
          logger.info("buyAvatar :: getAvatars.coins :=>> ",  getAvatars.coins);
          if(findUser.coins < getAvatars.coins){
            // throw new Error(`this avatar not  buy Please check your balance !`);
            return lowBalancePopup(req,res,next)

          }
      
          // update Avatar Data into user table
          const updatedUser = await DB.findOneAndUpdate(UserModel, {
            query: { _id: userId },
            updateData: { $push: { purchaseAvatars: avatarId } , $inc : { coins : -getAvatars.coins.toFixed(2) }}
          });
          logger.info("buyAvatar :: updatedUser ::>> ", updatedUser);

          const responseData = {
            // tableData: {},
            serverPopupData:{},
            userData: updatedUser
          };
      
          return successMiddleware(
            {
              message: successMessages.COMMON.UPDATE_SUCCESS.replace(
                ":attribute",
                "Avatar buy"
              ),
              data: responseData,
            },
            req,
            res,
            next
          );    
    } catch (error:any) {
        logger.error("CATCH :: addCoins :: ERROR :: error ::>>", error);
        logger.error(
          "CATCH :: addCoins :: ERROR :: err.message ::>> ",
          error?.message
        );
        return next(error);
    }
    
}

const exportObj = {
    getAllAavatar,
    useAvatar,
    buyAvatar
  };
  export = exportObj;