import { ERROR_TYPE, EVENTS, GAME_TYPE, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, PLAYER_STATE, REDIS, RUMMY_TYPES, TABLE_STATE, USER_GAME_RUNNING_STATUS } from "../../../../constants";
import logger from "../../../../logger";
import { userIf } from "../../../interfaces/userSignUpIf";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../cache/Players";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import { getTableData, setTableData } from "../../cache/Tables";
import { formatGameTableInfo, formatRoundstartInfo, formatSignupAck, formatWaitingPlayersInfo } from "../../formatResponse";
import socketAck from "../../../../socketAck"
import formatJoinTableInfo from "../../formatResponse/formatJoinTableInfo";
import commonEventEmitter from "../../../commonEventEmitter";
import { setRejoinTableHistory } from "../../cache/TableHistory";
import Scheduler from "../../../scheduler"
import Errors from "../../../errors"
import config from "../../../../connections/config";
import { getLock } from "../../../lock";
import { throwErrorIF } from "../../../interfaces/throwError";
import rejoinTable from "../../play/rejoinTable";
import { getQueueForBot, removeQueue, setQueue } from "../../utils/manageQueue";
import { timeDifference } from "../../../common";
import ackTablesData from "../../utils/ackTablesData";
import { getUser, setUser } from "../../cache/User";
import { getOnliPlayerCountLobbyWise, incrCounterLobbyWise, setCounterIntialValueLobby } from "../../cache/onlinePlayer";
import { addGameRunningStatus } from "../../../clientsideapi/addGameRunningStatus";
import { setOldTableIdsHistory } from "../../utils/setOldTableIdsHistory";
import { createTable, findAvaiableTable, insertPlayerInTable, setupRound } from "./comman";
import leaveTable from "../../play/leaveTable";
import userDisconnect from "../../signUp/userDisconnect";
import { generateReferralCode } from "../../../common/getRandomNumber";
import { setReffCode } from "../../utils/reffCodeData";
import { getRefCodeHistory } from "../../cache/reffCode.ts";
import { PrivateTableFull } from "../../../privateTableManage/priavteTableFull";
import { privateTableManage } from "../../../privateTableManage";
import { checkBalanceHandle } from "../../../../cms/helper/checkBalance";
import { gameRunningStatusManage } from "../../../../cms/helper/gameRunningStatus";
import UsersGameRunningStatusModel from "../../../../cms/model/runningGameStatus.model";
import findBotTimerQueue from "../../../scheduler/queues/BOT/findBot.queue";
import { DB } from "../../../../cms/mongoDBServices";
import privateTableKeyModel from "../../../../cms/model/privateTableKey.model";


