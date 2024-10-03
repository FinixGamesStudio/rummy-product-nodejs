 import config  from "../../connections/config";
import { ERROR_MESSAGES, EVENTS, MESSAGES, NUMERICAL, RUMMY_TYPES, USER_CONSTANCE, USER_GAME_RUNNING_STATUS } from "../../constants";
import logger from "../../logger";
import { setRoundTableDataComman } from "../../main/common/setRoundTableData";
import commonEventEmitter from "../../main/commonEventEmitter";
import { getPlayerGamePlay } from "../../main/gamePlay/cache/Players";
import { getRoundTableData, setRoundTableData } from "../../main/gamePlay/cache/Rounds";
import { getTableData } from "../../main/gamePlay/cache/Tables";
import { getUser, setUser } from "../../main/gamePlay/cache/User";
import { HeadToHead } from "../interfaces/headToHead.interface";
import { User } from "../interfaces/user_interfaces";
import HeadToHeadModel from "../model/lobby_model";
import UsersGameRunningStatusModel from "../model/runningGameStatus.model";
import UserModel from "../model/user_model";
import { DB } from "../mongoDBServices";
import { gameRunningStatusManage } from "./gameRunningStatus";


export async function deductEntryFeeHandle(tableId: string, numberOfPlayers: number, lobbyId: string, gameId :string, userData: string[]) {
    let flag = false;
    const { SEVENTY_FIVE_PERCENTAGE , FIFTY_PERCENTAGE , TWENTY_FIVE_PERCENTAGE } = config()

    try {

        logger.info("deductEntryFeeHandle :: numberOfPlayers :: =>> ", numberOfPlayers, " tableId :: =>> ", tableId);
        logger.info("deductEntryFeeHandle :: lobbyId :: ==>> ", lobbyId);
        logger.info("deductEntryFeeHandle :: userData :: ==>> ", userData);

        const tableData = await getTableData(tableId);
        logger.info("----->> bootCollect :: tableData :: ", tableData);

        // check players araay contains unique value or not.
        const isAllUnique = await !userData.some((v: string, i: number) => userData.indexOf(v) < i);
        logger.info("deductEntryFeeHandle :: isAllUnique :: ==>> ", isAllUnique);
        if (!isAllUnique) {
            throw new Error(ERROR_MESSAGES.COMMON.NOT_SAME.replace(':attribute', 'players'));
        }

        // check user exists on given ids
        const getAllUsers = await DB.find(UserModel, {
            query: { _id: userData, role: USER_CONSTANCE.ROLES.USER }
        });
        logger.info("deductEntryFeeHandle :: getAllUsers :: ==>> ", getAllUsers);

        if (userData.length != getAllUsers.length) {
            throw new Error(ERROR_MESSAGES.COMMON.INVALID.replace(':attribute', 'players'));
        }

        const getHeadToHead: HeadToHead = await DB.findOne(HeadToHeadModel, { query: { _id: lobbyId } });
        logger.info("deductEntryFeeHandle  :: getHeadToHead :: ==>> ", getHeadToHead);
        if (!getHeadToHead) {
            throw new Error(`Can not get lobby for rummy game`);
        }
   

        const deductedUserIds = [];
        for (let i = 0; i < userData.length; i++) {

            const userId = userData[i];
            const user: User = await DB.findOne(UserModel, {
                query: { _id: userId },
                select: '_id winCash cash bonus'
            });
            logger.info("deductEntryFeeHandle :: user :: ==>>", user)

            const playerData = await getPlayerGamePlay(userId, tableId);
            logger.info("------>> deductEntryFeeHandle :: playerData :: ", playerData);

            const getuserInfo = await getUser(userId);
            logger.info("----->> deductEntryFeeHandle :: ::  :: getuserInfo :: ", getuserInfo);

            let updateUserData = {};
            let EntryFeeAmount

            if(tableData.rummyType === RUMMY_TYPES.POINT_RUMMY){
                 EntryFeeAmount = ( getHeadToHead.entryfee*80)
                logger.info("------>> deductEntryFeeHandle :: EntryFeeAmount :: 1 ", EntryFeeAmount);
              }else{
                EntryFeeAmount =  getHeadToHead.entryfee
                logger.info("------>> deductEntryFeeHandle :: EntryFeeAmount :: 2 ", EntryFeeAmount);
              }

            if (!getHeadToHead.isCash) {
                // Update users data
                updateUserData = {
                    coins: user.coins - EntryFeeAmount,
                }
                getuserInfo.coins = user.coins - EntryFeeAmount
            }else{
                    let Seventy_Five_Percentage = SEVENTY_FIVE_PERCENTAGE;
                    let Fifty_Percentage =FIFTY_PERCENTAGE;
                    let Twenty_Five_Percentage = TWENTY_FIVE_PERCENTAGE;
                    

                    let userCashDeduct = EntryFeeAmount*(Fifty_Percentage)
                    let userWinCashDeduct = EntryFeeAmount*(Twenty_Five_Percentage)
                    let userBounsCashDeduct = EntryFeeAmount*(Twenty_Five_Percentage)
                    logger.info("deductEntryFeeHandle :: userCashDeduct :: ==>>", userCashDeduct)
                    logger.info("deductEntryFeeHandle :: userWinCashDeduct :: ==>>", userWinCashDeduct)
                    logger.info("deductEntryFeeHandle :: userBounsCashDeduct :: ==>>", userBounsCashDeduct)

                    if(user.cash>=userCashDeduct){
                        if(user.bonus<userBounsCashDeduct && user.winCash<userWinCashDeduct){
                             userCashDeduct = EntryFeeAmount
                            logger.info("deductEntryFeeHandle :: 1 :: ==>>");
                            updateUserData = {
                                cash: user.cash - userCashDeduct,
                            } 
                        }else if(user.winCash<userWinCashDeduct && user.bonus>=userBounsCashDeduct ){
                             userCashDeduct = EntryFeeAmount*(Seventy_Five_Percentage)
                             userBounsCashDeduct = EntryFeeAmount*(Twenty_Five_Percentage)
                            logger.info("deductEntryFeeHandle :: 2 :: ==>>");
                            updateUserData = {
                                cash: user.cash - userCashDeduct,
                                bonus: user.bonus - userBounsCashDeduct,
                            } 
                        }else if(user.bonus<userBounsCashDeduct && user.winCash>=userWinCashDeduct){
                             userCashDeduct = EntryFeeAmount*(Seventy_Five_Percentage)
                             userWinCashDeduct = EntryFeeAmount*(Twenty_Five_Percentage)
                             logger.info("deductEntryFeeHandle :: 3 :: ==>>");
                             updateUserData = {
                                cash: user.cash - userCashDeduct,
                                winCash: user.winCash - userWinCashDeduct,
                            } 
                        }else{
                             userCashDeduct = EntryFeeAmount*(Fifty_Percentage)
                             userWinCashDeduct = EntryFeeAmount*(Twenty_Five_Percentage)
                             userBounsCashDeduct = EntryFeeAmount*(Twenty_Five_Percentage)
                             logger.info("deductEntryFeeHandle :: 4 :: ==>>");
                             updateUserData = {
                                cash: user.cash - userCashDeduct,
                                bonus: user.bonus - userBounsCashDeduct,
                                winCash: user.winCash - userWinCashDeduct,
                            } 
                        }

                        logger.info("deductEntryFeeHandle :: userCashDeduct :: ==>>", userCashDeduct)
                        logger.info("deductEntryFeeHandle :: userWinCashDeduct :: ==>>", userWinCashDeduct)
                        logger.info("deductEntryFeeHandle :: userBounsCashDeduct :: ==>>", userBounsCashDeduct)

                    }else{
                        let msg = MESSAGES.ERROR.ENTRY_FEE_DEDUCTED_MSG;
                        let nonProdMsg = "FAILED!";
            
                        commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                        socket: playerData.socketId,
                        data: {
                        isPopup: true,
                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                        title: nonProdMsg,
                        message: msg,
                        tableId,
                        buttonCounts: NUMERICAL.ONE,
                        button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                        button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                        button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                        },
                        });
                        return false 
                    }


                // updateUserData = {
                //     cash: user.cash - userCashDeduct,
                //     bonus: user.bonus - userWinCashDeduct,
                //     winCash: user.winCash - userBounsCashDeduct,
                // } 
            }
            logger.info("deductEntryFeeHandle :: updateUserData :: ==>>", updateUserData)
            logger.info("deductEntryFeeHandle :: getuserInfo.coins :: ==>>", getuserInfo.coins)

            // update user cash
            const updatedUser: User = await DB.findOneAndUpdate(UserModel, {
                query: { _id: userId },
                updateData: { $set: updateUserData }
            });

            logger.info("deductEntryFeeHandle :: updatedUser :: ==>>", updatedUser)

            const setuserInfo = await setUser(updatedUser._id , getuserInfo);
            logger.info("----->> deductEntryFeeHandle :: ::  :: setuserInfo :: ", setuserInfo);


            const userInfo = await getUser(updatedUser._id);
            logger.info("----->> deductEntryFeeHandle :: ::  :: userInfo :: ", userInfo);

            if (!getHeadToHead.isCash) {

            const previousCoinsBalance = user.coins;
            logger.info('previousBalance ::>> ', previousCoinsBalance);

            const currentCoinBalance = updatedUser.coins;
            logger.info('currentBalance ::>> ', currentCoinBalance);

            if (currentCoinBalance <= previousCoinsBalance) {
                deductedUserIds.push(userId);
            }
           }else{
            const previousCashsBalance = user.cash;
            const previousBounsBalance = user.bonus;
            const previousWinCashBalance = user.winCash;
            logger.info('previousCashsBalance ::>> ', previousCashsBalance);
            logger.info('previousBounsBalance ::>> ', previousBounsBalance);
            logger.info('previousWinCashBalance ::>> ', previousWinCashBalance);

            const currentCashsBalance = updatedUser.cash;
            const currentBounsBalance = updatedUser.bonus;
            const currentWinCashBalance = updatedUser.winCash;
            logger.info('currentCashsBalance ::>> ', currentCashsBalance);
            logger.info('currentBounsBalance ::>> ', currentBounsBalance);
            logger.info('currentWinCashBalance ::>> ', currentWinCashBalance);
           
            if (currentCashsBalance <= previousCashsBalance) {
                deductedUserIds.push(userId);
           }

           // set update balance 

           userInfo.cash = currentCashsBalance;
           userInfo.bonus = currentBounsBalance;
           userInfo.winCash =  currentWinCashBalance;

           
        }
        const updateUserInfo = await setUser(updatedUser._id, userInfo);
        logger.info("----->> deductEntryFeeHandle :: ::  :: updateUserInfo :: ", updateUserInfo);

            await setRoundTableDataComman(userInfo,tableId)


            // if(!tableData.isCreateRoom){

            /* mark complete all previous running game staus of user */
            await gameRunningStatusManage(userId, gameId);
    
            const runningStatus = USER_GAME_RUNNING_STATUS.STATUS_OBJ.running;
            // add record into user game running status
            const userRunningGame = await DB.create(UsersGameRunningStatusModel, {
              insert: {
                userId,
                gameId,
                tableId,
                tournamentId : lobbyId,
                status: runningStatus
              }
            });
            logger.info("deductEntryFeeHandle :: userRunningGame :: ==>>", userRunningGame)

        //   }


        }




        logger.info('deductedUserIds ::>> ', deductedUserIds, 'deductedUserIds.length ::>> ', deductedUserIds.length);
        if (deductedUserIds.length === numberOfPlayers) { flag = true; }

        return flag;
    } catch (err: any) {
        logger.error("CATCH :: deductEntryFeeHandle :: ERROR :: error ::>>", err);
        logger.error(
            "CATCH :: deductEntryFeeHandle :: ERROR :: err.message ::>> ",
            err?.message
        );
        throw flag;
    }
}