import { gameRunningStatusManage } from "../../../../../cms/helper/gameRunningStatus";
import { playedGames } from "../../../../../cms/interfaces/playedGames";
import { User } from "../../../../../cms/interfaces/user_interfaces";
import playedGamesModel from "../../../../../cms/model/playedGamesSchema";
import UserModel from "../../../../../cms/model/user_model";
import { DB } from "../../../../../cms/mongoDBServices";
import {
  EVENTS,
  MESSAGES,
  NUMERICAL,
  PLAYER_STATE,
  REDIS,
  RUMMY_TYPES,
  TABLE_STATE,
} from "../../../../../constants";
import logger from "../../../../../logger";
import { markCompletedGameStatus } from "../../../../clientsideapi";
import commonEventEmitter from "../../../../commonEventEmitter";
import { playerPlayingDataIf } from "../../../../interfaces/playerPlayingTableIf";
import { playingTableIf } from "../../../../interfaces/playingTableIf";
import { roundTableIf } from "../../../../interfaces/roundTableIf";
import { userIf } from "../../../../interfaces/userSignUpIf";
import { getLock } from "../../../../lock";
import {
  removePlayerGameData,
  setPlayerGamePlay,
} from "../../../cache/Players";
import { setRoundTableData } from "../../../cache/Rounds";
import { removeRejoinTableHistory } from "../../../cache/TableHistory";
import { setUser } from "../../../cache/User";
import {
  decrCounterLobbyWise,
  getOnliPlayerCountLobbyWise,
  removeOnliPlayerCountLobbyWise,
} from "../../../cache/onlinePlayer";
import formatLeaveTableInfo from "../../../formatResponse/formatLeaveTableInfo";
import countUserCards from "../../../utils/countUserCards";
import { setQueue } from "../../../utils/manageQueue";
import { setOldTableIdsHistory } from "../../../utils/setOldTableIdsHistory";
import { cardNotDiscardCard } from "../../turn/helper/nextTurnHelper";
import checkRoundWiner from "../../winner/checkRoundWiner";

