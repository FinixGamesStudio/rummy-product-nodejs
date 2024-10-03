import { NextFunction, Request, Response } from "express";
import bcryptJs from "bcrypt";
import jwt from "jsonwebtoken";
import logger from "../../../logger";
import config from "../../../connections/config";
import { validateRequest } from "../../middleware/validate.middleware";
import {
  editUserValidator,
  getUserDataValidator,
  userValidator,
} from "../../validation/user_validation";
import { User, userDataIf } from "../../interfaces/user_interfaces";
import {
  MESSAGES,
  NUMERICAL,
  PLAYER_STATE,
  TABLE_STATE,
  USER_CONSTANCE,
  USER_GAME_RUNNING_STATUS,
} from "../../../constants";
import { DB } from "../../mongoDBServices";
import UserModel from "../../model/user_model";
import { successMiddleware } from "../../middleware/response_middleware";
import successMessages from "../../../constants/messages/successMessages";
import { generateRandomUserNameOnlyCharacter } from "../../common";
import { UsersGameRunningStatus } from "../../interfaces/usersGameRunningStatus.interface";
import UsersGameRunningStatusModel from "../../model/runningGameStatus.model";
import { getTableData } from "../../../main/gamePlay/cache/Tables";
import { getRoundTableData } from "../../../main/gamePlay/cache/Rounds";
import { getPlayerGamePlay } from "../../../main/gamePlay/cache/Players";
import formatUserRespose from "../../common/formatUserRespose";
import { Avatar } from "../../interfaces/avatars.interface";
import AvatarModel from "../../model/avatar.modelSchema";
import RequestWithUser from "../../interfaces/requestWithUser.interface";
import userAllGameRecordModel from "../../model/playedGamesSchema";
import { playedGames } from "../../interfaces/playedGames";
import playedGamesModel from "../../model/playedGamesSchema";
import { commonPopup } from "../../common/popUp";
import { userDailyActiveStausManage } from "../../helper/userDailyActiveStausManage";
import userDailyActiveStatusModel from "../../model/userDailyActiveStatus.model";