export async function insertNewPlayer(
    userData: userIf,
    socket: any,
    botTabledId:string,
    ack: Function
): Promise<any> {

    logger.info("=====================>> insertNewPlayer <<=======================");

    let { gameId, lobbyId, isFTUE, fromBack, userId, isCreateRoom, isReferralCode , isPrivateTableContinue,gameEntryFee,isLink } = userData
    const gameType = GAME_TYPE.SOLO
    // const queueKey = `${gameType}:${gameId}:${lobbyId}`
    const { GAME_START_TIMER, TOTAL_GAME_START_TIMER, WAITING_FOR_PLAYER,SERVER_URL } = config();
    // let tableLocks = await getLock().acquire([`locks:${lobbyId}`], 2000);
    let queueKey: string = "";
    let referralCode: string = "";
    let isFirstTimerRef: boolean = false;

    //rejoin
    let createOrJoinTable = await rejoinTable(userData.userId, gameId, lobbyId, socket, ack);
    logger.info("----->> insertNewPlayer :: createOrJoinTable :: ", createOrJoinTable);
    

    // public
    if(!isCreateRoom && isReferralCode === ""){
      queueKey = `${gameType}:${gameId}:${lobbyId}`;
    logger.info(` public :::::  queueKey :::>> `,queueKey);

     }

      //  create private table
      else if(isCreateRoom && isReferralCode ===""){
        referralCode = await generateReferralCode(6);
        logger.info(` private ::--------------------- :::>> `,referralCode);
         queueKey =`${gameType}:${referralCode}`
         userData.isReferralCode = referralCode
         await setUser(userId,userData)

         isFirstTimerRef = true;
         isPrivateTableContinue = false 

         await setReffCode(referralCode);
      }

     //  join Private Table
     else if (isCreateRoom && isReferralCode != "") {
     referralCode =isReferralCode
        logger.info(` after ::--------------------- :::>> `);
        logger.info(
          ` after ::--------------------- isPrivateTableContinue :::>> `,
          isPrivateTableContinue
         );
    
        if (isPrivateTableContinue) {
            isFirstTimerRef = true;
         }
         queueKey = `${gameType}:${isReferralCode}`;
    } else {
       logger.info(` ELSE :::::  queueKey :::>> `);
        queueKey = `${gameType}:${gameId}:${lobbyId}`;
     }
     logger.info(` after :: queueKey :::>> `, queueKey);

     logger.info(
        "---->>> insertNewPlayer :: isFirstTimerRef :: ",
        isFirstTimerRef
      );
    
       logger.info("---->>> insertNewPlayer :: isCreateRoom :: ", isCreateRoom);
       logger.info("---->>> insertNewPlayer :: isReferralCode :: ", isReferralCode);
       logger.info(userId, ` :: >> insertNewPlayer isLink  :::>> `, isLink);
       logger.info(userId, ` :: >> insertNewPlayer userData  :::>> `, userData);

       if (!isFirstTimerRef && isCreateRoom && isReferralCode) {
        // getRefCode History
    
        const refCodeData = await getRefCodeHistory();
        logger.info("---->>> insertNewPlayer :: refCodeData :: ", refCodeData);

      if(isLink){
        if(refCodeData == null){
            logger.info(` IF refCodeData NULL ::::: >>>>>> ::`)
            await PrivateTableFull(socket);
          return false;
        }else{
            const isAvalibleCode = refCodeData.includes(isReferralCode);
            logger.info("---->>> insertNewPlayer isLink :: isAvalibleCode :: ", isAvalibleCode);

            if (!isAvalibleCode) {
                logger.info(` IF isLink ::::: >>>>>> ::`)
                await PrivateTableFull(socket);
              return false;
            } 
        }
      }else{
        // check code is include in history
        if (refCodeData) {
          if (refCodeData.length > NUMERICAL.ZERO) {
            const isAvalibleCode = refCodeData.includes(isReferralCode);
            logger.info("---->>> insertNewPlayer :: isAvalibleCode :: ", isAvalibleCode);

            if (!isAvalibleCode) {
                logger.info(` IF  ::::: >>>>>> ::`)
              await privateTableManage(socket);
              return false;
            }
          }
        } else {
        logger.info(` ELSE ::::: >>>>>> :: :: privateTableManage :::>> `);
          await privateTableManage(socket);
          return false;
        }
    }
    
       }

       let tableLocks = await getLock().acquire([`locks:${lobbyId}`], 2000);
    try {
        // let createOrJoinTable: boolean | undefined = true;

        // // rejoin table
        // createOrJoinTable = await rejoinTable(userData.userId, gameId, lobbyId, socket, ack);
        // logger.info("----->> insertNewPlayer :: createOrJoinTable :: ", createOrJoinTable);


        logger.info(userId, ` :: >> userData  :::>> `, userData.userId);

        if (createOrJoinTable) {

            // /* check user balance */
            //  const isSufficiantBalance = await checkBalanceHandle(userData.lobbyId, userData.userId);
            //  logger.info(userData.userId," insertNewPlayer :: >> isSufficiantBalance  :: >> ", isSufficiantBalance);
            //  if (!isSufficiantBalance) {
            //         console.log(" insertNewPlayer :: >> isInsufficiantBalance ::", isSufficiantBalance);
    
            //         const sendEventData = {
            //             statusFlag: true,
            //             reason: MESSAGES.POPUP.COMMAN_TOAST_POPUP.INSUFFICIENT_FUND_POPUP_MESSAGE,
            //             type: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
            //             title: GRPC_ERROR_REASONS.GRPC_AUTH_INSUFFICIENT_FUND_ERROR,
            //             buttonCount: NUMERICAL.ONE,
            //             button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
            //             button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
            //             button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
            //             showLoader: false,
            //         }
            //         throw new Errors.InsufficientFundError(sendEventData);
            //     }

            // // check balance for play new game 
            // let checkBalanceDetail = await checkBalance({ tournamentId: userData.lobbyId }, userData.authToken, userData.socketId, userData.userId);
            // logger.info(userData.userId, "checkBalanceDetail  :: >> ", checkBalanceDetail);
            // if (checkBalanceDetail && checkBalanceDetail.userBalance.isInsufficiantBalance) {
            //     console.log("isInsufficiantBalance ::", checkBalanceDetail.userBalance.isInsufficiantBalance);

            //     const sendEventData = {
            //         statusFlag: true,
            //         reason: MESSAGES.POPUP.COMMAN_TOAST_POPUP.INSUFFICIENT_FUND_POPUP_MESSAGE,
            //         type: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
            //         title: GRPC_ERROR_REASONS.GRPC_AUTH_INSUFFICIENT_FUND_ERROR,
            //         buttonCount: NUMERICAL.ONE,
            //         button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
            //         button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
            //         button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
            //         showLoader: false,
            //     }
            //     throw new Errors.InsufficientFundError(sendEventData);
            // }

            const previoustableId = userData.oldTableId ? userData.oldTableId : [];
            logger.info('---->> insertNewPlayer ::: previoustableId ::: ', previoustableId);

            let tableId:string|null = ""
            logger.info('---->> insertNewPlayer :::userData.isBot ::: ', userData.isBot);
            logger.info('---->> insertNewPlayer :::botTabledId ::: ', botTabledId);
            if(botTabledId && userData.isBot){
                tableId = await getQueueForBot(queueKey, botTabledId);
                logger.info('---->> insertNewPlayer ::: before tableId ::: ', tableId);
            }else{
                 tableId = await findAvaiableTable(queueKey, previoustableId);
                logger.info('---->> insertNewPlayer ::: before tableId :1:: ', tableId);
                logger.info('---->> insertNewPlayer :::userData.isBot :1:: ', userData.isBot);
            }

            if (!tableId) {

            //join private table validation
             if (!isFirstTimerRef && isCreateRoom && isReferralCode) {
                // table full
                await PrivateTableFull(socket);
                return false;    
             }else{
                tableId = await createTable(userData);

                await setupRound({
                    tableId,
                    roundNo: NUMERICAL.ONE,
                    totalPlayers: userData.maximumSeat,
                    dealType: userData.dealType,
                    rummyType: userData.rummyType
                });
            }
            }
            // else {
            //     // blocking user check
            //     let blockUserData = await blockUserCheck(tableId, userData, queueKey) as blockUserCheckI;
            //     if (!blockUserData) throw new Error(`Could not block user`);

            //     logger.info(userId, `blockUserData :: >>`, blockUserData);
            //     tableId = blockUserData.tableId;

            //     if (!blockUserData.isNewTableCreated) {

            //         //     //redius check
            //         const rediusCheckData: rediusCheckDataRes = await rediusCheck(gameId, userData.authToken, userData.socketId, tableId);
            //         logger.info("userData.isBot  ==>>>", userData.isBot)
            //         if (rediusCheckData) {

            //             let rangeRediusCheck: number = parseFloat(rediusCheckData.LocationRange);
            //             if (rediusCheckData && rediusCheckData.isGameRadiusLocationOn && rangeRediusCheck != NUMERICAL.ZERO && userData.isBot == false) {

            //                 logger.info("locationDistanceCheck ===>> before", tableId, rangeRediusCheck);
            //                 tableId = await locationDistanceCheck(tableId, userData, queueKey, rangeRediusCheck);
            //             }
            //         }
            //     }

            //     // remove user block tables queued for db
            //     await removeBlockuserAllTableQueue(userData.userId)

            // }

            logger.info("----->> insertNewPlayer :: tableId :: ", tableId)

            const tableData = await getTableData(tableId);
            logger.info("----->> insertNewPlayer :: tableData :: ", tableData);

            if (tableData === null) {
                const errorObj: throwErrorIF = {
                    type: ERROR_TYPE.INSERT_NEW_PLAYER_ERROR,
                    message: MESSAGES.ERROR.TABLE_NOT_FOUND_ERROR_MESSAGES,
                    isCommonToastPopup: true,
                };
                throw errorObj;
            }

            const roundTableDataInfo = await getRoundTableData(tableId, tableData.currentRound);
            logger.info("----->> insertNewPlayer :: roundTableDataInfo :: ", roundTableDataInfo);

            if (roundTableDataInfo === null) {
                const errorObj: throwErrorIF = {
                    type: ERROR_TYPE.INSERT_NEW_PLAYER_ERROR,
                    message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                    isCommonToastPopup: true,
                };
                throw errorObj;
            }

            // inserting player in table
            const seatIndex: number | null = await insertPlayerInTable(
                userData,
                tableId,
                queueKey,
                previoustableId
            );

            const roundTableData = await getRoundTableData(tableId, tableData.currentRound);
            logger.info("----->> insertNewPlayer :: roundTableData :: ", roundTableData);

            tableData.winPrice = (roundTableData.totalPlayers * tableData.bootAmount) * (1 - (tableData.rake / 100))
            await setTableData(tableData);

            if (seatIndex === -1) throw new Error(`no have a assign the seat : ${userData}`);
            logger.info("----->> insertNewPlayer :: seatIndex :: ", seatIndex)

            logger.info('roundTableData :: 1::');

            //send popup
            if(tableData == null && roundTableData == null && isCreateRoom && isReferralCode !=""){
                console.log("gamePrivate Table :: starting ............................................")
                const socketId = socket.id;
                let nonProdMsg = "Check Your Code";
                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                  socket: socketId,
                  data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: nonProdMsg,
                    message: MESSAGES.ERROR.PRIVATE_TABLE_IS_CLOSE,
                    buttonCounts: NUMERICAL.ONE,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.OK],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT_BTN_CLICK],
                    showLoader: false,
                  },
                });
                return true
              }


            const eventGTIdata = await formatGameTableInfo(
                tableData,
                roundTableData,
                NUMERICAL.ONE
                // seatIndex,
            );

            logger.info("----->> insertNewPlayer :: formatGameTableInfo :: ", eventGTIdata);

            const eventJoinTableData = await formatJoinTableInfo(
                seatIndex,
                roundTableData,
            );

            logger.info("----->> insertNewPlayer :: formatJoinTableInfo :: ", eventJoinTableData)

            logger.info('roundTableData :: 2 ::');

            let getOnlinePlayerCountLobbyWise = await getOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId);
            if (!getOnlinePlayerCountLobbyWise) await setCounterIntialValueLobby(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId);
            let countLobbyWise = await incrCounterLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId);

            logger.info('-------->> insertNewPlayer :: countLobbyWise :: count :: ', countLobbyWise);

            const tablesRes = await ackTablesData([tableId], userData.userId);
            const formatedAckRes = await formatSignupAck(userData, tablesRes, false);

            socketAck.ackMid(
                EVENTS.SIGN_UP_SOCKET_EVENT,
                formatedAckRes,
                userId,
                tableId,
                ack
            );

            commonEventEmitter.emit(EVENTS.ADD_PLAYER_IN_TABLE_ROOM, {
                socket,
                data: {
                    tableId
                }
            })

            commonEventEmitter.emit(EVENTS.JOIN_TABLE_SOCKET_EVENT, {
                tableId,
                data: {
                    selfPlayerData: eventJoinTableData,
                    tableInfo: eventGTIdata
                }

            })

            logger.info('roundTableData :: 3 ::');

            // create gameRunning status

                // if(isCreateRoom){
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
               logger.info('----->> insertNewPlayer :: userRunningGame ::',userRunningGame);

            // }

           

            // SHARE_REFERRAL_CODE

            if (isCreateRoom && isReferralCode === "") {
            
              // add referralCode data in mongoDB
              const findTable = await DB.create(privateTableKeyModel, {
                insert: { 
                    lobbyId:tableData.lobbyId,
                    tableId,
                    gameId:tableData.gameId,
                    isCreateRoom:tableData.isCreateRoom,
                    isReferralCode:tableData.isReferralCode
                 },
              });
               logger.info('----->> insertNewPlayer :: findTable ::',findTable);

                // referralCode pop send
                 commonEventEmitter.emit(EVENTS.SHARE_REFERRAL_CODE, {
                 tableId,
                  data: {
                  referralCode: referralCode,
                   // message: `Play Point Rummy with friend on my private table.\nTo join this private table use the code below or you can join using the link.\n\ncode:${referralCode}\n\n OR \n\n ${config.SERVER_URL}/deeplink/${referralCode}`,
                  message: `Play Rummy with friends on private table.\nTo join this private table use the code below or you can join using the link\n\ncode : ${referralCode}\n\n OR \n`,
                  url: `${SERVER_URL}/deeplink/${referralCode}`,
                },
             });
            }
   

            socket.eventMetaData = {
                userId: roundTableData.seats[`s${seatIndex}`].userId,
                userObjectId: roundTableData.seats[`s${seatIndex}`]._id,
                tableId,
                roundId: roundTableData._id,
                currentRound: tableData.currentRound,
                dealType: tableData.dealType,
                poolType: tableData.gamePoolType
            };


            if (!socket.connected) {
                if (tableLocks) {
                    await getLock().release(tableLocks);
                    tableLocks = null;
                }

                let seatPlayerCount: number = NUMERICAL.ZERO;
                for await (const seat of Object.keys(roundTableData.seats)) {
                    if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                        seatPlayerCount += NUMERICAL.ONE;
                    }
                }

                if (seatPlayerCount === NUMERICAL.ZERO || seatPlayerCount === NUMERICAL.ONE) {
                    return await leaveTable(tableId, socket)
                } else {
                    socket.disconnect();
                    return await userDisconnect(socket)
                }
            }

            //add oldtableId in user data
            if(!userData.isCreateRoom){
               logger.info('----->> insertNewPlayer :: userData.isCreateRoom ::',userData.isCreateRoom);

                userData = await setOldTableIdsHistory(userData, tableId);

            }
            await setUser(userId, userData);
            logger.info('----->> insertNewPlayer :: userData ---->>> 1 ::',userData);

            await setRejoinTableHistory(
                roundTableData.seats[`s${seatIndex}`].userId,
                gameId,
                lobbyId,
                {
                    userId: roundTableData.seats[`s${seatIndex}`].userId,
                    tableId,
                    lobbyId,
                    isEndGame: false,
                },
            );

            if (
                roundTableDataInfo.tableState === TABLE_STATE.WAITING_FOR_PLAYERS ||
                roundTableDataInfo.tableState === TABLE_STATE.WAIT_FOR_PLAYER ||
                roundTableDataInfo.tableState === TABLE_STATE.ROUND_TIMER_STARTED

            ) {

                if (roundTableData.totalPlayers < tableData.minPlayerForPlay) {

                    await setQueue(queueKey, tableId);

                    const userInfo = await getUser(userData.userId);
                    if((isLink && isReferralCode !== "" )|| (!isLink && isReferralCode !== "" )){
                        userInfo.OldLobbyId = tableData.lobbyId;
                        userInfo.lobbyId = tableData.lobbyId;
                        userInfo.maximumSeat = tableData.maximumSeat;
                    }else{
                        userInfo.OldLobbyId = lobbyId;
                    }
                    await setUser(userInfo.userId, userInfo);
                    logger.info('------>> roundTableData :::: insertNewPlayer ::: 1 userInfo ::', userInfo);

                    logger.info('------>> roundTableData :: userInfo ::', userInfo);

                    // await addGameRunningStatus(
                    //     {
                    //         tableId,
                    //         tournamentId: lobbyId,
                    //         gameId,
                    //     },
                    //     userData.authToken,
                    //     userData.socketId,
                    //     userData.userId
                    // )

                    logger.info('------>> roundTableData :: waitForPlayer ::');

                    roundTableData.tableState = TABLE_STATE.WAIT_FOR_PLAYER;
                    await setRoundTableData(tableId, NUMERICAL.ONE, roundTableData);

                    commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                        tableId,
                        data: {
                            isPopup: true,
                            popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOST_POPUP,
                            title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                            message: MESSAGES.POPUP.CENTER_TOAST_POPUP.WAIT_PLAYER_POPUP_MESSAGE,
                        }
                    });

                    logger.info('------>> roundTableData :: tableData.isUseBot :: -->>', tableData.isUseBot);

                    /* bot seat and how many bot seat */
                    if (tableData.isUseBot && roundTableData.totalPlayers < tableData.minPlayerForPlay && !isCreateRoom) {
                        findBotTimerQueue({
                            jobId: tableId,
                            timer: userData.botJoinTimer * NUMERICAL.THOUSAND,
                            tableId,
                            userId
                        });
                    }
                }

                if (tableData.minPlayerForPlay <= roundTableData.totalPlayers) {

                    await addGameRunningStatus(
                        {
                            tableId,
                            tournamentId: lobbyId,
                            gameId,
                        },
                        userData.authToken,
                        userData.socketId,
                        userData.userId
                    )

                    if (roundTableData.totalPlayers === tableData.maximumSeat) {

                        await removeQueue(queueKey, tableId)

                        if (
                            roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER ||
                            roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS
                        ) {
                            logger.info('------>> roundTableData :: ROUND STARTED ::');
                            await Scheduler.cancelJob.WaitingForPlayerCancel(tableId)

                            // // for set oldtableIDs
                            // for await (const seat of Object.keys(roundTableData.seats)) {
                            //     if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                            //         const userDataInfo = await getUser(roundTableData.seats[seat].userId);
                            //         userDataInfo.OldLobbyId = lobbyId;
                            //         await setUser(roundTableData.seats[seat].userId, userDataInfo);
                            //         logger.info('------>> roundTableData :: userData ::', userDataInfo);

                            //         await addGameRunningStatus(
                            //             {
                            //                 tableId,
                            //                 tournamentId: lobbyId,
                            //                 gameId,
                            //             },
                            //             userDataInfo.authToken,
                            //             userDataInfo.socketId,
                            //             userDataInfo.userId
                            //         )
                            //     }
                            // }

                            const userInfo = await getUser(userData.userId);
                            if((isLink && isReferralCode !== "" )|| (!isLink && isReferralCode !== "" )){
                                userInfo.OldLobbyId = tableData.lobbyId;
                                userInfo.lobbyId = tableData.lobbyId;
                                userInfo.maximumSeat = tableData.maximumSeat;
                            }else{
                                userInfo.OldLobbyId = lobbyId;
                            }
                            await setUser(userData.userId, userInfo);
                            logger.info('------>> roundTableData :::: insertNewPlayer ::: 2 userInfo ::', userInfo);


                            roundTableData.tableState = TABLE_STATE.ROUND_TIMER_STARTED;
                            roundTableData.updatedAt = new Date();
                            await setRoundTableData(tableId, NUMERICAL.ONE, roundTableData);

                            const formatedRoundStartRes = await formatRoundstartInfo(tableId, TOTAL_GAME_START_TIMER);
                            logger.info("------>> insertNewPlayer ::  formatRoundstartInfo :: ", formatedRoundStartRes);

                            commonEventEmitter.emit(EVENTS.ROUND_TIMER_STARTED_SOCKET_EVENT, {
                                tableId,
                                data: formatedRoundStartRes
                            });

                            await Scheduler.addJob.InitializeGameplay({
                                timer: GAME_START_TIMER * NUMERICAL.THOUSAND,
                                tableId,
                                queueKey,
                                currentRound: tableData.currentRound
                            });

                        } else if (roundTableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED) {

                            // for await (const seat of Object.keys(roundTableData.seats)) {

                            //     if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {

                            //         const userDataInfo = await getUser(roundTableData.seats[seat].userId);
                            //         userDataInfo.OldLobbyId = lobbyId;
                            //         await setUser(roundTableData.seats[seat].userId, userDataInfo);

                            //         logger.info('------>> roundTableData :: userData ::', userDataInfo);

                            //         await addGameRunningStatus(
                            //             {
                            //                 tableId,
                            //                 tournamentId: lobbyId,
                            //                 gameId,
                            //             },
                            //             userDataInfo.authToken,
                            //             userDataInfo.socketId,
                            //             userDataInfo.userId
                            //         )
                            //     }

                            // }


                            // keval add 
                            const userInfo = await getUser(userData.userId);
                            if((isLink && isReferralCode !== "" )|| (!isLink && isReferralCode !== "" )){
                                userInfo.OldLobbyId = tableData.lobbyId;
                                userInfo.lobbyId = tableData.lobbyId;
                                userInfo.maximumSeat = tableData.maximumSeat;
                            }else{
                                userInfo.OldLobbyId = lobbyId;
                            }
                            await setUser(userInfo.userId, userInfo);
                           logger.info('------>> roundTableData :::: insertNewPlayer ::: 3 userInfo ::', userInfo);

                            logger.info('------>> roundTableData :: userInfo ::', userInfo);


                            roundTableData.tableState = TABLE_STATE.ROUND_TIMER_STARTED;
                            await setRoundTableData(tableId, NUMERICAL.ONE, roundTableData);

                            const remainGameStartTimer = timeDifference(new Date(), roundTableData.updatedAt, TOTAL_GAME_START_TIMER)
                            logger.info('------>> roundTableData :: remainGameStartTimer ::', remainGameStartTimer);

                            const formatedRoundStartRes = await formatRoundstartInfo(tableId, remainGameStartTimer);
                            logger.info("------>> insertNewPlayer ::  formatRoundstartInfo :: ", formatedRoundStartRes);

                            commonEventEmitter.emit(EVENTS.ROUND_TIMER_STARTED_SOCKET_EVENT, {
                                tableId,
                                data: formatedRoundStartRes
                            });
                        }

                    } else {
                        logger.info('------>> roundTableData :: WAITING_FOR_PLAYERS STARTED ::');

                        await setQueue(queueKey, tableId);

                        if (
                            roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER ||
                            roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS
                        ) {

                            roundTableData.tableState = TABLE_STATE.WAITING_FOR_PLAYERS;

                            if (roundTableData.totalPlayers === tableData.minPlayerForPlay) {

                                roundTableData.updatedAt = new Date();

                                // for await (const seat of Object.keys(roundTableData.seats)) {

                                //     if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                                //         const userInfo = await getUser(roundTableData.seats[seat].userId);
                                //         userInfo.OldLobbyId = lobbyId;
                                //         await setUser(roundTableData.seats[seat].userId, userInfo);
                                //         logger.info('------>> roundTableData :: userInfo ::', userInfo);
                                //         await addGameRunningStatus(
                                //             {
                                //                 tableId,
                                //                 tournamentId: lobbyId,
                                //                 gameId,
                                //             },
                                //             userInfo.authToken,
                                //             userInfo.socketId,
                                //             userInfo.userId
                                //         )
                                //     }

                                // }
                            // } else {
                                const userInfo = await getUser(userData.userId);
                                if((isLink && isReferralCode !== "" )|| (!isLink && isReferralCode !== "" )){
                                    userInfo.OldLobbyId = tableData.lobbyId;
                                    userInfo.lobbyId = tableData.lobbyId;
                                    userInfo.maximumSeat = tableData.maximumSeat;
                                }else{
                                    userInfo.OldLobbyId = lobbyId;
                                }
                                await setUser(userInfo.userId, userInfo);

                                logger.info('------>> roundTableData :: userInfo ::', userInfo);

                                await Scheduler.addJob.WaitingForPlayer({
                                    timer: WAITING_FOR_PLAYER * NUMERICAL.THOUSAND,
                                    tableId,
                                    queueKey,
                                    currentRound: tableData.currentRound,
                                    lobbyId
                                });

                            }

                            await setRoundTableData(tableId, NUMERICAL.ONE, roundTableData);
                            const remainWaitingTimer = timeDifference(new Date(), roundTableData.updatedAt, WAITING_FOR_PLAYER)
                            logger.info("----->> insertNewPlayer ::  remainWaitingTimer :: ", remainWaitingTimer);

                            const formatedWaitingPlayersRes = await formatWaitingPlayersInfo(tableId, roundTableData.currentRound, remainWaitingTimer)
                            logger.info("----->> insertNewPlayer ::  formatWaitingPlayersInfo :: ", formatedWaitingPlayersRes);

                            commonEventEmitter.emit(EVENTS.WAITING_FOR_PLAYER_SOCKET_EVENT, {
                                tableId,
                                data: formatedWaitingPlayersRes
                            });

                            // await Scheduler.addJob.WaitingForPlayer({
                            //     timer: WAITING_FOR_PLAYER * NUMERICAL.THOUSAND,
                            //     tableId,
                            //     queueKey,
                            //     currentRound: tableData.currentRound,
                            //     lobbyId
                            // });
                            
                            logger.info('------>> roundTableData :: 1 :: tableData.isUseBot ::-->>', tableData.isUseBot);

                            /* bot seat and how many bot seat */
                            if (tableData.isUseBot && roundTableData.totalPlayers < tableData.minPlayerForPlay && !isCreateRoom) {
                                findBotTimerQueue({
                                    jobId: tableId,
                                    timer: userData.botJoinTimer * NUMERICAL.THOUSAND,
                                    tableId,
                                    userId
                                });
                            }

                        }
                        else if (roundTableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED) {

                            const userInfo = await getUser(userData.userId);
                            if((isLink && isReferralCode !== "" )|| (!isLink && isReferralCode !== "" )){
                                userInfo.OldLobbyId = tableData.lobbyId;
                                userInfo.lobbyId = tableData.lobbyId;
                                userInfo.maximumSeat = tableData.maximumSeat;
                            }else{
                                userInfo.OldLobbyId = lobbyId;
                            }
                            await setUser(userInfo.userId, userInfo);
                            logger.info('------>> roundTableData :::: insertNewPlayer ::: 5 userInfo ::', userInfo);


                            // await addGameRunningStatus(
                            //     {
                            //         tableId,
                            //         tournamentId: lobbyId,
                            //         gameId,
                            //     },
                            //     userInfo.authToken,
                            //     userInfo.socketId,
                            //     userInfo.userId
                            // )

                            const remainGameStartTimer = timeDifference(new Date(), roundTableData.updatedAt, TOTAL_GAME_START_TIMER)
                            logger.info('------>> roundTableData :: remainGameStartTimer ::', remainGameStartTimer);

                            const formatedRoundStartRes = await formatRoundstartInfo(tableId, remainGameStartTimer)
                            logger.info("------>> waitForPlayers :: formatRoundstartInfo :: ", formatedRoundStartRes);

                            commonEventEmitter.emit(EVENTS.ROUND_TIMER_STARTED_SOCKET_EVENT, {
                                tableId,
                                data: formatedRoundStartRes
                            })

                        }

                    }

                    logger.info('roundTableData :: 4:: initGame')
                }
            }
            else if (tableData.rummyType === RUMMY_TYPES.POINT_RUMMY) {

                let playerCount = NUMERICAL.ZERO;

                for await (const seat of Object.keys(roundTableData.seats)) {
                    if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                        playerCount += NUMERICAL.ONE;
                    }
                }

                // remove table queue
                if (playerCount === tableData.maximumSeat) {
                    await removeQueue(queueKey, tableId);
                } else if (playerCount < tableData.maximumSeat) {
                    await setQueue(queueKey, tableId);
                }

                userData.OldLobbyId = lobbyId;
                await setUser(userData.userId, userData);

                const playerData = await getPlayerGamePlay(userId, tableId);

                playerData.playingStatus = PLAYER_STATE.WATCHING;
                playerData.userStatus = PLAYER_STATE.WATCHING;

                await setPlayerGamePlay(userId, tableId, playerData);

                // send watching center toast popup

                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                    socket: playerData.socketId,
                    data: {
                        isPopup: true,
                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.DOWN_CENTER_TOAST_POPUP,
                        title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                        message: MESSAGES.POPUP.CENTER_TOAST_POPUP.YOU_ARE_SEAT_IN_WATCHING_MODE_PLEASE_WAITING_FOR_NEW_GAME_START,
                    }
                });

            }
            else {
                // res for if table state is not WAITING_FOR_PLAYERS
                logger.warn("----->> insertNewPlayer :: round already start !");
                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                    tableId: socket.eventMetaData.tableId,
                    data: {
                        isPopup: true,
                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                        title: MESSAGES.POPUP.POPUP_TITLE.GO_TO_LOBBY,
                        message: MESSAGES.POPUP.COMMAN_TOAST_POPUP.GAME_ALREADY_START_MESSAGE,
                        buttonCounts: NUMERICAL.ONE,
                        button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                        button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                        button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                    },
                })
            }

            logger.info('roundTableData :: 5::');

        } else {
            logger.info('insertNewPlayer : rejoin table :: true ::');
        }
    } catch (error: any) {
        console.log(
            "----insertNewPlayer :: ERROR :: ",
            error,
            "userId ::",
            userData.userId
        );
        logger.error(
            "----insertNewPlayer :: ERROR :: ",
            error,
            "userId ::",
            userData.userId
        );
        let nonProdMsg = '';

        if (error instanceof Errors.CancelBattle) {
            console.log(
                "--- insertNewPlayer :: CancelBattle :: ERROR ::",
                error,
                "userId :: ",
                userData.userId
            );
            logger.error(
                "--- insertNewPlayer :: CancelBattle :: ERROR ::",
                error,
                "userId :: ",
                userData.userId
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
        } else if (error && error.type === ERROR_TYPE.INSERT_NEW_PLAYER_ERROR) {
            logger.error(
                `--- insertNewPlayer :: ERROR_TYPE :: ${ERROR_TYPE.INSERT_NEW_PLAYER_ERROR}::`,
                error,
                "userId :: ",
                userData.userId
            );
            nonProdMsg = "Database Error";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: socket.eventMetaData.tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
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
        } else if (error instanceof Errors.InvalidInput) {
            nonProdMsg = "Invalid Input";
            logger.error(
                "--- insertNewPlayer :: Invalid Input :: ERROR ::",
                error,
                "userId :: ",
                userData.userId
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

        } else if (error && error.type === MESSAGES.ALERT_MESSAGE.POPUP_TYPE) {
            logger.error("--- insertNewPlayer :: InsufficientFundError :: ERROR ::", error);
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: error.title,
                    message: error.reason,
                    buttonCounts: error.buttonCount,
                    button_text: error.button_text,
                    button_color: error.button_color,
                    button_methods: error.button_methods,
                    showLoader: error.showLoader,
                }
            });
        } else if (error instanceof Errors.InsufficientFundError) {
            logger.error(
                "--- insertNewPlayer :: InsufficientFundError :: ERROR ::",
                error,
                "userId :: ",
                userData.userId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title:
                        GRPC_ERROR_REASONS.CHECK_PLAYER_ELIGIBIBILITY_INSUFFICIENT_FUND_ERROR,
                    message: config().MSG_GRPC_INSUFFICIENT_FUNDS
                        ? config().MSG_GRPC_INSUFFICIENT_FUNDS
                        : MESSAGES.GRPC_ERRORS.MSG_GRPC_INSUFFICIENT_FUNDS,
                    buttonCounts: NUMERICAL.ONE,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                },
            });
        } else {
            logger.error(
                "--- insertNewPlayer :: commonError :: ERROR ::",
                error,
                "userId :: ",
                userData.userId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: MESSAGES.ERROR.TABLE_NOT_FOUND_ERROR_MESSAGES,
                    message: error && error.message && typeof error.message === 'string'
                        ? error.message
                        : MESSAGES.GRPC_ERRORS.COMMON_ERROR,
                    buttonCounts: NUMERICAL.ONE,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                },
            });
        }
    } finally {
        await getLock().release(tableLocks);
        logger.info("-=-=-=-=>> insertNewPlayer :: lock relese ::")
    }
}
