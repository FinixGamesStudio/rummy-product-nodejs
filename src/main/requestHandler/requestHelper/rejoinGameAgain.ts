import { checkBalanceHandle } from "../../../cms/helper/checkBalance";
import { User } from "../../../cms/interfaces/user_interfaces";
import UserModel from "../../../cms/model/user_model";
import { DB } from "../../../cms/mongoDBServices";
import config from "../../../connections/config";
import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, PLAYER_STATE } from "../../../constants";
import logger from "../../../logger";
import { checkBalance } from "../../clientsideapi";
import { multiPlayerDeductEntryFeeForPoolRummy } from "../../clientsideapi/multiPlayerDeductEntryFeeForPoolRummy";
import { setRoundTableDataComman } from "../../common/setRoundTableData";
import timeDifference from "../../common/timeDiff";
import commonEventEmitter from "../../commonEventEmitter";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../gamePlay/cache/Players";
import { getRoundTableData, setRoundTableData } from "../../gamePlay/cache/Rounds";
import { getScoreBoardHistory, setScoreBoardHistory } from "../../gamePlay/cache/ScoreBoardHistory";
import { getTableData, setTableData } from "../../gamePlay/cache/Tables";
import { getUser, setUser } from "../../gamePlay/cache/User";
import formatScoreboardTimerAndSplitInfo from "../../gamePlay/formatResponse/formatScoreboardTimerAndSplitInfo";
import { leaveRoundTable } from "../../gamePlay/play/leaveTable/leaveRoundTable";
import ScoreBoard from "../../gamePlay/play/scoreBoard/scoreBoad";
import { userProfileUpdate } from "../../gamePlay/signUp/userSignUp/helper";
import { scoreBoardHistoryIf } from "../../interfaces/historyIf";
import { rejoinGameAgainHandlerReqIf } from "../../interfaces/requestIf";
import { userSeatsIf } from "../../interfaces/roundTableIf";
import { getLock } from "../../lock";
import Schedular from "../../scheduler"
import { leaveClientInRoom } from "../../socket";
import { requestValidator } from "../../validator";

