import logger from "../../../../logger";
import { playerPlayingDataIf, RejoinTableHistoryIf } from "../../../interfaces/playerPlayingTableIf";
import { getRejoinTableHistory, removeRejoinTableHistory } from "../../cache/TableHistory";
import Scheduler from "../../../scheduler"
import { getTableData } from "../../cache/Tables";
import { getRoundTableData } from "../../cache/Rounds";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../cache/Players";
import commonEventEmitter from "../../../commonEventEmitter";
import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NULL, NUMERICAL, PLAYER_STATE, TABLE_STATE, USER_GAME_RUNNING_STATUS } from "../../../../constants";
import { timeDifference } from "../../../common";
import { rejoinDataIf } from "../../../interfaces/responseIf";
import { formatRejoinInfo } from "../../formatResponse";
import config from "../../../../connections/config";
import { throwErrorIF } from "../../../interfaces/throwError";
import Errors from "../../../errors";
import { getUser, setUser } from "../../cache/User";
import ackTablesData from "../../utils/ackTablesData";
import formatSignupAck from "../../formatResponse/formatSignupAck";
import socketAck from "../../../../socketAck"
import { getLock } from "../../../lock";
import { gameRunningStatusManage } from "../../../../cms/helper/gameRunningStatus";
import UsersGameRunningStatusModel from "../../../../cms/model/runningGameStatus.model";
import { DB } from "../../../../cms/mongoDBServices";

