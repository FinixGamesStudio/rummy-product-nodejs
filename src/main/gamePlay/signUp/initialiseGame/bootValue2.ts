import { getUser, setUser } from "../../cache/User";
import Errors from "../../../errors"
import { getTableData, setTableData } from "../../cache/Tables";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import { ERROR_TYPE, EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE, RUMMY_TYPES, TABLE_STATE } from "../../../../constants";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../cache/Players";
import commonEventEmitter from "../../../commonEventEmitter";
import { formatBootCollectionInfo } from "../../formatResponse";
import { throwErrorIF } from "../../../interfaces/throwError";
import logger from "../../../../logger";
import { leaveRoundTable } from "../../play/leaveTable/leaveRoundTable";
import { userIf } from "../../../interfaces/userSignUpIf";
import { getUserOwnProfile } from "../../../clientsideapi/getUserOwnProfile";
import { multiPlayerDeductEntryFeeResponse } from "../../../interfaces/clientApiIf";
import { multiPlayerDeductEntryFee } from "../../../clientsideapi/multiPlayerDeductEntryFee";
import { deductEntryFeeHandle } from "../../../../cms/helper/deductEntryFee";
import { User } from "../../../../cms/interfaces/user_interfaces";
import { DB } from "../../../../cms/mongoDBServices";
import UserModel from "../../../../cms/model/user_model";
const _ = require("underscore");

