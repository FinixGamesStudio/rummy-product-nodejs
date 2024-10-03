
import logger from "../../logger";
import { User } from "../interfaces/user_interfaces";
import config from "../../connections/config";

const {
    DEAL,
    IS_CASH,
    IS_COIN,
    PUBLIC,
    POINT,
    POOL,
    PWF,
    IS_MONEY_SCREEN,
    DEFAULT_MONEY_MODE,
    IS_GAME_SCREEN,
    DEFAULT_GAME_MODE,
    IS_RUMMY_SCREEN,
    DEFAULT_RUMMY_MODE,
    IS_PRACTICE
  } = config();

function formatUserRespose(registerData:User) {

    try {

        const data = {
                _id: registerData._id,
                cash: registerData.cash,
                profileImage: registerData.profileImage,
                coins: registerData.coins.toFixed(2),
                userName: registerData.userName,
                token: registerData.token,
                winCash: registerData.winCash,
                bonus: registerData.bonus,
                isLink: registerData.isLink,
                avatarName: registerData.avatarName,
                setMode: {
                  moneyMode: {
                    cashMode: IS_CASH,
                    practiceMode: IS_PRACTICE,
                    isMoney: IS_MONEY_SCREEN,
                    defaultMode: DEFAULT_MONEY_MODE,
                    coinsMode:IS_COIN
                  },
                  gameMode: {
                    publicMode: PUBLIC,
                    privateMode: PWF,
                    isGame: IS_GAME_SCREEN,
                    defaultMode: DEFAULT_GAME_MODE,
                  },
                  rummyMode: {
                    pointMode: POINT,
                    poolMode: POOL,
                    dealMode: DEAL,
                    isRummy : IS_RUMMY_SCREEN,
                    defaultMode : DEFAULT_RUMMY_MODE
                  },
                },
             
        }
        logger.info("--------->> defaultRegisterUser :: data::  :: ", data)

        return data;
        

        
    } catch (error) {
        logger.error("---defaultRegisterUser :: ERROR: ", error);
        throw error;
    }


    
} 

export = formatUserRespose;
