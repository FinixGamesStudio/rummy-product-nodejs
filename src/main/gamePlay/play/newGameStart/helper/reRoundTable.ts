import { checkBalanceHandle } from "../../../../../cms/helper/checkBalance";
import { privateTableKey } from "../../../../../cms/interfaces/privateTableKey.interface";
import privateTableKeyModel from "../../../../../cms/model/privateTableKey.model";
import UserModel from "../../../../../cms/model/user_model";
import { DB } from "../../../../../cms/mongoDBServices";
import {
  EVENTS,
  GRPC_ERROR_REASONS,
  MESSAGES,
  NUMERICAL,
  PLAYER_STATE,
  REDIS,
  RUMMY_TYPES,
  TABLE_STATE,
} from "../../../../../constants";
import logger from "../../../../../logger";
import { checkBalance } from "../../../../clientsideapi";
import commonEventEmitter from "../../../../commonEventEmitter";
import { roundTableIf, userSeatsIf } from "../../../../interfaces/roundTableIf";
import {
  getPlayerGamePlay,
  removePlayerGameData,
} from "../../../cache/Players";
import {
  getRoundTableData,
  removeRoundTableData,
  setRoundTableData,
} from "../../../cache/Rounds";
import { removeRejoinTableHistory } from "../../../cache/TableHistory";
import { getTableData } from "../../../cache/Tables";
import { getUser, setUser } from "../../../cache/User";
import {
  decrCounterLobbyWise,
  getOnliPlayerCountLobbyWise,
  removeOnliPlayerCountLobbyWise,
} from "../../../cache/onlinePlayer";
import defaultRoundTableData from "../../../defaultGenerator/defaultRoundTableData";
import { removeReffCode } from "../../../utils/reffCodeData";
import { leaveRoundTable } from "../../leaveTable/leaveRoundTable";