async function bootCollect(
    tableId: string,
    currentRound: number,
) {
    logger.info("================>> bootCollect <<====================")
    try {
        const roundTableData = await getRoundTableData(tableId, currentRound);

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.BOOT_COLLECTION_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info("----->> bootCollect :: roundTableData :: ", roundTableData);
        let isSendArrangeSeats: boolean = false;
        let isCountiusGame: boolean = false;

        const tableData = await getTableData(tableId);
        logger.info("----->> bootCollect :: tableData :: ", tableData);
        if (tableData.minPlayerForPlay <= roundTableData.totalPlayers) {

            let listOfSeatsIndex: number[] = [];
            const playingUsers = [];
            for await (const ele of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[ele]).length > NUMERICAL.ZERO) {
                    if (roundTableData.seats[ele].userStatus === PLAYER_STATE.PLAYING) {
                        listOfSeatsIndex.push(roundTableData.seats[ele].seatIndex)
                        playingUsers.push(roundTableData.seats[ele].userId)
                    }
                }
            }

            logger.info("----->> bootCollect :: playingUsers :: ", playingUsers);
            roundTableData.tableState = TABLE_STATE.COLLECTING_BOOT_VALUE;
            await setRoundTableData(tableId, currentRound, roundTableData);

            const userIds: string[] = _.compact(playingUsers);
            logger.info("----->> bootCollect :: playing players userIds :: ", userIds);

            const userProfile = await getUser(userIds[NUMERICAL.ZERO]) as userIf;

            
          let isEntryFeeDeductManage = await deductEntryFeeHandle(tableId, roundTableData.totalPlayers, tableData.lobbyId, tableData.gameId, playingUsers);
          logger.info(tableId, 'bootCollect :: isEntryFeeDeductManage :>> ', isEntryFeeDeductManage);
        
          let roundData =  await getRoundTableData(tableId,tableData.currentRound)
          logger.info(`------>> bootCollect :: roundData :: ::`, roundData);

            logger.info(" bootCollect ::  roundData.noOfPlayer :: >> ", roundData.totalPlayers);
            logger.info(" bootCollect ::  playingUsers >> ", playingUsers);

            if(isEntryFeeDeductManage){

            listOfSeatsIndex = [];
            for await (let userID of playingUsers) {
                for await (const seat of Object.keys(roundData.seats)) {
                    if (Object.keys(roundData.seats[seat]).length > NUMERICAL.ONE) {
                        if (userID === roundData.seats[seat].userId) {
                            listOfSeatsIndex.push(roundData.seats[seat].seatIndex)
                        }
                    }
                }
            }
            logger.info("----->> bootCollect :: listOfSeatsIndex :: 1 ::", listOfSeatsIndex);

            if (playingUsers.length >= NUMERICAL.TWO ) {
                logger.info("----->> bootCollect :: roundData.maxPlayers :: ", roundData.maxPlayers);
                logger.info("----->> bootCollect :: deductedUserIds.length :: ", playingUsers.length);

                isCountiusGame = true;
                if (roundData.rummyType !== RUMMY_TYPES.POINT_RUMMY) {
                    if (roundData.maxPlayers !== NUMERICAL.TWO && playingUsers.length !== NUMERICAL.SIX) {
                        if (
                            (roundData.maxPlayers === NUMERICAL.FOUR && playingUsers.length !== NUMERICAL.FOUR) ||
                            roundData.maxPlayers === NUMERICAL.SIX
                        ) {
                            commonEventEmitter.emit(EVENTS.ARRANGE_SEATING, {
                                tableId: tableId,
                                data: {
                                    playersCount: listOfSeatsIndex.length
                                }
                            });
                            isSendArrangeSeats = true;
                            isCountiusGame = false;
                        }
                    }
                }

                for await (let userID of playingUsers) {
                    logger.info("----->> bootCollect :: deductedUserIds :: userID :: ", userID);

                    const userInfo = await getUser(userID);
                    logger.info("----->> bootCollect :: deductedUserIds :: userInfo :: ", userInfo);


                    // update balance from client cliend api
                    // const userOwnProfile = await getUserOwnProfile(userInfo.authToken, userInfo.socketId, userInfo.userId);
                    // const updatedBalance: number = userOwnProfile.bonus + userOwnProfile.winCash + userOwnProfile.cash;
                    const playerDetail = await getPlayerGamePlay(userID, tableId);

                    playerDetail.userStatus = PLAYER_STATE.PLAYING;
                    playerDetail.playingStatus = PLAYER_STATE.COLLECT_BOOT_AMOUNT;

                    roundData.totalDealPlayer = playingUsers.length
                    roundData.splitPlayers = playingUsers.length;
                    roundData.isCollectBootSend = true;

                    tableData.winPrice = (tableData.bootAmount * playingUsers.length) * (1 - (tableData.rake / 100))
                    // tableData.winPrice = Number(tableData.winPrice.toFixed(2));

                    const promise = await Promise.all([
                        setUser(userID, userInfo),
                        setPlayerGamePlay(userID, tableId, playerDetail),
                        setTableData(tableData),
                        setRoundTableData(tableId, currentRound, roundData)
                    ]);
                    logger.info("----->> bootCollect :: isSendArrangeSeats ::  :: ", isSendArrangeSeats);

                    // let userBalance
                    let bootCollectData
                    if(userInfo.isCash){
                        // userBalance = userInfo.cash 
                         bootCollectData = {
                            isCash: userInfo.isCash,
                            coins:userInfo.coins,
                            cash: userInfo.cash,
                            winCash: userInfo.winCash,
                            bonus: userInfo.bonus,
                            listOfSeatsIndex: listOfSeatsIndex,
                            winPrice: tableData.winPrice
                        }
                        logger.info("----->> bootCollect :: bootCollectData ::  :: 1", bootCollectData);

                    }else{
                        // userBalance = userInfo.coins 
                         bootCollectData = {
                            isCash: userInfo.isCash,
                            coins:userInfo.coins,
                            cash: userInfo.cash,
                            winCash: userInfo.winCash,
                            bonus: userInfo.bonus,
                            listOfSeatsIndex: listOfSeatsIndex,
                            winPrice: tableData.winPrice
                        }
                        logger.info("----->> bootCollect :: bootCollectData ::  :: 2 ", bootCollectData);

                    }
                    
                    if (!isSendArrangeSeats) {
                        // const bootCollectData = {
                        //     // balance: userInfo.balance,
                        //     balance: userBalance,
                        //     listOfSeatsIndex: listOfSeatsIndex,
                        //     winPrice: tableData.winPrice
                        // }
                        logger.info("----->> bootCollect :: bootCollectData ::  :: 3 ", bootCollectData);
                        
                        const formatedResponse = await formatBootCollectionInfo(bootCollectData);
                        logger.info("---> bootCollect :: formatBootCollectionInfo :: ", formatedResponse);

                        commonEventEmitter.emit(EVENTS.COLLECT_BOOT_VALUE_SOCKET_EVENT, {
                            socket: playerDetail.socketId,
                            data: formatedResponse
                        });
                    }
                }
            } else {
                logger.info("------>> bootCollect :: wait popup :: ");
                roundData.tableState = TABLE_STATE.WAIT_FOR_PLAYER;

                await setRoundTableData(tableId, NUMERICAL.ONE, roundData);

                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                    tableId: tableId,
                    data: {
                        isPopup: true,
                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOST_POPUP,
                        title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                        message: MESSAGES.POPUP.CENTER_TOAST_POPUP.WAIT_PLAYER_POPUP_MESSAGE,
                    }
                });

                isCountiusGame = false;
            }
           }else{
            const playerData = await getPlayerGamePlay(userProfile.userId, tableId);
            logger.info("------>> bootCollect :: playerData :: ", playerData);

            roundData.totalPlayers -= NUMERICAL.ONE;
            roundData.currentPlayer -= NUMERICAL.ONE;
            await setRoundTableData(tableId, NUMERICAL.ONE, roundData)

            logger.info(" bootCollect :: else :: roundData >> ", roundData);


            playerData.userStatus = PLAYER_STATE.LEFT;
            playerData.playingStatus = PLAYER_STATE.LEFT;
            playerData.isLeft = true;

            await setPlayerGamePlay(userProfile.userId, tableId, playerData)

            logger.info(" bootCollect :: else ::  playerData >> ", playerData);


            await leaveRoundTable(false, true, playerData.userId, tableId, currentRound)

           }
           
            return {
                isCountiusGame,
                isSendArrangeSeats
            };

        } else {
            logger.info("------>> bootCollect :: wait popup :: ");
            roundTableData.tableState = TABLE_STATE.WAIT_FOR_PLAYER;

            await setRoundTableData(tableId, NUMERICAL.ONE, roundTableData);

            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOST_POPUP,
                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                    message: MESSAGES.POPUP.CENTER_TOAST_POPUP.WAIT_PLAYER_POPUP_MESSAGE,
                }
            });
            return {
                isCountiusGame,
                isSendArrangeSeats
            };
        }
    } catch (error: any) {
        logger.error("----->> bootCollect :: ERROR :: ", error);
        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- bootCollect :: CancelBattle :: ERROR ::",
                error,
                "tableId :: ",
                tableId
            );
            throw new Errors.CancelBattle(error);
        } else if (error && error.type === ERROR_TYPE.BOOT_COLLECTION_ERROR) {
            logger.error(
                `--- bootCollect :: ERROR_TYPE :: ${ERROR_TYPE.BOOT_COLLECTION_ERROR}::`,
                error,
                "tableId :: ",
                tableId
            );
            throw error;
        }
        else if (error instanceof Errors.createCardGameTableError) {
            logger.error(
                "--- bootCollect :: createCardGameTableError :: ERROR ::",
                error,
                "tableId :: ",
                tableId
            );
            throw new Errors.createCardGameTableError(error);
        } else {
            throw error;
        }
    }
}

export = bootCollect;