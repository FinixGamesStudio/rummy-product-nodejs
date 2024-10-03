import { NextFunction, Request, Response } from "express";
import bcryptJs from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../../../connections/config";
import logger from "../../../logger";
import RequestWithUser from "../../interfaces/requestWithUser.interface";
import { validateRequest } from "../../middleware/validate.middleware";
import HeadToHeadModel from "../../model/lobby_model";
import { DB } from "../../mongoDBServices";
import { NUMERICAL, USER_CONSTANCE } from "../../../constants";
import { lobbyListIf } from "../../interfaces/headToHead.interface";
import UserModel from "../../model/user_model";
import { successMiddleware } from "../../middleware/response_middleware";
import  successMessages  from "../../../constants/messages/successMessages";
import { privateTableKey } from "../../interfaces/privateTableKey.interface";
import privateTableKeyModel from "../../model/privateTableKey.model";
import { getTableData } from "../../../main/gamePlay/cache/Tables";
import { invalidCodePopup, invalidCodePopupLink } from "../../common/invalidCodePopup";
import { User } from "../../interfaces/user_interfaces";
import formatUserRespose from "../../common/formatUserRespose";
import { getRoundTableData } from "../../../main/gamePlay/cache/Rounds";
import { generateRandomUserNameOnlyCharacter } from "../../common";
import { codeWithLobbyValidator, getLobbyValidator } from "../../validation/lobby.validation";
import { commonPopup } from "../../common/popUp";



