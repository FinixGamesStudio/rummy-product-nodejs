import {
  BOT,
  ERROR_TYPE,
  MESSAGES,
  NUMERICAL,
  RUMMY_TYPES,
} from '../../../../constants';
import logger from '../../../../logger';
import { userSignUp } from '../../signUp';
import { getLock } from "../../../lock";
import { throwErrorIF } from '../../../interfaces/throwError';
import { getTableData } from '../../cache/Tables';
import { getOneRobot } from '../../../clientsideapi';
import { getBotIf } from '../../../interfaces/clientApiIf';
import { getUser } from '../../cache/User';
import { userSignUpIf } from '../../../interfaces/userSignUpIf';
import { getRoundTableData } from '../../cache/Rounds';


async function findBot(tableId: string, userId: string) {
  logger.info('call find bot ::: -------->>>');
  let findRobotLock = await getLock().acquire([`${tableId}`], 2000);
  try {

    const tableGamePlay = await getTableData(tableId);
    if (tableGamePlay === null) {
      const errorObj: throwErrorIF = {
        type: ERROR_TYPE.LEAVE_TABLE_ERROR,
        message: MESSAGES.ERROR.TABLE_NOT_FOUND_ERROR_MESSAGES,
        isCommonToastPopup: true,
      };
      throw errorObj;
    }

    const roundTableDataInfo = await getRoundTableData(tableId, tableGamePlay.currentRound);
    logger.info("----->> findBot :: roundTableDataInfo :: ", roundTableDataInfo);

    if (roundTableDataInfo === null) {
      const errorObj: throwErrorIF = {
        type: ERROR_TYPE.INSERT_NEW_PLAYER_ERROR,
        message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
        isCommonToastPopup: true,
      };
      throw errorObj;
    }

    let realUserCount = 0
    for (const seatKey in roundTableDataInfo.seats) {
      const seat = roundTableDataInfo.seats[seatKey];
      if (seat && seat.isBot === false) {
        realUserCount++;
      }
    }
    logger.info("----->> findBot :: realUserCount :: ", realUserCount);

    if (realUserCount >= tableGamePlay.minPlayerForPlay) {
      return true
    } else {
      const userInfo = await getUser(userId);
      logger.info(' userInfo :--->> ', userInfo);

      const botUserData: getBotIf = await getOneRobot(userInfo.lobbyId, userInfo.authToken, userInfo.userId) as getBotIf;
      console.log('botUserData :------>> ', botUserData);

      if (!botUserData.isBotAvailable) {
        const errorObj: throwErrorIF = {
          type: ERROR_TYPE.LEAVE_TABLE_ERROR,
          message: MESSAGES.ERROR.USER_DETAIL_NOT_FOUND_ERROR_MESSAGES,
          isCommonToastPopup: true,
        };
        throw errorObj;
      }
      const botUser = botUserData.botDetails;

      const botData: userSignUpIf = {
        _id: BOT.ID,
        userId: botUser._id,
        profilePicture: botUser?.profileImage ? botUser?.profileImage : "",
        username: botUser?.fullName ? botUser.fullName : await generateRandomUserName(10),
        lobbyId: tableGamePlay.lobbyId,
        isFTUE: false,
        gameId: tableGamePlay.gameId,
        dealType: tableGamePlay.dealType,
        gamePoolType: tableGamePlay.gamePoolType,
        maximumSeat: tableGamePlay.maximumSeat,
        minPlayer: tableGamePlay.minPlayerForPlay,
        fromBack: false,
        bootAmount: Number(userInfo.bootAmount),
        isUseBot: true,
        location: {
          longitude: "0",
          latitude: "0"
        },
        authToken: botUser?.token ? botUser.token : "BOT_AUTH_TOKEN",
        platformCommission: userInfo.platformCommission,
        moneyMode: tableGamePlay.moneyMode ? tableGamePlay.moneyMode : "",
        rummyType: tableGamePlay.rummyType ? tableGamePlay.rummyType : "",
        // balance: 0,
        isSplit: userInfo.isSplit ? userInfo.isSplit : false,
        isBot: true,
        botJoinTimer: tableGamePlay.botJoinTimer,
        botType: tableGamePlay.botType,
        botSeatCount: tableGamePlay.botSeatCount,
        isReferralCode: "",
        isCreateRoom: false,
        isCash: userInfo.isCash,
        coins: userInfo.coins,
        winCash: userInfo.winCash,
        cash: userInfo.cash,
        bonus: userInfo.bonus,
        avatarName: userInfo.avatarName ? userInfo.avatarName : "",

      };

      const socket = {
        id: BOT.ID,
        userId: botUser._id,
        tableId,
        eventMetaData: {
          userId: botUser._id,
          tableId,
        },
        connected: true,
      }

      if (findRobotLock) {
        await getLock().release(findRobotLock);
        findRobotLock = null;
      }

      await userSignUp(botData, socket, tableGamePlay._id.toString(), () => { });

      return true;
    }
  } catch (error) {
    logger.error('CATCH_ERROR :: findBot :: --->>', tableId, error);
  } finally {
    if (findRobotLock) {
      await getLock().release(findRobotLock);
    }
  }
}

export = findBot;


async function generateRandomUserName(userNamelength: number) {
  let userName = '';
  const randomString = 'ABCDEFGHJKMNPQRSTUVWXYZ' + '123456789';

  for (let i = 1; i <= userNamelength; i++) {
    const char = Math.floor(Math.random() * randomString.length + 1);
    userName += randomString.charAt(char)
  }

  return userName;
}

/* sign Up Data */

// _id: "",
// userId: socket.userId,
// username: typeof signUpData.userName !== undefined ? signUpData.userName : "",
// profilePicture: signUpData.profilePic ? signUpData.profilePic : "",
// lobbyId: signUpData.lobbyId,
// isFTUE: signUpData.isFTUE
//     ? signUpData.isFTUE
//     : false,
// gameId: signUpData.gameId,
// dealType: signUpData.dealType !== "" ? Number(parseInt(signUpData.dealType)) : NUMERICAL.ZERO,
// gamePoolType: signUpData.gamePoolType !== "" ? Number(parseInt(signUpData.gamePoolType)) : NUMERICAL.ZERO,
// maximumSeat: Number(signUpData.noOfPlayer) ?
//     Number(signUpData.noOfPlayer) : 2,
// minPlayer: Number(signUpData.minPlayer) ?
//     Number(signUpData.minPlayer) : 2,
// fromBack: signUpData.fromBack ? signUpData.fromBack : false,
// // bootAmount: Number(signUpData.entryFee) ?
// //     Number(signUpData.entryFee) : 0,
// bootAmount: Number(signUpData.rummyType == RUMMY_TYPES.POINT_RUMMY) ? Number(signUpData.entryFee / NUMERICAL.EIGHTEEN) : Number(signUpData.entryFee),
// isUseBot: signUpData.isUseBot ?
//     signUpData.isUseBot : false,
// location: {
//     longitude: signUpData.longitude ? signUpData.longitude : "0",
//     latitude: signUpData.latitude ? signUpData.latitude : "0"
// },
// authToken: socket.authToken,
// platformCommission: Number(signUpData.platformCommission) ? Number(signUpData.platformCommission) : 0,
// moneyMode: signUpData.moneyMode ? signUpData.moneyMode : "",
// rummyType: signUpData.rummyType ? signUpData.rummyType : "",
// balance: 0,
// isBot : false,
// isSplit: signUpData.isSplit ? signUpData.isSplit : false,