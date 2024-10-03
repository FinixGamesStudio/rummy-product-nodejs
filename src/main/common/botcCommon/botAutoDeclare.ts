import {
  BOT,
  ERROR_TYPE,
  MESSAGES,
  NUMERICAL,
  PLAYER_STATE,
} from "../../../constants";
import logger from "../../../logger";
import { getPlayerGamePlay } from "../../gamePlay/cache/Players";
import { getRoundTableData } from "../../gamePlay/cache/Rounds";
import autoDeclareRemainPlayers from "../../gamePlay/play/playerDeclared/autoDeclareRemainPlayers";
import { cardAutoSorting, cardAutoSortingForDeclare } from "../../gamePlay/playBot/helper/botCardsManage";
import { botAutoDeclareIf } from "../../interfaces/botIf";
import { roundTableIf } from "../../interfaces/roundTableIf";
import { throwErrorIF } from "../../interfaces/throwError";
import groupCardHandler from "../../requestHandler/requestHelper/groupCard";
import botAutoDeclareCancel from "../../scheduler/cancelJob/BOT/botAutoDeclare.cancel";
import { botCount, getRandomNumber } from "./botCount";

export async function botAutoDeclare(data: botAutoDeclareIf) {
  logger.info("============>> :: botAutoDeclare :: <<=============");
  try {
    const { tableId, currentRound } = data;
    logger.info("------>> botAutoDeclare :: data :: -->>", data);

    await botAutoDeclareCancel(`botAutoDeclare:${tableId}`);

    const roundTableData: roundTableIf = await getRoundTableData(
      tableId,
      currentRound
    );
    if (roundTableData === null) {
      const errorObj: throwErrorIF = {
        type: ERROR_TYPE.LEAVE_TABLE_ERROR,
        message: MESSAGES.ERROR.TABLE_NOT_FOUND_ERROR_MESSAGES,
        isCommonToastPopup: true,
      };
      throw errorObj;
    }
    // const botSeatCount = await botCount(tableId, currentRound);
    // logger.info(
    //   "------>> botAutoDeclare :: botSeatCount :: -->>",
    //   botSeatCount
    // );

    // let autoBotDeclareCount = Math.floor(botSeatCount / NUMERICAL.TWO);
    // logger.info(
    //   "------>> botAutoDeclare :: autoBotDeclareCount :: -->>",
    //   autoBotDeclareCount
    // );

    // let botDeclareCount =
    //   autoBotDeclareCount > NUMERICAL.ONE ? autoBotDeclareCount : NUMERICAL.ONE;
    // logger.info(
    //   "------>> botAutoDeclare :: botDeclareCount :: -->>",
    //   botDeclareCount
    // );

    let botDeclareList: any = [];
    for (const seatKey in roundTableData.seats) {
      const seat = roundTableData.seats[seatKey];
      if (seat && seat.isBot && seat.userStatus === PLAYER_STATE.PLAYING) {
        botDeclareList.push(seat);
      }
    }
    logger.info(
      "------>> botAutoDeclare :: botDeclareList :: -->>",
      botDeclareList
    );

    if (botDeclareList.length > NUMERICAL.ZERO) {
      // let botDeclareList1 = botDeclareList.slice(0, botDeclareCount);
      // logger.info(
      //   "------>> botAutoDeclare :: botDeclareList1 :: -->>",
      //   botDeclareList1
      // );

      // for await (const player of botDeclareList1) {
      //   logger.info("------>> botAutoDeclare :: player :: -->>", player);
      //   const playerData = await getPlayerGamePlay(player.userId, tableId);
      //   logger.info(
      //     `----->> botAutoDeclare :: playerData ::`,
      //     playerData
      //   );
      //   if (playerData === null) {
      //     const errorObj: throwErrorIF = {
      //       type: ERROR_TYPE.AUTO_DECLARE_REMAIN_TIMER_ERROR,
      //       message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
      //       isCommonToastPopup: true,
      //     };
      //     throw errorObj;
      //   }

      //   const socket = {
      //     id: BOT.ID,
      //     userId: player.userId,
      //     tableId,
      //     eventMetaData: {
      //       userId: player.userId,
      //       tableId,
      //     },
      //     connected: true,
      //   };

      //   const sortCard = await cardAutoSorting(playerData.currentCards);
      //   logger.info(" botAutoDeclare :: sortCard ---->> ", sortCard);

      //   /* group Card */
      //   for (let i = 0; i < sortCard.cardObj1.length; i++) {
      //     const element = sortCard.cardObj1[i];
      //     logger.info(" element.group ---->> ", element);
      //     const data = {
      //       currentRound: currentRound,
      //       userId: playerData.userId,
      //       tableId: tableId,
      //       cards: element.group,
      //     };
      //     await groupCardHandler({ data: data }, socket);
      //   }
      //   await autoDeclareRemainPlayers(player.userId, tableId, currentRound);
      // }

      let bot  = 0;
      let IntervalId = setInterval(async() => {
        if(bot < botDeclareList.length){
          const player = botDeclareList[bot];
          logger.info("------>> botAutoDeclare :: player :: -->>", player);
          const playerData = await getPlayerGamePlay(player.userId, tableId);
          logger.info(
            `----->> botAutoDeclare :: playerData ::`,
            playerData
          );
          if (playerData === null) {
            const errorObj: throwErrorIF = {
              type: ERROR_TYPE.AUTO_DECLARE_REMAIN_TIMER_ERROR,
              message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
              isCommonToastPopup: true,
            };
            throw errorObj;
          }
  
          const socket = {
            id: BOT.ID,
            userId: player.userId,
            tableId,
            eventMetaData: {
              userId: player.userId,
              tableId,
            },
            connected: true,
          };
  
          const sortCard = await cardAutoSortingForDeclare(playerData.currentCards); // change by keval
          logger.info(" botAutoDeclare :: sortCard ---->> ", sortCard);
  
          /* group Card */
          for (let i = 0; i < sortCard.cardObj1.length; i++) {
            const element = sortCard.cardObj1[i];
            logger.info(" element.group ---->> ", element);
            const data = {
              currentRound: currentRound,
              userId: playerData.userId,
              tableId: tableId,
              cards: element.group,
            };
            await groupCardHandler({ data: data }, socket);
          }
          await autoDeclareRemainPlayers(player.userId, tableId, currentRound);
        }else{
          logger.info("------->> botAutoDeclare :: IntervalCancel :: <<--------------");
          clearInterval(IntervalId);
        }
        bot++
      },500)
    }
  } catch (error) {
    logger.info(`--- botAutoDeclare :: ERROR :: `, error);
    throw error;
  }
}