async function getLobbys(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info("== :::: * getLobbys * :::: == :: request :===>> ", req.body);
      const request = req as RequestWithUser;
      const userId = request.user?._id;
      logger.info("== :::: * getLobbys * :::: == :: userId :===>>", userId);
  
      let {data}= req.body
      let bodyData = (typeof data === 'string') ? JSON.parse(data) : data;

      const validated = await validateRequest(getLobbyValidator, bodyData);
   
      const { gameTypeName, isCash, gameType, noOfPlayer } = bodyData
      logger.info(
        "getLobbys :: gameTypeName :=>> ",
        gameTypeName,
        typeof gameTypeName,
        " isCash :=>> ",
        isCash,
        typeof isCash,
        " gameType :=>> ",
        gameType,
        typeof gameType,
        " noOfPlayer :=>> ",
        noOfPlayer,
        typeof noOfPlayer
      );
  
      let query = [
        {
          $match: {
            $and: [
              { isCash: isCash },
              { gameType: gameType },
              { maxPlayer: noOfPlayer },
            ],
          },
        },
        {
          $lookup: {
            from: "gamemodes",
            let: { gameModeId: "$gameModeId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$_id", "$$gameModeId"] }],
                  },
                },
              },
              { $project: { gameTypeName: 1 , gameModeName:1} },
            ],
            as: "gameMode",
          },
        },
        {
          $unwind: "$gameMode",
        },
        {
          $project: {
            gameId: 1,
            entryfee: 1,
            gameModeId: 1,
            isCash: 1,
            isUseBot: 1,
            isActive: 1,
            minPlayer: 1,
            maxPlayer: 1,
            platformCommission: 1,
            winningPrice: 1,
            gameTypeName: "$gameMode.gameTypeName",
            gameModeName: "$gameMode.gameModeName",
            gameType: 1,
            isAutoSplit: 1,
          },
        },
        { $match: { gameTypeName: gameTypeName } },
        { $sort: { entryfee: 1 } } // Add this $sort stage to sort by entryfee in ascending order
      ];
      if (gameTypeName === "POINT") {
        query = [
          { $match: { $and: [{ isCash: isCash }, { maxPlayer: noOfPlayer }] } },
          {
            $lookup: {
              from: "gamemodes",
              let: { gameModeId: "$gameModeId" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$_id", "$$gameModeId"] }],
                    },
                  },
                },
                { $project: { gameTypeName: 1, gameModeName: 1 } },
              ],
              as: "gameMode",
            },
          },
          {
            $unwind: "$gameMode",
          },
          {
            $project: {
              gameId: 1,
              entryfee: 1,
              gameModeId: 1,
              isCash: 1,
              isUseBot: 1,
              isActive: 1,
              minPlayer: 1,
              maxPlayer: 1,
              platformCommission: 1,
              winningPrice: 1,
              gameTypeName: "$gameMode.gameTypeName",
              gameModeName: "$gameMode.gameModeName",
              gameType: 1,
              isAutoSplit: 1,
            },
          },
          { $match: { gameTypeName: gameTypeName } },
          { $sort: { entryfee: 1 } } // Add this $sort stage to sort by entryfee in ascending order
        ];
      }
      console.log("---------->> query",JSON.stringify(query))
      const getLobbys = await DB.aggregate(HeadToHeadModel, query);
      logger.info("GetLobby :: ", getLobbys);
      if (!getLobbys || getLobbys.length === NUMERICAL.ZERO) {
        throw new Error(`Can not found lobbys for rummy game`);
      }
    
      let lobbyList: lobbyListIf[] = JSON.parse(JSON.stringify(getLobbys));
  
      const findUser = await DB.findOne(UserModel, { query: { _id: userId } });
      if (!findUser) {
        // throw new Error(`Can not find users for rummy game`);
         // popuop send not user Found
         return commonPopup(req,res,next)
      }
      logger.info("findUser :: ==>> ", findUser);
  
      if (isCash) {
        for (let i = 0; i < lobbyList.length; i++) {
          if (
            findUser.cash + findUser.bonus + findUser.winCash >
            lobbyList[i].entryfee
          ) {
            lobbyList[i].isCanPlay = true;
          } else {
            lobbyList[i].isCanPlay = false;
          }
        }
      } else {
        for (let i = 0; i < lobbyList.length; i++) {
          if (findUser.coins > lobbyList[i].entryfee) {
            lobbyList[i].isCanPlay = true;
          } else {
            lobbyList[i].isCanPlay = false;
          }
        }
      }
      logger.info(" lobbyList :: ==>> ", lobbyList);
  
      return successMiddleware(
        {
          message: successMessages.COMMON.FETCH_SUCCESS.replace(
            ":attribute",
            "Lobby"
          ),
          data: lobbyList,
        },
        req,
        res,
        next
      );
    } catch (error: any) {
      logger.error("CATCH :: getLobbys :: ERROR :: error ::>>", error);
      logger.error(
        "CATCH :: getLobbys :: ERROR :: err.message ::>> ",
        error?.message
      );
      return next(error);
    }
  }


  async function codeWithLobby(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info("codeWithLobby :: req.body :=>> ", req.body);
  
      if (!req.body)
        return res.status(401).send({ message: "Please provide all fields!" });
  
      const { data } = req.body;
      let bodyData = (typeof data === 'string') ? JSON.parse(data) : data;

  
      const validated = await validateRequest(codeWithLobbyValidator, bodyData);
  
      const { isReferralCode, deviceId, deviceType, isLink } = bodyData
  
      logger.info(
        "== :::: * codeWithLobby * :::: ==",
        "deviceId :==>",
        deviceId,
        "isReferralCode :=>> ",
        isReferralCode,
        "deviceType : ==>",
        deviceType,
        "isLink : ==>",
        isLink
      );
  
      const findTable: privateTableKey = await DB.findOne(privateTableKeyModel, {
        query: { isReferralCode },
      });
      logger.info("codeWithLobby :: findTable :=>> ", findTable);
      
      // check TGP
      let tableGamePlay=null;
      if(findTable){
        tableGamePlay = await getTableData(findTable.tableId);
      }
      logger.info("codeWithLobby :: tableGamePlay ::===>> ", tableGamePlay);
  
      if (!findTable || !tableGamePlay) {
        if(isLink){
        // popuop send with join link
         return invalidCodePopupLink(req,res,next)
        }else{
        // popup send without join link
          return invalidCodePopup(req,res,next)
        }
       }
  
      const findUser: User = await DB.findOne(UserModel, {
        query: { deviceId },
      });
      if (!findUser) {
        // throw new Error(`Can not find users for rummy game`);
         // popuop send not user Found
         return commonPopup(req,res,next)
      }
      logger.info("codeWithLobby :: findUser :=>> ", findUser);
  
      let userData: any = {};
      let tableInfo: any = {};
  
      // find roundTable Data
      const roundTableData = await getRoundTableData(
        findTable.tableId,
        tableGamePlay.currentRound
      );
  
  
      logger.info("------>> codeWithLobby :: roundTableData :: ", roundTableData);
  
      logger.info(
        "------->> codeWithLobby :: roundTableData.seats :: ",
        roundTableData.seats
      );
  
  
      tableInfo = {
        lobbyId : findTable.lobbyId,
        gameId : findTable.gameId,
        tableId : findTable.tableId,
        isCreateRoom : findTable.isCreateRoom,
        isReferralCode : findTable.isReferralCode,
        minPlayer: tableGamePlay.minPlayerForPlay,
        maxPlayer: tableGamePlay.maximumSeat,
        entryFee: tableGamePlay.bootAmount,
        isUseBot: false,
        isFTUE: false,
        gameType: tableGamePlay.gameType,
        rummyType: tableGamePlay.rummyType,
        dealType: tableGamePlay.dealType,
       gamePoolType: tableGamePlay.gamePoolType,
  
      }
  
      tableInfo.userDetail = {
          userId : findUser._id,
          username :findUser.userName,
          profilePicture: findUser.profileImage,
          authToken : findUser.token,
          coins:findUser.coins.toFixed(2),
          avatarName:findUser.avatarName
  
      };
     
      logger.info(":: ==> :: codeWithLobby :: tableInfo :=>> ", tableInfo);
  
  
      // const codeWithLobbyData = {
      //   // userData,
      //   tableInfo
      // }
      // logger.info(":: ==> :: codeWithLobby :: codeWithLobbyData :=>> ", codeWithLobbyData);
  
  
      const responseData = {
        tableData: tableInfo,
        serverPopupData: {},
      };
      logger.info(":: ==> :: codeWithLobby :: responseData :=>> ", responseData);
  
      return successMiddleware(
        {
          message: successMessages.COMMON.FETCH_SUCCESS.replace(
            ":attribute",
            "code With Lobby Data"
          ),
          data: responseData,
        },
        req,
        res,
        next
      );
    } catch (error: any) {
      logger.error("CATCH :: codeWithLobby :: ERROR :: error ::>>", error);
      logger.error(
        "CATCH :: codeWithLobby :: ERROR :: err.message ::>> ",
        error?.message
      );
      return next(error);
    }
  }


const exportObj = {
    getLobbys,
    codeWithLobby
}
export = exportObj