async function userRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const { JWT_SECRET } = config();
    logger.info(
      "== :::: * userRegister * :::: == :: request :===>> ",
      req.body
    );

    if (!req.body)
      return res.status(401).send({ message: "Please provide all fields!" });

    
    const { data } = req.body;
    let bodyData = (typeof data === 'string') ? JSON.parse(data) : data;
    const validate = validateRequest(userValidator,bodyData);

    const { token, deviceId, deviceType,isLink } = bodyData;

    logger.info(
      "== :::: * userRegister * :::: ==",
      "deviceId :==>",
      deviceId,
      "token :=>> ",
      token,
      "deviceType : ==>",
      deviceType
    );

    if (token) {
      // make Response
      const userData = jwt.verify(token, JWT_SECRET) as userDataIf;
      logger.info("== :::: * userRegister * :::: >> userData ::>> ", userData);
      if (!userData) {
        throw new Error(MESSAGES.ERROR.COMMON_ERROR);
      }

      const getUser: User = await DB.findOne(UserModel, {
        query: { _id: userData._id },
      });

      logger.info("== :::: * userRegister * :::: >> getUser :==>> ", getUser);

      if (!getUser) {
        // throw new Error(MESSAGES.ERROR.COMMON_ERROR);
          // popuop send not user Found
          return commonPopup(req,res,next)
      }

      const data = formatUserRespose(getUser);
      logger.info(
        "--------->> userRegister :: getUser :: :: defaultRegisterUser :: ",
        data
      );

      //Manage user daily active staus
       await userDailyActiveStausManage(getUser._id);

      const responseData = {
        // tableData: {},
        serverPopupData:{},
        userData: data
      };

      if (getUser) {
        return successMiddleware(
          {
            message: successMessages.COMMON.CREATE_SUCCESS.replace(
              ":attribute",
              "User"
            ),
            data: responseData,
          },
          req,
          res,
          next
        );
      }
    } else {
      const findUser: User = await DB.findOne(UserModel, {
        query: { deviceId },
      });
      logger.info(
        "== :::: * userRegister * :::: >>findUser ::===>> ",
        findUser
      );

      if (findUser) {
        const data = formatUserRespose(findUser);
        logger.info(
          "--------->> userRegister :: findUser :: defaultRegisterUser :: ",
          data
        );

       //Manage user daily active staus
       await userDailyActiveStausManage(findUser._id);

        const responseData = {
          // tableData: {},
          serverPopupData:{},
          userData: data
        };

        return successMiddleware(
          {
            message: successMessages.COMMON.CREATE_SUCCESS.replace(
              ":attribute",
              "User"
            ),
            data: responseData,
          },
          req,
          res,
          next
        );
      } else {
        // create a new user
        const userName = await getUniqueUserName();
        logger.info(
          "== :::: * userRegister * :::: >>username ::===>> ",
          userName
        );

         //get free avatar
         const freeAvatar: Avatar = await DB.findOne(AvatarModel, {
          query: { isFree: true },
          select: 'avatarImage isFree coins'
        });

        const nickName = await getUniqueUserName();
        logger.info(
          "== :::: * userRegister * :::: >>nickName ::===>> ",
          nickName
        );
        const signUpCoins = USER_CONSTANCE.SIGNUP_COIN;
        const signUpBonus = USER_CONSTANCE.SIGNUP_BONUS;
        const signUpCash = USER_CONSTANCE.SIGNUP_CASH;

        let password: string = "123";
        const salt = await bcryptJs.genSalt(10);
        const hashPassword = await bcryptJs.hash(password, salt);

        let user = new UserModel({
          email: `${userName}@gmail.com`,
          phoneNumber: "9898989898",
          profileImage: freeAvatar.avatarImage || USER_CONSTANCE.DEFAULT_USER_AVATAR, //default avatar image
          userName,
          nickName,
          deviceId,
          deviceType:"Android",
          password: hashPassword,
          role: USER_CONSTANCE.ROLES.USER,
          bonus: signUpBonus,
          winCash: NUMERICAL.ZERO,
          cash: signUpCash,
          coins: signUpCoins,
          totalDeposits: 0,
          totalWithdrawals: 0,
          timeZone: "Asia/Kolkata",
          useAvatar: freeAvatar._id,
          purchaseAvatars: [freeAvatar._id],
          avatarName: freeAvatar.avatarName
        });

        logger.info(
          "== :::: * userRegister * :::: >>user ::===>>  :=>> ",
          user
        );

        const token = await jwt.sign(
          {
            _id: user._id /*role: USER_CONSTANCE.ROLES.USER*/,
            deviceType: deviceType,
            deviceId: deviceId,
          },
          String(JWT_SECRET)
        );
        logger.info(
          "== :::: * userRegister * :::: >>token ::===>>  :=>> ",
          token
        );
        user.token = token;

        let createUser: User = await DB.create(UserModel, {
          insert: user,
        });
        logger.info(
          "== :::: * userRegister * :::: >>createUser ::===>>  ",
          createUser
        );

        // add record into user game Record 
        const userGameRecord = await DB.create(userAllGameRecordModel, {
        insert: {
        userId: createUser._id,
       status:{
         won:NUMERICAL.ZERO,
         loss:NUMERICAL.ZERO,
         tie:NUMERICAL.ZERO
       }
  
        }
       });
       logger.info('----->> userRegister :: userGameRecord ::',userGameRecord);
        
       // default data add user Daily Active Status
       await DB.create(userDailyActiveStatusModel, {
        insert: {
          userId: createUser._id,
        }
      });


        const data = await formatUserRespose(createUser);
        logger.info(
          "--------->> userRegister :: createUser:: defaultRegisterUser :: ",
          data
        );

        const responseData = {
          // tableData: {},
          serverPopupData:{},
          userData: data
        };

        if (createUser) {
          return successMiddleware(
            {
              message: successMessages.COMMON.CREATE_SUCCESS.replace(
                ":attribute",
                "User"
              ),
              data: responseData,
            },
            req,
            res,
            next
          );
        }
      }
    }
  } catch (error: any) {
    logger.error("CATCH :: userRegister :: ERROR :: error ::>>", error);
    logger.error(
      "CATCH :: userRegister :: ERROR :: err.message ::>> ",
      error?.message
    );
    return next(error);
  }
}

async function getUniqueUserName() {
  let userName = "";

  while (true) {
    userName = await generateRandomUserNameOnlyCharacter(10).toString();

    const isUser = await DB.findOne(UserModel, {
      query: {
        fullName: { $regex: new RegExp(`^${userName}$`), $options: "i" },
      },
    });

    if (!isUser) {
      break;
    }
  }

  return userName;
}