async function rejoinTable(
    userId: string,
    gameId: string,
    lobbyId: string,
    socket: any,
    ack: Function
): Promise<boolean> {
    logger.info("====================>> rejoinTable <<====================")
    const {
        BOOT_COLLECTION_TIMER,
        TOTAL_GAME_START_TIMER,
        REMAIN_PLAYERS_FINISH_TIMER,
        TURN_TIMER, SCORE_BOARD_TIMER,
        START_FINISH_TIMER,
        AUTO_SPLIT_AMOUNT_TIMER,
        GAME_START_TIMER,
        LOCK_IN_PERIOD_TIMER,
        SPLIT_AMOUNT_TIMER,
        SECONDARY_TIMER,
        WAITING_FOR_PLAYER,
        REJOINT_GAME_POPUP_TIMER
    } = config();
    let rejoinLock; //= await getLock().acquire([`locks:${userId}`], 2000);
    try {
        let userData = await getUser(userId);
        logger.info("------>> rejoinTable :: userData :: ", userData);
        logger.info(
            "------>> rejoinTable :: userData.isCreateRoom :: ",
            userData.isCreateRoom
          );
          logger.info(
            "------>> rejoinTable :: userData.isReffralCode :: ",
            userData.isReferralCode
          );


        const oldLobbyId = userData.lobbyId as string;
        // const oldLobbyId = userData.OldLobbyId as string;
        logger.info("------>> rejoinTable :: oldLobbyId :: ", oldLobbyId);

        if (oldLobbyId === NULL) {
            return true;
        }

        const rejoinHistory: RejoinTableHistoryIf = await getRejoinTableHistory(userId, gameId, oldLobbyId);
        logger.info("------>> rejoinTable :: rejoinHistory :: ", rejoinHistory);

        logger.info("------>> rejoinTable :: lobby ids same :: ")
        if (rejoinHistory) {
            const { tableId, isEndGame } = rejoinHistory;
            logger.info(
                "------>> rejoinTable :: tableId :: ",
                tableId,
                `isEndGame :: ${isEndGame}`
            );

            // rejoin lock
            rejoinLock = await getLock().acquire([`locks:${userId}`,`locks:${tableId}` ], 1000);

            await Scheduler.cancelJob.LeaveTableTimerCancel(`${tableId}:${userId}`);
            if (!isEndGame) {
                const tableData = await getTableData(tableId);


                logger.info("----->> rejoinTable :: tableData ::", tableData);
                if (tableData === null) {
                    await removeRejoinTableHistory(userId, tableId, lobbyId);
                    return true;
                }

                // send signup
                const tablesRes = await ackTablesData([tableId], userData.userId);
                const formatedAckRes = await formatSignupAck(userData, tablesRes, true);

                socketAck.ackMid(
                    EVENTS.SIGN_UP_SOCKET_EVENT,
                    formatedAckRes,
                    userId,
                    tableId,
                    ack
                );


                const roundTableData = await getRoundTableData(tableId, tableData.currentRound);
                logger.info("----->> rejoinTable :: roundTableData ::", roundTableData);
                if (roundTableData === null) {
                    const errorObj: throwErrorIF = {
                        type: ERROR_TYPE.RE_JOIN_PLAYER_ERROR,
                        message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                        isCommonToastPopup: true,
                    };
                    throw errorObj;
                }

                let playerData: playerPlayingDataIf = await getPlayerGamePlay(userId, tableId);
                logger.info("----->> rejoinTable :: playerData ::", playerData);
                if (playerData === null) {
                    const errorObj: throwErrorIF = {
                        type: ERROR_TYPE.RE_JOIN_PLAYER_ERROR,
                        message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                        isCommonToastPopup: true,
                    };
                    throw errorObj;
                }

                if (
                    playerData.userStatus === PLAYER_STATE.LEFT ||
                    playerData.playingStatus === PLAYER_STATE.LEFT ||
                    playerData.playingStatus === PLAYER_STATE.LOST ||
                    playerData.isLeft
                ) {
                    return true;
                }

                // set new socket ID in database
                userData.socketId = socket.id;
                playerData.socketId = socket.id;
                playerData.isDisconneted = false;
                userData.isCreateRoom = tableData.isCreateRoom;
                userData.isReferralCode = tableData.isReferralCode;


                await setUser(userId, userData);
                await setPlayerGamePlay(userId, tableId, playerData);

                // set round Join player in table Room 
                commonEventEmitter.emit(EVENTS.ADD_PLAYER_IN_TABLE_ROOM, {
                    socket,
                    data: {
                        tableId
                    }
                });

                  // create gameRunning status

                //   if(userData.isCreateRoom && userData.isReferralCode != ""){
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
                  logger.info('----->>  rejoinTable :: :: userRunningGame ::',userRunningGame);
                  logger.info('----->>  rejoinTable :: :: userRunningGame :: userId  ::',userId);
   
            //    }
   

                logger.info(
                    tableId,
                    " :::: >>> ::  > > isLink :: ::  >> : > >>",
                    userData.isLink
                  );

                // set current round in metadata
                socket.eventMetaData = {
                    userId: roundTableData.seats[`s${playerData.seatIndex}`].userId,
                    userObjectId: roundTableData.seats[`s${playerData.seatIndex}`]._id,
                    tableId,
                    roundId: roundTableData._id,
                    currentRound: tableData.currentRound,
                    dealType: tableData.dealType,
                    poolType: tableData.gamePoolType
                };

                // send popup join with link
                
                if (userData.isLink) {
                    console.log(
                      "rejoin Table :: isLink ............................................"
                    );
                    const socketId = socket.id;
                    let nonProdMsg = "Join Table";
                    commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                      socket: socketId,
                      data: {
                        isPopup: true,
                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                        title: nonProdMsg,
                        message: MESSAGES.ERROR.JOIN_SAME_TABLE_TO_LINK,
                        buttonCounts: NUMERICAL.ONE,
                        button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.OK],
                        button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.GREEN],
                        button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.HIDE_POPUP],
                        showLoader: false,
                      },
                    });
                  }


                if (
                    roundTableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED ||
                    roundTableData.tableState === TABLE_STATE.LOCK_IN_PERIOD ||
                    roundTableData.tableState === TABLE_STATE.COLLECTING_BOOT_VALUE ||
                    roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS ||
                    roundTableData.tableState === TABLE_STATE.TOSS_CARDS
                ) {
                    // lockin period
                    logger.info(
                        "----->> rejoinTable :: table state is ROUND_TIMER_STARTED Or LOCK_IN_PERIOD Or COLLECTING_BOOT_VALUE ::",
                        `userID :: ${playerData.userId}`
                    );
                    let remainTime: number = NUMERICAL.ZERO;
                    let isLockInperiod = false;
                    if (roundTableData.tableState === TABLE_STATE.LOCK_IN_PERIOD) {
                        remainTime = timeDifference(new Date(), roundTableData.updatedAt, LOCK_IN_PERIOD_TIMER) as number;
                        isLockInperiod = true
                    } else if (roundTableData.tableState === TABLE_STATE.COLLECTING_BOOT_VALUE) {
                        remainTime = timeDifference(new Date(), roundTableData.updatedAt, BOOT_COLLECTION_TIMER) as number;
                    } else if (roundTableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED) {
                        remainTime = timeDifference(new Date(), roundTableData.updatedAt, TOTAL_GAME_START_TIMER) as number;
                    } else if (roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS) {
                        remainTime = timeDifference(new Date(), roundTableData.updatedAt, WAITING_FOR_PLAYER) as number;
                    } else if (roundTableData.tableState === TABLE_STATE.TOSS_CARDS) {
                        remainTime = NUMERICAL.ZERO;
                    }
                    logger.info(`----->> rejoinTable :: TableState :: ${roundTableData.tableState} :: remainTimer :: ${remainTime}`);

                    const info: rejoinDataIf = {
                        isTurnStart: false,
                        isLockInperiod: isLockInperiod,
                        isDisplayScoreBoard: false,
                        isFinishTimerStart: false,
                        isDeclareTimerStart: false,
                        isAutoSplit: false,
                        timer: remainTime,
                        // balance: userData.balance
                        isCash:userData.isCash,
                        coins:userData.coins,
                        cash:userData.cash,
                        winCash:userData.winCash,
                        bonus:userData.bonus,
                    }
                    const formatedRes = await formatRejoinInfo(playerData, roundTableData, tableData, info);
                    logger.info("----->> rejoinTable :: formatRejoinInfo ::", formatedRes);

                    commonEventEmitter.emit(EVENTS.RE_JOIN_TABLE, {
                        socket,
                        data: formatedRes
                    });
                } else {
                    // if turn started
                    if (roundTableData.tableState === TABLE_STATE.TURN_STARTED) {
                        logger.info(
                            "----->> rejoinTable :: table state is  TURN_STARTED ::",
                            `userID :: ${playerData.userId}`
                        );
                        // turn true
                        let remainTime: number = NUMERICAL.MINUS_ONE;
                        if (roundTableData.isSecondaryTurn) {
                            remainTime = timeDifference(new Date(), roundTableData.updatedAt, SECONDARY_TIMER);
                        } else {
                            remainTime = timeDifference(new Date(), roundTableData.updatedAt, TURN_TIMER);
                        }
                        const info: rejoinDataIf = {
                            isTurnStart: true,
                            isLockInperiod: false,
                            isDisplayScoreBoard: false,
                            isFinishTimerStart: false,
                            isDeclareTimerStart: false,
                            isAutoSplit: false,
                            timer: remainTime,
                            // balance: userData.balance,
                            isCash:userData.isCash,
                            coins:userData.coins,
                            cash:userData.cash,
                            winCash:userData.winCash,
                            bonus:userData.bonus,
                        }
                        const formatedRes = await formatRejoinInfo(playerData, roundTableData, tableData, info);
                        logger.info("----->> rejoinTable :: formatRejoinInfo ::", formatedRes);

                        commonEventEmitter.emit(EVENTS.RE_JOIN_TABLE, {
                            socket,
                            data: formatedRes
                        });

                    } else {
                        // finish timer start
                        if (roundTableData.tableState === TABLE_STATE.FINISH_TIMER_START) {
                            logger.info(
                                "----->> rejoinTable :: table state is  FINISH_TIMER_START ::",
                                `userID :: ${playerData.userId}`
                            );

                            const remainTime: number = timeDifference(new Date(), roundTableData.updatedAt, START_FINISH_TIMER);
                            const info: rejoinDataIf = {
                                isTurnStart: false,
                                isLockInperiod: false,
                                isDisplayScoreBoard: false,
                                isFinishTimerStart: true,
                                isDeclareTimerStart: false,
                                isAutoSplit: false,
                                timer: remainTime,
                                // balance: userData.balance
                                isCash:userData.isCash,
                                coins:userData.coins,
                                cash:userData.cash,
                                winCash:userData.winCash,
                                bonus:userData.bonus,
                            }
                            const formatedRes = await formatRejoinInfo(playerData, roundTableData, tableData, info);
                            logger.info("----->> rejoinTable :: formatRejoinInfo ::", formatedRes);

                            commonEventEmitter.emit(EVENTS.RE_JOIN_TABLE, {
                                socket,
                                data: formatedRes
                            });
                        } else {
                            // declare card for all player player
                            if (roundTableData.tableState === TABLE_STATE.ROUND_OVER) {
                                logger.info(
                                    "----->> rejoinTable :: table state is  ROUND_OVER ::",
                                    `userID :: ${playerData.userId}`
                                );

                                const remainTime: number = timeDifference(new Date(), roundTableData.updatedAt, REMAIN_PLAYERS_FINISH_TIMER);
                                const info: rejoinDataIf = {
                                    isTurnStart: false,
                                    isLockInperiod: false,
                                    isFinishTimerStart: false,
                                    isDeclareTimerStart: true,
                                    isDisplayScoreBoard: false,
                                    isAutoSplit: false,
                                    timer: remainTime,
                                    // balance: userData.balance
                                    isCash:userData.isCash,
                                    coins:userData.coins,
                                    cash:userData.cash,
                                    winCash:userData.winCash,
                                    bonus:userData.bonus,
                                }
                                const formatedRes = await formatRejoinInfo(playerData, roundTableData, tableData, info);
                                logger.info("----->> rejoinTable :: formatRejoinInfo ::", formatedRes);

                                commonEventEmitter.emit(EVENTS.RE_JOIN_TABLE, {
                                    socket,
                                    data: formatedRes
                                });

                            } else {
                                // show scoreboard
                                if (roundTableData.tableState === TABLE_STATE.DISPLAY_SCOREBOARD) {
                                    logger.info(
                                        "----->> rejoinTable :: table state is  DISPLAY_SCOREBOARD ::",
                                        `userID :: ${playerData.userId}`
                                    );

                                    const newRoundTableData = await getRoundTableData(tableId, tableData.currentRound);
                                    logger.info('----->>  rejoinTable :: :: newRoundTableData ::   ::', newRoundTableData);

                                    if (newRoundTableData.tableState !== roundTableData.tableState) {
                                        return rejoinTable(
                                            userId,
                                            gameId,
                                            lobbyId,
                                            socket,
                                            ack
                                        )
                                    }

                                    let remainTime: number = NUMERICAL.ZERO;
                                    if (roundTableData.isEligibleForSplit) {
                                        remainTime = timeDifference(new Date(), roundTableData.updatedAt, SPLIT_AMOUNT_TIMER) - NUMERICAL.ONE;
                                    } else {
                                        remainTime = timeDifference(new Date(), roundTableData.updatedAt, SCORE_BOARD_TIMER);
                                    }
                                    const info: rejoinDataIf = {
                                        isTurnStart: false,
                                        isLockInperiod: false,
                                        isFinishTimerStart: false,
                                        isDeclareTimerStart: false,
                                        isDisplayScoreBoard: true,
                                        isAutoSplit: false,
                                        timer: remainTime,
                                        // balance: userData.balance
                                        isCash:userData.isCash,
                                        coins:userData.coins,
                                        cash:userData.cash,
                                        winCash:userData.winCash,
                                        bonus:userData.bonus,
                                    }
                                    const formatedRes = await formatRejoinInfo(playerData, roundTableData, tableData, info);
                                    logger.info("----->> rejoinTable :: formatRejoinInfo ::", formatedRes);

                                    commonEventEmitter.emit(EVENTS.RE_JOIN_TABLE, {
                                        socket,
                                        data: formatedRes
                                    });

                                    // rejoin game again popup
                                    const timers = timeDifference(new Date(), playerData.updatedAt, REJOINT_GAME_POPUP_TIMER);
                                    if (playerData.isWaitingForRejoinPlayer) {
                                        if(userData.isCash){
                                            commonEventEmitter.emit(EVENTS.REJOIN_GAME_AGAIN, {
                                                socket: playerData.socketId,
                                                data: {
                                                    title: `${MESSAGES.MESSAGE.REJOIN_GAME_POPUP_TITLE}`,
                                                    message: `${MESSAGES.MESSAGE.REJOIN_GAME_POPUP_FIRST_MESSAGE} ${roundTableData.roundMaxPoint + NUMERICAL.ONE} pts?`,
                                                    middleMessage: `${MESSAGES.MESSAGE.REJOIN_GAME_CASH_POPUP_MIDDLE_MESSAGE}${userData.cash.toFixed(2)}.`,
                                                    lastMessage: `${MESSAGES.MESSAGE.REJOIN_GAME_POPUP_LAST_MESSAGE}${tableData.bootAmount.toFixed(2)}.`,
                                                    timer: timers // remain time
                                                }
                                            });
                                        }else{
                                            commonEventEmitter.emit(EVENTS.REJOIN_GAME_AGAIN, {
                                                socket: playerData.socketId,
                                                data: {
                                                    title: `${MESSAGES.MESSAGE.REJOIN_GAME_POPUP_TITLE}`,
                                                    message: `${MESSAGES.MESSAGE.REJOIN_GAME_POPUP_FIRST_MESSAGE} ${roundTableData.roundMaxPoint + NUMERICAL.ONE} pts?`,
                                                    middleMessage: `${MESSAGES.MESSAGE.REJOIN_GAME_COINS_POPUP_MIDDLE_MESSAGE}${userData.coins.toFixed(2)}.`,
                                                    lastMessage: `${MESSAGES.MESSAGE.REJOIN_GAME_POPUP_LAST_MESSAGE}${tableData.bootAmount.toFixed(2)}.`,
                                                    timer: timers // remain time
                                                }
                                            });
                                        }
                                   
                                    }

                                } else {
                                    // auto split
                                    if (roundTableData.tableState === TABLE_STATE.AUTO_SPLIT_AMOUNT_START) {
                                        const remainTime: number = timeDifference(new Date(), roundTableData.updatedAt, AUTO_SPLIT_AMOUNT_TIMER);
                                        const info: rejoinDataIf = {
                                            isTurnStart: false,
                                            isLockInperiod: false,
                                            isFinishTimerStart: false,
                                            isDeclareTimerStart: false,
                                            isDisplayScoreBoard: false,
                                            isAutoSplit: true,
                                            timer: remainTime,
                                            // balance: userData.balance
                                            isCash:userData.isCash,
                                            coins:userData.coins,
                                            cash:userData.cash,
                                            winCash:userData.winCash,
                                            bonus:userData.bonus,
                                        }

                                        const formatedRes = await formatRejoinInfo(playerData, roundTableData, tableData, info);
                                        logger.info("----->> rejoinTable :: formatRejoinInfo ::", formatedRes);

                                        commonEventEmitter.emit(EVENTS.RE_JOIN_TABLE, {
                                            socket,
                                            data: formatedRes
                                        });
                                    } else {

                                        let remainTime = 0;
                                        const info: rejoinDataIf = {
                                            isTurnStart: false,
                                            isLockInperiod: false,
                                            isDisplayScoreBoard: false,
                                            isFinishTimerStart: false,
                                            isDeclareTimerStart: false,
                                            isAutoSplit: false,
                                            timer: remainTime,
                                            // balance: userData.balance
                                            isCash:userData.isCash,
                                            coins:userData.coins,
                                            cash:userData.cash,
                                            winCash:userData.winCash,
                                            bonus:userData.bonus,
                                        }
                                        const formatedRes = await formatRejoinInfo(playerData, roundTableData, tableData, info);
                                        logger.info("----->> rejoinTable :: formatRejoinInfo ::", formatedRes);

                                        commonEventEmitter.emit(EVENTS.RE_JOIN_TABLE, {
                                            socket,
                                            data: formatedRes
                                        });
                                    }

                                }
                            }
                        }
                    }
                }

                return false;
            } else {
                // game is ended
                logger.info("------>> ELSE :: rejoinTable :: rejoinHistory :: ",);
                return true;
            }
        } else {
            // not available rejoin history
            return true;
        }
    } catch (error: any) {
        // throw error;
        console.log("---rejoinTable :: ERROR :: ", error);
        logger.error("---rejoinTable :: ERROR :: ", error);
        let nonProdMsg = '';
        let msg = MESSAGES.GRPC_ERRORS.COMMON_ERROR;
        if (error instanceof Errors.InvalidInput) {
            nonProdMsg = "Invalid Input";
            logger.error(
                "--- rejoinTable :: InvalidInput :: ERROR ::",
                error,
                "userId :: ",
                userId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: nonProdMsg,
                    message: MESSAGES.GRPC_ERRORS.COMMON_ERROR,
                    buttonCounts: NUMERICAL.ONE,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT]
                }
            })
        }
        else if (error instanceof Errors.CancelBattle) {
            console.log(error)
            logger.error(
                "--- rejoinTable :: CancelBattle :: ERROR ::",
                error,
                "userId :: ",
                userId
            );
            nonProdMsg = "CancelBattle";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: socket.eventMetaData.tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.POPUP.COMMAN_TOAST_POPUP.CANCEL_BATTELE_POPUP_MESSAGE ?
                        MESSAGES.POPUP.COMMAN_TOAST_POPUP.CANCEL_BATTELE_POPUP_MESSAGE : MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: nonProdMsg,
                    message: error && error.message && typeof error.message === 'string'
                        ? error.message
                        : MESSAGES.GRPC_ERRORS.COMMON_ERROR,
                    buttonCounts: NUMERICAL.ONE,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                },
            })
        }
        return true;
        // else if (error instanceof Errors.UnknownError) {
        //     nonProdMsg = 'GRPC_FAILED';
        //     logger.error(
        //         "--- rejoinTable :: UnknownError :: ERROR ::",
        //         error,
        //         "userId :: ",
        //         userId
        //     );
        //     commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
        //         socket,
        //         data: {
        //             isPopup: true,
        //             popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
        //             title: nonProdMsg,
        //             message: error && error.message && typeof error.message === 'string'
        //                 ? error.message
        //                 : MESSAGES.GRPC_ERRORS.COMMON_ERROR,
        //             buttonCounts: NUMERICAL.ONE,
        //             button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
        //             button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
        //             button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
        //         },
        //     })
        // } else if (error && error.type === ERROR_TYPE.RE_JOIN_PLAYER_ERROR) {
        //     logger.error(
        //         `--- rejoinTable :: ERROR_TYPE :: ${ERROR_TYPE.RE_JOIN_PLAYER_ERROR}::`,
        //         error,
        //         "userId :: ",
        //         userId
        //     );
        //     nonProdMsg = "Database Error";
        //     commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
        //         socket,
        //         data: {
        //             isPopup: true,
        //             popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
        //             title: nonProdMsg,
        //             message: error && error.message && typeof error.message === 'string'
        //                 ? error.message
        //                 : MESSAGES.GRPC_ERRORS.COMMON_ERROR,
        //             buttonCounts: NUMERICAL.ONE,
        //             button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
        //             button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
        //             button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
        //         },
        //     });
        // } else {
        //     logger.error(
        //         "--- rejoinTable :: commonError :: ERROR ::",
        //         error,
        //         "userId :: ",
        //         userId
        //     );
        //     commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
        //         socket,
        //         data: {
        //             isPopup: true,
        //             popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
        //             title: GRPC_ERROR_REASONS.RE_JOIN_PLAYER_ERROR,
        //             message: error && error.message && typeof error.message === 'string'
        //                 ? error.message
        //                 : MESSAGES.GRPC_ERRORS.COMMON_ERROR,
        //             buttonCounts: NUMERICAL.ONE,
        //             button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
        //             button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
        //             button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
        //         },
        //     });
        // }
    } finally {
        if(rejoinLock){
         await getLock().release(rejoinLock);
        }
    }
}

export = rejoinTable