export async function reRoundTable(
  oldTableId: string,
  newTableId: string,
  dealType: number,
  maximumSeat: number,
  oldTableTotalRounds: number,
  gameId: string,
  lobbyId: string,
  currentRound: number,
  connectedSocketIds: string[],
  minPlayerForPlay: number
): Promise<{
  newRoundTableData: roundTableIf;
  isNewGame: boolean;
}> {
  try {
    let seats = {} as userSeatsIf;
    let allSeats = {} as userSeatsIf;
    logger.info(`------------------>> reRoundTable <<------------------`);
    const oldRoundTableData = await getRoundTableData(oldTableId, currentRound);

    logger.info(
      `------>> reRoundTable :: oldRoundTableData :: `,
      oldRoundTableData
    );

    let newRoundTableData = await defaultRoundTableData({
      tableId: newTableId,
      dealType: dealType,
      totalPlayers: maximumSeat,
      rummyType: oldRoundTableData.rummyType,
    });

    // filter seats
    for await (const seat of Object.keys(oldRoundTableData.seats)) {
      if (Object.keys(oldRoundTableData.seats[seat]).length > NUMERICAL.ZERO) {
        if (
          oldRoundTableData.seats[seat].userStatus !== PLAYER_STATE.LEFT &&
          oldRoundTableData.seats[seat].userStatus !== PLAYER_STATE.LOST
        ) {
          const playerData = await getPlayerGamePlay(
            oldRoundTableData.seats[seat].userId,
            oldTableId
          );
          logger.info(`------>> reRoundTable :: playerData :: `, playerData);
          if (
            playerData &&
            !playerData.isDisconneted &&
            connectedSocketIds.includes(playerData.socketId)|| oldRoundTableData.seats[seat].isBot
          ) {
            const userData = await getUser(playerData.userId);
            logger.info(`------>> reRoundTable :: userData :: `, userData);

            const findUser = await DB.findOne(UserModel, {
              query: { _id: playerData.userId },
            });
            logger.info(`------>> reRoundTable :: findUser :: `, findUser);
            if (findUser) {
              userData.cash = findUser.cash;
              userData.coins = findUser.coins;
              userData.winCash = findUser.winCash;
              userData.bonus = findUser.bonus;
              logger.info(`------>> reRoundTable :: userData :: 1 `, userData);
            }
            await setUser(playerData.userId, userData);
            logger.info(
              `------>> reRoundTable :: setUser ::  userData :: 2 `,
              userData
            );

            /* check user balance */
            const isSufficiantBalance = await checkBalanceHandle(
              userData.lobbyId,
              userData.userId
            );
            logger.info(
              userData.userId,
              " reRoundTable :: >> isSufficiantBalance  :: >> ",
              isSufficiantBalance
            );
            if (!isSufficiantBalance) {
              console.log(
                " reRoundTable :: >> isInsufficiantBalance ::",
                isSufficiantBalance
              );

              commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket: playerData.socketId,
                data: {
                  isPopup: true,
                  popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                  title: MESSAGES.GRPC_ERRORS.MSG_GRPC_INSUFFICIENT_FUNDS,
                  buttonCounts: NUMERICAL.ONE,
                  button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                  button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                  button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                },
              });
            }

            // // check balance for play new game
            // let checkBalanceDetail = await checkBalance({ tournamentId: userData.lobbyId }, userData.authToken, userData.socketId, userData.userId);
            // logger.info(userData.userId, "checkBalanceDetail  :: >> ", checkBalanceDetail);
            // if (checkBalanceDetail && checkBalanceDetail.userBalance.isInsufficiantBalance) {
            //     console.log("isInsufficiantBalance ::", checkBalanceDetail.userBalance.isInsufficiantBalance);

            // commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
            //     socket: playerData.socketId,
            //     data: {
            //         isPopup: true,
            //         popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
            //         title: MESSAGES.GRPC_ERRORS.MSG_GRPC_INSUFFICIENT_FUNDS,
            //         buttonCounts: NUMERICAL.ONE,
            //         button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
            //         button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
            //         button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
            //     },
            // });

            //     await removeRejoinTableHistory(oldRoundTableData.seats[seat].userId, gameId, lobbyId);
            //     await leaveRoundTable(false, true, playerData.userId, oldTableId, currentRound);

            //     // for decrease online player in lobby
            //     await decrCounterLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId);

            //     // for if lobby active player is zero then remove key from redis
            //     const lobbyWiseCounter = await getOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId)
            //     if (lobbyWiseCounter == NUMERICAL.ZERO) { await removeOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId) };

            // } else {
            oldRoundTableData.seats[seat].userStatus = PLAYER_STATE.PLAYING;
            seats[seat] = oldRoundTableData.seats[seat];
            // }
          } else {
            // for decrease online player in lobby
            await decrCounterLobbyWise(
              REDIS.PREFIX.ONLINE_PLAYER_LOBBY,
              lobbyId
            );

            // for if lobby active player is zero then remove key from redis
            const lobbyWiseCounter = await getOnliPlayerCountLobbyWise(
              REDIS.PREFIX.ONLINE_PLAYER_LOBBY,
              lobbyId
            );
            if (lobbyWiseCounter == NUMERICAL.ZERO) {
              await removeOnliPlayerCountLobbyWise(
                REDIS.PREFIX.ONLINE_PLAYER_LOBBY,
                lobbyId
              );
            }

            // leave event for disconnect players
            if (playerData && playerData.isDisconneted) {
              await leaveRoundTable(
                false,
                true,
                playerData.userId,
                oldTableId,
                currentRound
              );
            }
          }
          await removeRejoinTableHistory(
            oldRoundTableData.seats[seat].userId,
            gameId,
            lobbyId
          );
        }

        // remove player data
        await removePlayerGameData(
          oldRoundTableData.seats[seat].userId,
          oldTableId
        );
      }
    }

    // remove all old rounds table data
    for (let i = NUMERICAL.ONE; i <= oldTableTotalRounds; i++) {
      await removeRoundTableData(oldTableId, i);
    }

    logger.info(`------>> reRoundTable :: seats :: `, seats);
    logger.info(
      `------>> reRoundTable :: Object.keys(seats).length :: `,
      Object.keys(seats).length
    );
    if (Object.keys(seats).length > NUMERICAL.ZERO) {
      if (oldRoundTableData.rummyType === RUMMY_TYPES.POINT_RUMMY) {
        // add emety seats
        for (let i = NUMERICAL.ZERO; i < maximumSeat; i++) {
          if (!seats[`s${i}`]) {
            allSeats[`s${i}`] = {};
          } else {
            allSeats[`s${i}`] = seats[`s${i}`];
          }
        }
      }

      if (oldRoundTableData.rummyType !== RUMMY_TYPES.POINT_RUMMY) {
        let seatCount = NUMERICAL.ZERO;

        for (const seat of Object.keys(seats)) {
          if (Object.keys(seat).length > NUMERICAL.ZERO) {
            if (`s${seatCount}` === seat) {
              allSeats[`s${seatCount}`] = seats[seat];
            } else {
              seats[seat].seatIndex = seatCount;
              allSeats[`s${seatCount}`] = seats[seat];
            }
            seatCount += NUMERICAL.ONE;
          }
        }

        for (let i = 0; i < maximumSeat; i++) {
          if (!allSeats[`s${i}`]) {
            allSeats[`s${i}`] = {};
          }
        }
      }

      logger.info(`------>> reRoundTable :: allSeats :: `, allSeats);

      newRoundTableData.tableState =
        maximumSeat === minPlayerForPlay
          ? TABLE_STATE.ROUND_TIMER_STARTED
          : Object.keys(seats).length >= minPlayerForPlay
          ? TABLE_STATE.WAITING_FOR_PLAYERS
          : TABLE_STATE.WAIT_FOR_PLAYER;
      newRoundTableData.seats = allSeats;
      newRoundTableData.currentPlayer = Object.keys(seats).length;
      newRoundTableData.totalPlayers = Object.keys(seats).length;

      await setRoundTableData(newTableId, NUMERICAL.ONE, newRoundTableData);
      logger.info(
        `------>> reRoundTable :: newRoundTableData :: `,
        newRoundTableData
      );

      return {
        newRoundTableData,
        isNewGame: true,
      };
    } else {
      // remove reffrealCode in mongoDB
      const tableData = await getTableData(oldTableId);
      logger.info(`------>> reRoundTable :: tableData :: `, tableData);

      if(!tableData){
        throw new Error("No Table Data");
      }

      let isReferralCode = tableData?.isReferralCode;
      const privateTableKeyStatus = await DB.deleteOne(privateTableKeyModel, {
        query: { isReferralCode },
      });
      logger.info(
        `------>> reRoundTable :: privateTableKeyStatus :: `,
        privateTableKeyStatus
      );

      const findTable: privateTableKey = await DB.findOne(
        privateTableKeyModel,
        {
          query: { isReferralCode },
        }
      );
      logger.info("reRoundTable :: findTable :=>> ", findTable);

      // referralCode remove in Redis
      await removeReffCode(isReferralCode)

      return {
        newRoundTableData,
        isNewGame: false,
      };
    }
  } catch (error) {
    console.log("--- reRoundTable :: ERROR :: ", error);
    logger.error("--- reRoundTable :: ERROR :: ", error);
    throw error;
  }
}