async function runningGame(req: Request, res: Response, next: NextFunction) {
  try {
    logger.info("runningGame :: req.body :=>> ", req.body);

    logger.info("runningGame :: req.headers :=>> ", req.headers);
    const deviceId = req.headers?.deviceid;
    logger.info("runningGame :: deviceId :=>> ", deviceId);

    let isRegister = false;
    let isRunningGame: boolean = false;

    const findUser: User = await DB.findOne(UserModel, {
      query: { deviceId },
    });
    logger.info("runningGame :: findUser :=>> ", findUser);

    if (!findUser) {
      const userGameRunningData = {
        isRunningGame,
        isRegister,
        tableData: {},
      };

      logger.info(
        "runningGame :: userGameRunningData  :: ===>>> ",
        userGameRunningData
      );
      return successMiddleware(
        {
          message: successMessages.COMMON.FETCH_SUCCESS.replace(
            ":attribute",
            "Running Game"
          ),
          data: userGameRunningData,
        },
        req,
        res,
        next
      );
    }

    if (findUser) {
      isRegister = true;
    }

    const userId = findUser._id;
    logger.info("runningGame :: userId :=>> ", userId);

    const gameRunnigStatus = USER_GAME_RUNNING_STATUS.STATUS_OBJ;

    let query: any = {
      userId: userId,
      status: gameRunnigStatus.running,
    };

    const userGameStatusData: UsersGameRunningStatus[] = await DB.find(
      UsersGameRunningStatusModel,
      { query: query }
    );

    logger.info(
      "runningGame :: usersGameStatusData ::===>> ",
      userGameStatusData
    );

    let tableData: any = {};

    for (let i = 0; i < userGameStatusData.length; i++) {
      const gameStatusRecord = userGameStatusData[i];

      //find TGP
      const tableGamePlay = await getTableData(gameStatusRecord.tableId);
      logger.info("runningGame :: tableGamePlay ::===>> ", tableGamePlay);

      if(!tableGamePlay){
        const userGameRunningData = {
          isRunningGame,
          isRegister,
          tableData: {},
        };
  
        logger.info(
          "runningGame :: userGameRunningData  1 :: ===>>> ",
          userGameRunningData
        );
        return successMiddleware(
          {
            message: successMessages.COMMON.FETCH_SUCCESS.replace(
              ":attribute",
              "Running Game"
            ),
            data: userGameRunningData,
          },
          req,
          res,
          next
        );
      }

      const roundTableData = await getRoundTableData(
        gameStatusRecord.tableId,
        tableGamePlay.currentRound
      );
      logger.info("------>> runningGame :: roundTableData :: ", roundTableData);

      const playerData = await getPlayerGamePlay(
        gameStatusRecord.userId,
        gameStatusRecord.tableId
      );
      console.log("::::::: runningGame :: playerData :::>>>>", playerData);

      if (
        tableGamePlay &&
        // roundTableData.tableState != TABLE_STATE.DISPLAY_SCOREBOARD &&
        playerData &&
        playerData.userStatus !== PLAYER_STATE.LEFT &&
        !playerData.isLeft
      ) {
        isRunningGame = true;
        tableData = {
          isLink:findUser.isLink,
          minPlayer: tableGamePlay.minPlayerForPlay,
          maxPlayer: tableGamePlay.maximumSeat,
          lobbyId: tableGamePlay.lobbyId,
          gameId: tableGamePlay.gameId,
          entryFee: tableGamePlay.bootAmount,
          // winningAmount: Number(tableGamePlay.winPrice),
          isUseBot: false,
          isFTUE: false,
          gameType: tableGamePlay.gameType,
          isCreateRoom: tableGamePlay.isCreateRoom,
          isReferralCode: tableGamePlay.isReferralCode,
          rummyType: tableGamePlay.rummyType,
          dealType: tableGamePlay.dealType +" "+ "Deal",
          gamePoolType: tableGamePlay.gamePoolType +" "+ "pool" ,
        };
        logger.info(
          "------->> runningGame :: roundTableData.seats :: ",
          roundTableData.seats
        );

          tableData.userDetail = {
          userId : findUser._id,
          username :findUser.userName,
          profilePicture: findUser.profileImage,
          authToken : findUser.token,
          coins:findUser.coins.toFixed(2),
          avatarName:findUser.avatarName
         };
        logger.info(
          "runningGame :: tableData.userDetail :: ==>> ",
          tableData.userDetail
        );
        logger.info("runningGame :: tableData :: ==>> ", tableData);

        break;
      } else {
        /* update users game running status to completed */
        let query: any = {
          userId: userId,
          tableId: gameStatusRecord.tableId,
        };
        const usersGameStatus = await DB.deleteOne(
          UsersGameRunningStatusModel,
          {
            query: query,
          }
        );

        logger.info(
          "== :::: * runningGame * :::: >>usersGameStatus ::===>> ",
          usersGameStatus
        );
      }
    }

    const userGameRunningData = {
      isRunningGame,
      isRegister,
      tableData,
    };

    logger.info(
      "runningGame :: userGameRunningData  :: ===>>> ",
      userGameRunningData
    );
    return successMiddleware(
      {
        message: successMessages.COMMON.FETCH_SUCCESS.replace(
          ":attribute",
          "Running Game"
        ),
        data: userGameRunningData,
      },
      req,
      res,
      next
    );
  } catch (error: any) {
    logger.error("CATCH :: runningGame :: ERROR :: error ::>>", error);
    logger.error(
      "CATCH :: runningGame :: ERROR :: err.message ::>> ",
      error?.message
    );
    return next(error);
  }
}

