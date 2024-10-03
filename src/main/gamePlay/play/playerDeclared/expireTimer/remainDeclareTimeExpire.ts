import { BOT, ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, PLAYER_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { RemainPlayersdeclarTimerQueueIf } from "../../../../interfaces/schedulerIf";
import { getPlayerGamePlay } from "../../../cache/Players";
import { getRoundTableData } from "../../../cache/Rounds";
import { autoDeclareRemainPlayers } from "..";
import Errors from "../../../../errors";
import commonEventEmitter from "../../../../commonEventEmitter";
import config from "../../../../../connections/config";
import { roundTableIf } from "../../../../interfaces/roundTableIf";
import { throwErrorIF } from "../../../../interfaces/throwError";
import { cardAutoSortingForDeclare } from "../../../playBot/helper/botCardsManage";
import groupCardHandler from "../../../../requestHandler/requestHelper/groupCard";

async function remainDeclareTimeExpire(
    data: RemainPlayersdeclarTimerQueueIf
): Promise<void> {
    logger.info("------->> remainDeclareTimeExpire <<--------")
    try {
        const { tableId, currentRound, otherPlayerDeclares } = data;

        const roundTableData: roundTableIf = await getRoundTableData(tableId, currentRound);
        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.LEAVE_TABLE_ERROR,
                message: MESSAGES.ERROR.TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        //for bot palyer
        logger.info("--------->> remainDeclareTimeExpire :: BOT")

        for await (const key of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[key]).length > 0) {
                if (roundTableData.seats[key].isBot && roundTableData.seats[key].userStatus != PLAYER_STATE.LEFT 
                      && roundTableData.seats[key].playingStatus != PLAYER_STATE.DECLARED) {

                    const playerData = await getPlayerGamePlay(roundTableData.seats[key].userId, tableId);
                    logger.info(`----->> remainDeclareTimeExpire :: playerData ::`, playerData);
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
                        userId: roundTableData.seats[key].userId,
                        tableId,
                        eventMetaData: {
                            userId: roundTableData.seats[key].userId,
                            tableId,
                        },
                        connected: true,
                    }


                    const sortCard = await cardAutoSortingForDeclare(playerData.currentCards); // change by keval
                    logger.info(' remainDeclareTimeExpire :: sortCard ---->> ', sortCard);

                    /* group Card */
                    for (let i = 0; i < sortCard.cardObj1.length; i++) {
                        const element = sortCard.cardObj1[i];
                        logger.info(' element.group ---->> ', element);
                        const data = {
                            currentRound: currentRound,
                            userId: playerData.userId,
                            tableId: tableId,
                            cards: element.group
                        }
                        await groupCardHandler({ data: data }, socket)
                    }

                }
            }
        }

        for await (const player of otherPlayerDeclares) {
            const roundTableData = await getRoundTableData(tableId, currentRound);
            if (roundTableData.seats[`s${player.seatIndex}`].userStatus === PLAYER_STATE.PLAYING) {
                const userId = roundTableData.seats[`s${player.seatIndex}`].userId;
                await autoDeclareRemainPlayers(userId, tableId, currentRound);
            }
        }

    } catch (error: any) {
        logger.error("---remainDeclareTimeExpire :: ERROR :: " + error);
        let nonProdMsg = '';

        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- remainDeclareTimeExpire :: CancelBattle :: ERROR ::",
                error,
                "tableId :: ",
                data.tableId
            );
            nonProdMsg = "CancelBattle";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: data.tableId,
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
        } else {
            logger.error(
                "--- remainDeclareTimeExpire :: CancelBattle :: ERROR ::",
                error,
                "tableId :: ",
                data.tableId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: data.tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.AUTO_DECLARE_REMAIN_PLAYERS_TIMER_EXPIRE_ERROR,
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
    }
}

export = remainDeclareTimeExpire;