export async function pointRummyLeaveRoundTable(
  roundTableData: roundTableIf,
  playerData: playerPlayingDataIf,
  playingTable: playingTableIf,
  userData: userIf,
  flag: boolean,
  playerLeave: boolean,
  leaveFlage: boolean
) {
  const {
    currentRound,
    gameType,
    lobbyId,
    gameId,
    _id: tableId,
  } = playingTable;
  let leaveTableLocks = await getLock().acquire([`locks:${tableId}`], 2000);
  try {
    const { userId } = playerData;

    if (
      roundTableData.seats[`s${playerData.seatIndex}`].userStatus !==
        PLAYER_STATE.LEFT &&
      roundTableData.seats[`s${playerData.seatIndex}`].userStatus !==
        PLAYER_STATE.LOST &&
      (roundTableData.currentPlayer > NUMERICAL.ONE ||
        leaveFlage ||
        roundTableData.tableState === TABLE_STATE.DISPLAY_SCOREBOARD) &&
      ((roundTableData.tableState === TABLE_STATE.DISPLAY_SCOREBOARD &&
        roundTableData.isGameOver) ||
        (roundTableData.tableState !== TABLE_STATE.DISPLAY_SCOREBOARD &&
          roundTableData.totalPlayers > NUMERICAL.ONE) ||
        leaveFlage)
    ) {
      if (
        playerLeave &&
        flag &&
        playerData.playingStatus !== PLAYER_STATE.WATCHING
      ) {
        // for decrease online player in lobby
        await decrCounterLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId);

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

        const totalUserCards = await countUserCards(playerData.currentCards);

        logger.info(
          "----->> pointRummyLeaveRoundTable :: totalUserCards ::",
          totalUserCards
        );
        logger.info(
          "----->> pointRummyLeaveRoundTable :: roundTableData :: --------->",
          roundTableData
        );

        if (totalUserCards === NUMERICAL.FOURTEEN) {
          logger.info(
            "----->> pointRummyLeaveRoundTable :: cardNotDiscardCard ::"
          );
          const { roundTableInfo, currentPlayerData } =
            await cardNotDiscardCard(playerData, roundTableData, currentRound);
          roundTableData = roundTableInfo;
          playerData = currentPlayerData;
        }

        if (
          roundTableData.seats[`s${playerData.seatIndex}`].userStatus !==
            PLAYER_STATE.DROP_TABLE_ROUND &&
          roundTableData.seats[`s${playerData.seatIndex}`].userStatus !==
            PLAYER_STATE.WRONG_DECLARED &&
          roundTableData.seats[`s${playerData.seatIndex}`].userStatus !==
            PLAYER_STATE.WIN_ROUND
        ) {
          roundTableData.currentPlayer -= NUMERICAL.ONE;
          playerData.gamePoints -= NUMERICAL.EIGHTEEN;
          playerData.roundLostPoint = NUMERICAL.EIGHTEEN;
        }

        roundTableData.seats[`s${playerData.seatIndex}`].userStatus =
          PLAYER_STATE.LEFT;
        roundTableData.totalPlayers -= NUMERICAL.ONE;

        playerData.userStatus = PLAYER_STATE.LEFT;
        playerData.playingStatus = PLAYER_STATE.LEFT;
        playerData.isLeft = true;

        await setRoundTableData(tableId, currentRound, roundTableData);
        await setPlayerGamePlay(userId, tableId, playerData);
        logger.info(
          "----->> pointRummyLeaveRoundTable :::: 1 :::: roundTableData ::",
          roundTableData
        );
        logger.info(
          "----->> pointRummyLeaveRoundTable :::: 1 :::: playerData ::",
          playerData
        );
        let winPrice =
          roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER ||
          roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS ||
          roundTableData.tableState === TABLE_STATE.ROUND_STARTED
            ? (roundTableData.maxPlayers === NUMERICAL.TWO ||
                roundTableData.totalPlayers <= NUMERICAL.TWO) &&
              currentRound === NUMERICAL.ONE
              ? NUMERICAL.TWO *
                playingTable.bootAmount *
                (NUMERICAL.ONE - playingTable.rake / NUMERICAL.HUNDRED)
              : playingTable.winPrice
            : playingTable.winPrice;

        winPrice = Number(winPrice.toFixed(NUMERICAL.TWO));

        let isLeaveBeforeLockIn =
          roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER ||
          roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS ||
          roundTableData.tableState === TABLE_STATE.ROUND_STARTED
            ? true
            : false;

        const formatedRes = await formatLeaveTableInfo(
          tableId,
          userId,
          playerData.seatIndex,
          currentRound,
          roundTableData.tableState,
          roundTableData.totalPlayers,
          playerData.username,
          winPrice,
          isLeaveBeforeLockIn
        );

        logger.info(
          "------->> pointRummyLeaveRoundTable :: formatLeaveTableInfo ::",
          formatedRes
        );

        commonEventEmitter.emit(EVENTS.LEAVE_TABLE, {
          tableId,
          socket: playerData.socketId,
          data: formatedRes,
        });

        commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
          tableId,
          data: {
            isPopup: true,
            popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOP_MIDDLE_TOAST_POPUP,
            title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
            message: `${playerData.username} Left The Game`,
          },
        });
        // leave player loss count add

        const findUser: User = await DB.findOne(UserModel, {
          query: { _id: userId },
        });
        logger.info(
          " ------>> ------>> pointRummyLeaveRoundTable  :: findUser ::>> ",
          findUser
        );
        if (!findUser) {
          throw new Error(`Can not found user for rummy game`);
        }
        if (roundTableData.tableState != TABLE_STATE.DISPLAY_SCOREBOARD) {
          // update userName into user table
          const updatedUser: playedGames = await DB.findOneAndUpdate(
            playedGamesModel,
            {
              query: { userId: userId },
              updateData: { $inc: { "status.loss": 1 } },
            }
          );
          logger.info(
            " pointRummyLeaveRoundTable :: updatedUser :: ==>> ",
            updatedUser
          );
        }

        // await markCompletedGameStatus({
        //     tableId,
        //     gameId: gameId,
        //     tournamentId: lobbyId
        // },
        //     userData.authToken,
        //     playerData.socketId
        // )

        /* mark complete all previous running game staus of user */
        await gameRunningStatusManage(userId, gameId);

        if (leaveTableLocks) {
          await getLock().release(leaveTableLocks);
          leaveTableLocks = null;
        }

        userData = await setOldTableIdsHistory(userData, tableId);
        await removeRejoinTableHistory(userId, gameId, lobbyId);
        await setUser(userId, userData);
        await checkRoundWiner(tableId, userId, currentRound);
      } else if (playerData.playingStatus === PLAYER_STATE.WATCHING) {
        for await (const key of Object.keys(roundTableData.seats)) {
          if (roundTableData.seats[key].length != NUMERICAL.ZERO) {
            if (roundTableData.seats[key].userId === userId)
              roundTableData.seats[key] = {};
          }
        }
        let queueKey: string =
          playingTable.isCreateRoom && playingTable.isReferralCode != ""
            ? `${gameType}:${playingTable.isReferralCode}`
            : `${gameType}:${gameId}:${lobbyId}`;

        logger.warn(
          "-------->> leaveRoundTable :: queueKey :: >>> >>>  ",
          queueKey
        );

        if (roundTableData.tableState !== TABLE_STATE.DISPLAY_SCOREBOARD) {
          await setQueue(`${queueKey}`, tableId);
          // await setQueue(`${gameType}:${gameId}:${lobbyId}`, tableId);
        }

        playerData.userStatus = PLAYER_STATE.LEFT;
        playerData.playingStatus = PLAYER_STATE.LEFT;

        await setPlayerGamePlay(userId, tableId, playerData);
        await setRoundTableData(tableId, currentRound, roundTableData);
        logger.info(
          "----->> pointRummyLeaveRoundTable :::: 2 :::: roundTableData ::",
          roundTableData
        );
        logger.info(
          "----->> pointRummyLeaveRoundTable :::: 2 :::: playerData ::",
          playerData
        );
        let winPrice =
          roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER ||
          roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS ||
          roundTableData.tableState === TABLE_STATE.ROUND_STARTED
            ? (roundTableData.maxPlayers === NUMERICAL.TWO ||
                roundTableData.totalPlayers <= NUMERICAL.TWO) &&
              currentRound === NUMERICAL.ONE
              ? NUMERICAL.TWO *
                playingTable.bootAmount *
                (NUMERICAL.ONE - playingTable.rake / NUMERICAL.HUNDRED)
              : playingTable.winPrice
            : playingTable.winPrice;

        winPrice = Number(winPrice.toFixed(NUMERICAL.TWO));
        let isLeaveBeforeLockIn =
          roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER ||
          roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS ||
          roundTableData.tableState === TABLE_STATE.ROUND_STARTED
            ? true
            : false;

        const formatedRes = await formatLeaveTableInfo(
          tableId,
          userId,
          playerData.seatIndex,
          currentRound,
          roundTableData.tableState,
          roundTableData.totalPlayers,
          playerData.username,
          winPrice,
          isLeaveBeforeLockIn,
          PLAYER_STATE.WATCHING_LEAVE
        );

        commonEventEmitter.emit(EVENTS.LEAVE_TABLE, {
          tableId,
          socket: playerData.socketId,
          data: formatedRes,
        });

        commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
          tableId,
          data: {
            isPopup: true,
            popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOP_MIDDLE_TOAST_POPUP,
            title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
            message: `${playerData.username} Left The Game`,
          },
        });
      }

      // set oldtableIDs in userData
      if (!userData.isCreateRoom) {
        logger.info(
          `----->> pointRummyLeaveRoundTable  :: userData.isCreateRoom 1::  ::`,
          userData.isCreateRoom
        );
        const userInfo = await setOldTableIdsHistory(userData, tableId);
        userData.oldTableId = userInfo.oldTableId;
        logger.info(
          `----->> pointRummyLeaveRoundTable  :: userInfo 1 :: ::`,
          userInfo
        );
      }
      await setUser(userData.userId, userData);
      logger.info(
        `----->> pointRummyLeaveRoundTable :: userData after 1----> :: ::`,
        userData
      );
    } else {
      logger.warn(
        "-------->> pointRummyLeaveRoundTable :: player state ::",
        roundTableData.seats[`s${playerData.seatIndex}`].userStatus
      );
      logger.warn(
        "-------->> pointRummyLeaveRoundTable :: player state already left or lost"
      );

      userData.OldLobbyId = lobbyId;
      await setUser(userData.userId, userData);
    }

    if (playerLeave && !flag) {
      // for decrease online player in lobby
      await decrCounterLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId);

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

      let winPrice =
        roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER ||
        roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS ||
        roundTableData.tableState === TABLE_STATE.ROUND_STARTED
          ? (roundTableData.maxPlayers === NUMERICAL.TWO ||
              roundTableData.totalPlayers <= NUMERICAL.TWO) &&
            currentRound === NUMERICAL.ONE
            ? NUMERICAL.TWO *
              playingTable.bootAmount *
              (NUMERICAL.ONE - playingTable.rake / 100)
            : playingTable.winPrice
          : playingTable.winPrice;

      winPrice = Number(winPrice.toFixed(NUMERICAL.TWO));

      let isLeaveBeforeLockIn =
        roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER ||
        roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS ||
        roundTableData.tableState === TABLE_STATE.ROUND_STARTED
          ? true
          : false;

      let status = roundTableData.tableState;

      let queueKey: string =
        playingTable.isCreateRoom && playingTable.isReferralCode != ""
          ? `${gameType}:${playingTable.isReferralCode}`
          : `${gameType}:${gameId}:${lobbyId}`;

      logger.warn(
        "-------->> leaveRoundTable :: queueKey :: >>> >>>  ",
        queueKey
      );

      if (playerData.playingStatus === PLAYER_STATE.WATCHING) {
        for await (const key of Object.keys(roundTableData.seats)) {
          if (roundTableData.seats[key].length != NUMERICAL.ZERO) {
            if (roundTableData.seats[key].userId === userId)
              roundTableData.seats[key] = {};
          }
        }

        if (roundTableData.tableState !== TABLE_STATE.DISPLAY_SCOREBOARD) {
          await setQueue(`${queueKey}`, tableId);
          // await setQueue(`${gameType}:${gameId}:${lobbyId}`, tableId);
        }

        playerData.userStatus = PLAYER_STATE.LEFT;
        playerData.playingStatus = PLAYER_STATE.LEFT;

        await setPlayerGamePlay(userId, tableId, playerData);
        await setRoundTableData(tableId, currentRound, roundTableData);
        logger.info(
          "----->> pointRummyLeaveRoundTable :::: 3 :::: roundTableData ::",
          roundTableData
        );
        logger.info(
          "----->> pointRummyLeaveRoundTable :::: 3 :::: playerData ::",
          playerData
        );
        status = PLAYER_STATE.WATCHING_LEAVE;
      }

      const msg: string | null =
        status === PLAYER_STATE.WATCHING_LEAVE
          ? PLAYER_STATE.WATCHING_LEAVE
          : null;

      const formatedRes = await formatLeaveTableInfo(
        tableId,
        userId,
        playerData.seatIndex,
        currentRound,
        roundTableData.tableState,
        roundTableData.totalPlayers,
        playerData.username,
        winPrice,
        isLeaveBeforeLockIn,
        msg
      );

      logger.info(
        "------->> pointRummyLeaveRoundTable :: formatLeaveTableInfo ::",
        formatedRes
      );
      commonEventEmitter.emit(EVENTS.LEAVE_TABLE, {
        tableId,
        socket: playerData.socketId,
        data: formatedRes,
      });

      commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
        tableId,
        data: {
          isPopup: true,
          popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOP_MIDDLE_TOAST_POPUP,
          title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
          message: `${playerData.username} Left The Game`,
        },
      });

      // await markCompletedGameStatus({
      //     tableId,
      //     gameId: gameId,
      //     tournamentId: lobbyId
      // },
      //     userData.authToken,
      //     playerData.socketId
      // );

      /* mark complete all previous running game staus of user */
      await gameRunningStatusManage(userId, gameId);

      // set oldtableIDs in userData
      if (!userData.isCreateRoom) {
        logger.info(
          `----->> pointRummyLeaveRoundTable :: userData.isCreateRoom 2::  ::`,
          userData.isCreateRoom
        );
        userData = await setOldTableIdsHistory(userData, tableId);
        userData.oldTableId = userData.oldTableId;
        logger.info(
          `----->> pointRummyLeaveRoundTable :: userData 2 :: ::`,
          userData
        );
      }
      await setUser(userData.userId, userData);
      logger.info(
        `----->> pointRummyLeaveRoundTable :: userData after 2----> :: ::`,
        userData
      );

      if (
        roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER ||
        roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS ||
        roundTableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED
      ) {
        await removePlayerGameData(userId, tableId);
      }

      await removeRejoinTableHistory(userId, gameId, lobbyId);
    }
  } catch (error) {
    logger.error(`---- pointRummyLeaveRoundTable :: ERROR :: `, error);
    throw error;
  } finally {
    if (leaveTableLocks) {
      await getLock().release(leaveTableLocks);
    }
  }
}