async function editUserData(req: Request, res:Response, next: NextFunction) {
  try {
    logger.info("editUserData :: req.body :=>> ", req.body);

  if (!req.body)
    return res.status(401).send({ message: "Please provide all fields!" });

  const request = req as RequestWithUser;
  const userId = request.user?._id;
  logger.info("editUserData :: userId :=>> ", userId);  

  const { data } = req.body;
  let bodyData = (typeof data === 'string') ? JSON.parse(data) : data;

  const validated = await validateRequest(editUserValidator,bodyData);

  const { userName  } = bodyData;

  logger.info(
    "== :::: * editUserData * :::: ==",
    "userName :=>> ",
    userName
  );

  const findUser: User = await DB.findOne(UserModel, {
    query: { _id: userId },
  });
  logger.info(" editUserData :: findUser ::>> ", findUser);
  if (!findUser) {
    // throw new Error(`Can not found user for Rummy game`);
    // popuop send not user Found
    return commonPopup(req,res,next)
  }

  let updateData = {
    userName : userName
  }
    // update userName into user table
  const updatedUser: User = await DB.findOneAndUpdate(UserModel, {
    query: { _id: userId },
    updateData: updateData,
  });
  logger.info(" editUserData :: updatedUser :: ==>> ", updatedUser);

   //get userPlayed Game
 const getUserPlayedGame : playedGames = await DB.findOne(playedGamesModel, { query: {userId : findUser._id} } );
 logger.info("editUserData :: getUserPlayedGame ::>> ", getUserPlayedGame);

 let userTotalPlayGame  =  getUserPlayedGame.status.loss +  getUserPlayedGame.status.win + getUserPlayedGame.status.tie
 logger.info("editUserData :: userTotalPlayGame ::>> ", userTotalPlayGame);

 let UserData ={
  user : updatedUser,
  totalGames : userTotalPlayGame ,
  wonGames : getUserPlayedGame.status.win ,
  lossGames : getUserPlayedGame.status.loss ,
  tieGames : getUserPlayedGame.status.tie 
 }

 logger.info("editUserData :: UserData ::>> ", UserData);

  return successMiddleware(
    {
      message: successMessages.COMMON.UPDATE_SUCCESS.replace(
        ":attribute",
        "UserDetail"
      ),
      data: UserData,
    },
    req,
    res,
    next
  );
  } 
    catch (error: any) {
      logger.error("CATCH :: runningGame :: ERROR :: error ::>>", error);
      logger.error(
        "CATCH :: runningGame :: ERROR :: err.message ::>> ",
        error?.message
      );
      return next(error);
    } 

}

async function getUserData(req:Request, res:Response, next:NextFunction){
  logger.info("getUserData :: req.body :=>> ", req.body);
  
  if (!req.body)
  return res.status(401).send({ message: "Please provide all fields!" });

  const { data } = req.body;
  let bodyData = (typeof data === 'string') ? JSON.parse(data) : data;


  const validated = await validateRequest(getUserDataValidator,bodyData);

  const { deviceId } = bodyData;

  logger.info(
    "== :::: * getUserData * :::: ==",
    "deviceId :==>",
    deviceId
  );

  const findUser: User = await DB.findOne(UserModel, {
    query: { deviceId },
  });
  logger.info(" getUser :: findUser ::>> ", findUser);
  if (!findUser) {
    // throw new Error(`Can not found user for Rummy game`);
      // popuop send not user Found
      return commonPopup(req,res,next)
  }
 //get userPlayed Game
 const getUserPlayedGame : playedGames = await DB.findOne(playedGamesModel, { query: {userId : findUser._id} } );
 logger.info("getUser :: getUserPlayedGame ::>> ", getUserPlayedGame);

 let userTotalPlayGame  =  getUserPlayedGame.status.loss +  getUserPlayedGame.status.win + getUserPlayedGame.status.tie
 logger.info("getUser :: userTotalPlayGame ::>> ", userTotalPlayGame);

  let UserData = {
    userName:findUser.userName,
    userID:findUser._id,
    profileImage:findUser.profileImage,
    deviceId:findUser.deviceId,
    avatarName:findUser.avatarName,
    PlayedGame : userTotalPlayGame,
    wonGame :  getUserPlayedGame.status.win,
    lostGame :  getUserPlayedGame.status.loss,
    tieGame: getUserPlayedGame.status.tie, 
  }
  return successMiddleware(
    {
      message: successMessages.COMMON.FETCH_SUCCESS.replace(
        ":attribute",
        "UserDetail"
      ),
      data: UserData,
    },
    req,
    res,
    next
  );

}
const exportObj = {
  userRegister,
  runningGame,
  editUserData,
  getUserData,
};
export = exportObj;