async function rejoinGameAgain(
    { data }: rejoinGameAgainHandlerReqIf,
    socket: any,
    ack?: Function
) {
    let rejoinGameAgainLocks = await getLock().acquire([`locks:${data.tableId}:${data.userId}`], 2000);
    const { REJOINT_GAME_POPUP_TIMER } = config();
    try {

        data = await requestValidator.rejoinGameAgainValidator(data);

        const userId = socket.eventMetaData.userId || data.userId;
        const tableId = socket.eventMetaData.tableId || data.tableId;
        const currentRound = socket.eventMetaData.currentRound || data.currentRound;

        logger.info(`------>> rejoinGameAgain :: userId :: `, userId);
        logger.info(`------>> rejoinGameAgain :: tableId :: `, tableId);
        logger.info(`------>> rejoinGameAgain :: currentRound :: `, currentRound);

        const roundTableData = await getRoundTableData(tableId, currentRound);
        logger.info(`------>> rejoinGameAgain :: roundTableData :: `, roundTableData);

        logger.info(`------>> rejoinGameAgain :: roundTableData.eliminatedPlayers :: `, roundTableData.eliminatedPlayers);

        const isEliminated = roundTableData.eliminatedPlayers.includes(userId);

        if (isEliminated) {


            const playerData = await getPlayerGamePlay(userId, tableId);
            logger.info(`------>> rejoinGameAgain :: playerData :: `, playerData);

            if (
                playerData.playingStatus !== PLAYER_STATE.LOST &&
                playerData.playingStatus !== PLAYER_STATE.LEFT
            ) {
                let userData = await getUser(userId)
                logger.info(`------>> rejoinGameAgain :: userData :: `, userData);

                const tableData = await getTableData(tableId);
                logger.info(`------>> rejoinGameAgain :: tableData :: `, tableData);


                    /* check user balance */
                    const isSufficiantBalance = await checkBalanceHandle(userData.lobbyId, userData.userId);
                    logger.info(userData.userId," rejoinGameAgain :: >> isSufficiantBalance  :: >> ", isSufficiantBalance);
                    if (!isSufficiantBalance) {
                           console.log(" rejoinGameAgain :: >> isInsufficiantBalance ::", isSufficiantBalance);
           
                           const nonProdMsg = "Insufficient Balance!"
                           commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                               socket,
                               data: {
                                   isPopup: true,
                                   popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                                   title: nonProdMsg,
                                   message: ERROR_TYPE.INSUFFICIENT_BALANCE,
                                   buttonCounts: NUMERICAL.ONE,
                                   button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                                   button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                                   button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                               }
                           })
                       }

                // check balance 
                // userData = await userProfileUpdate(userData, playerData.socketId);

                // check balance for play new game 
                // let checkBalanceDetail = await checkBalance({ tournamentId: tableData.lobbyId }, userData.authToken, playerData.socketId, userData.userId);
                // logger.info(userData.userId, "checkBalanceDetail  :: rejoinGameAgain >> ", checkBalanceDetail);
                // if (checkBalanceDetail && checkBalanceDetail.userBalance.isInsufficiantBalance) {

                //     console.log("isInsufficiantBalance ::", checkBalanceDetail.userBalance.isInsufficiantBalance);

                //     await leaveClientInRoom(socket.id, tableId);

                    // const nonProdMsg = "Insufficient Balance!"
                    // commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                    //     socket,
                    //     data: {
                    //         isPopup: true,
                    //         popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    //         title: nonProdMsg,
                    //         message: ERROR_TYPE.INSUFFICIENT_BALANCE,
                    //         buttonCounts: NUMERICAL.ONE,
                    //         button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    //         button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    //         button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                    //     }
                    // })

                //     if (rejoinGameAgainLocks) {
                //         await getLock().release(rejoinGameAgainLocks);
                //         rejoinGameAgainLocks = null;
                //     }

                //     return await leaveRoundTable(
                //         false,
                //         true,
                //         userId,
                //         tableId,
                //         currentRound
                //     );

                // }

                // cut amount
                // const deductEntryFeeForPoolRummy = await multiPlayerDeductEntryFeeForPoolRummy(
                //     {
                //         tableId: tableId,
                //         tournamentId: tableData.lobbyId,
                //         userId: userId,
                //     },
                //     socket.authToken
                // )

                // logger.info(`------>> rejoinGameAgain :: deductEntryFeeForPoolRummy :: `, deductEntryFeeForPoolRummy);

                if(userData.isCash){
                    if (userData.cash < tableData.bootAmount) {

                        await leaveClientInRoom(socket.id, tableId);
    
                        const nonProdMsg = "Something Wrong With Balance Deduct!"
                        commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                            socket,
                            data: {
                                isPopup: true,
                                popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                                title: nonProdMsg,
                                message: ERROR_TYPE.SOMETHIG_WRONG_WITH_BALANCE_ERROR,
                                buttonCounts: NUMERICAL.ONE,
                                button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                                button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                                button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                            }
                        });
    
                        if (rejoinGameAgainLocks) {
                            await getLock().release(rejoinGameAgainLocks);
                            rejoinGameAgainLocks = null;
                        }
    
                        return await leaveRoundTable(
                            false,
                            true,
                            userId,
                            tableId,
                            currentRound
                        );
    
                    }
                }else{
                    if (userData.coins < tableData.bootAmount) {

                        await leaveClientInRoom(socket.id, tableId);
    
                        const nonProdMsg = "Something Wrong With Balance Deduct!"
                        commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                            socket,
                            data: {
                                isPopup: true,
                                popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                                title: nonProdMsg,
                                message: ERROR_TYPE.SOMETHIG_WRONG_WITH_BALANCE_ERROR,
                                buttonCounts: NUMERICAL.ONE,
                                button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                                button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                                button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                            }
                        });
    
                        if (rejoinGameAgainLocks) {
                            await getLock().release(rejoinGameAgainLocks);
                            rejoinGameAgainLocks = null;
                        }
    
                        return await leaveRoundTable(
                            false,
                            true,
                            userId,
                            tableId,
                            currentRound
                        );
    
                    }
                }
               

                let count: number = NUMERICAL.ZERO;

                for await (const userID of roundTableData.eliminatedPlayers) {
                    if (userId === userID) {
                        roundTableData.eliminatedPlayers.splice(count, NUMERICAL.ONE);
                        break;
                    }
                    count += NUMERICAL.ONE;
                }
                logger.info(`------>> rejoinGameAgain :: userData :: 1 <<<<----------- `, userData);

                let updateUserData

                if(userData.isCash){
                    logger.info(`------>> rejoinGameAgain :: userData.cash 1111 --------->>>>>`, userData.cash);
                    userData.cash -= tableData.bootAmount;

                    userData.cash = Number(userData.cash.toFixed(NUMERICAL.TWO));
                   logger.info(`------>> rejoinGameAgain :: userData.cash 2222 --------->>>>>`, userData.cash);

                }else{
                    logger.info(`------>> rejoinGameAgain :: userData.coins 1111 --------->>>>>`, userData.coins);
                    userData.coins -= tableData.bootAmount;

                    userData.coins = Number(userData.coins.toFixed(NUMERICAL.TWO));
                    logger.info(`------>> rejoinGameAgain :: userData.coins 2222--------->>>>>`, userData.coins);

                }
                // userData.balance -= tableData.bootAmount;

                // userData.balance = Number(userData.balance.toFixed(NUMERICAL.TWO));

                await setUser(playerData.userId, userData);
                logger.info(`------>> rejoinGameAgain :: userData :: 2 --------->>>>>`, userData);

                let userDetail = await getUser(userId)
                logger.info(`------>> rejoinGameAgain :: userDetail :: `, userDetail);

                updateUserData ={
                    coins:userData.coins,
                    cash : userData.cash
                }
                logger.info(`------>> rejoinGameAgain :: updateUserData  --------->>>>>`, updateUserData);

                const updatedUser: User = await DB.findOneAndUpdate(UserModel, {
                    query: { _id: playerData.userId },
                    updateData: { $set: updateUserData }
                });
                logger.info("rejoinGameAgain :: updatedUser :: ==>>", updatedUser)

                // set Coin in RoundTableData
                await setRoundTableDataComman(userDetail,tableId)

                let roundData =  await getRoundTableData(tableId,tableData.currentRound)
                logger.info(`------>> rejoinGameAgain :: roundData :: ::`, roundData);

                // add rejoin playre in TGP
                roundData.rejoinGamePlayer += NUMERICAL.ONE;
                roundData.rejoinGamePlayersName.push(playerData.username);
                playerData.gamePoints = roundData.roundMaxPoint + NUMERICAL.ONE;
                playerData.isWaitingForRejoinPlayer = false;

                const scoreBoardData: scoreBoardHistoryIf = await getScoreBoardHistory(tableId);
                logger.info(`------>> rejoinGameAgain :: scoreBoardData :: 1 ::`, scoreBoardData);

                let scoreBoardCount: number = NUMERICAL.ONE;

                for await (const scoreBoard of Object.keys(scoreBoardData)) {

                    let userIndexInScoreBoard: number = NUMERICAL.ZERO;

                    for await (const userScoreBoard of scoreBoardData[`Round${scoreBoardCount}`].scoreBoradTable) {
                        if (userScoreBoard.userId === userId) {
                            if (scoreBoardCount === currentRound) {
                                scoreBoardData[`Round${scoreBoardCount}`].scoreBoradTable[userIndexInScoreBoard].DealScore = roundTableData.roundMaxPoint + NUMERICAL.ONE;
                            } else {
                                scoreBoardData[`Round${scoreBoardCount}`].scoreBoradTable[userIndexInScoreBoard].message = MESSAGES.MESSAGE.REJOIN_AGAIN_GAME;
                            }
                        }

                        userIndexInScoreBoard += NUMERICAL.ONE;

                    }
                    scoreBoardCount += NUMERICAL.ONE;
                }

                logger.info(`------>> rejoinGameAgain :: scoreBoardData :: 2 ::`, scoreBoardData);

                await setScoreBoardHistory(tableId, scoreBoardData)

                // change win prize
                tableData.winPrice = ((roundData.splitPlayers + roundData.rejoinGamePlayer) * tableData.bootAmount) * (1 - (tableData.rake / 100));
                tableData.winPrice = Number(tableData.winPrice.toFixed(NUMERICAL.TWO));

               let updateTableData =  await setTableData(tableData);
               let updateRoundTableData = await setRoundTableData(tableId, currentRound, roundData);
               let updatePlayerGamePlay = await setPlayerGamePlay(userId, tableId, playerData);

               logger.info("rejoinGameAgain :: :: :: updateTableData :: ::  :: ==>>", updateTableData)
               logger.info("rejoinGameAgain :: :: :: updateRoundTableData :: ::  :: ==>>", updateRoundTableData)
               logger.info("rejoinGameAgain :: :: :: updatePlayerGamePlay :: ::  :: ==>>", updatePlayerGamePlay)


                if (roundData.eliminatedPlayers.length === NUMERICAL.ZERO) {
                    // cancel timer
                    await Schedular.cancelJob.rejoinGamePopupCancel(tableId);

                    await setRoundTableData(tableId, currentRound, roundData);

                    if (rejoinGameAgainLocks) {
                        await getLock().release(rejoinGameAgainLocks);
                        rejoinGameAgainLocks = null;
                    }

                    await ScoreBoard(tableId, currentRound, false, true);
                } else {
                    logger.info(`------>> rejoinGameAgain :: SCORE_BOARD Message Change :: `);
                    const timeDiff: number = timeDifference(new Date(), playerData.updatedAt, REJOINT_GAME_POPUP_TIMER);

                    const scoreBoardTimerAndSplitRes = await formatScoreboardTimerAndSplitInfo(
                        timeDiff,
                        MESSAGES.MESSAGE.WAITING_FOR_PLAYER_REJOIN_MESSAGE,
                        false,
                        [],
                        false
                    );

                    commonEventEmitter.emit(EVENTS.SCOREBOARD_TIMER_AND_SPLIT, {
                        socket: socket.id,
                        data: scoreBoardTimerAndSplitRes
                    });

                }
            } else {
                logger.warn(`--- rejoinGameAgain :: this player already left or lost ::`)
            }
        } else {
            logger.warn(`--- rejoinGameAgain :: this player not eliminated ::`)
        }

    } catch (error) {
        logger.error(`--- rejoinGameAgain :: ERROR :: `, error);
    } finally {
        if (rejoinGameAgainLocks) {
            await getLock().release(rejoinGameAgainLocks);
        }
    }
}

export = rejoinGameAgain;
