import logger from "../../../../logger";
import { getLock } from "../../../lock";
import { throwErrorIF } from '../../../interfaces/throwError';
import { getTableData } from '../../cache/Tables'; import {
    BOT,
    ERROR_TYPE,
    MESSAGES,
    NUMERICAL
} from '../../../../constants';
import { roundTableIf } from "../../../interfaces/roundTableIf";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import pickupCardFromCloseDeck from "../../play/cards/pickupCardFromCloseDeck";
import pickupCardFromOpenDeck from "../../play/cards/pickupCardFromOpenDeck";
import botcardPickTurnTimerQueue from "../../../scheduler/queues/BOT/botCardPickTurnTimer.queue";
import { getRandomNumber } from "../../../common/getRandomNumber";
import { cardAutoSorting } from "../helper/botCardsManage";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../cache/Players";
import { playerPlayingDataIf } from "../../../interfaces/playerPlayingTableIf";
import groupCardHandler from "../../../requestHandler/requestHelper/groupCard";
import botFinishCardTimerQueue from "../../../scheduler/queues/BOT/botFinishCardTimer.queue";
import { botWinCardsManage } from "../helper/botWinCardsManage";
import { botCardIf } from "../../../interfaces/botIf";

export async function pickCardForBot(tableId: string, currentTurnPlayerId: string) {
    logger.info('call pickCardforBot ::: ----->>> tableId :: ', tableId, " currentTurnPlayerId :: >> ", currentTurnPlayerId);
    let pickCardRobotLock = await getLock().acquire([`${tableId}`], 2000);
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

        const roundTableData: roundTableIf = await getRoundTableData(tableId, tableGamePlay.currentRound);
        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.LEAVE_TABLE_ERROR,
                message: MESSAGES.ERROR.TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        const data = {
            userId: currentTurnPlayerId,
            tableId,
            currentRound: tableGamePlay.currentRound
        }

        const socket = {
            id: BOT.ID,
            userId: currentTurnPlayerId,
            tableId,
            eventMetaData: {
                userId: currentTurnPlayerId,
                tableId,
            },
            connected: true,
        }

        if (pickCardRobotLock) {
            await getLock().release(pickCardRobotLock);
            pickCardRobotLock = null;
        }

        let randomPick = getRandomNumber(NUMERICAL.ONE,NUMERICAL.TEN)
        logger.info(' pickCardForBot :: randomPick ---->> ', randomPick);

        // let isPickCardFromCloseDeck: boolean = await getRandomZeroOrOne() == 1;
        let isPickCardFromCloseDeck: boolean = false
        if(randomPick % 2 == 0){
           isPickCardFromCloseDeck = true;
        };
        logger.info(' pickCardForBot :: isPickCardFromCloseDeck ---->> ', isPickCardFromCloseDeck);
        logger.info(' pickCardForBot :: roundTableData.isBotWin ---->> ', roundTableData.isBotWin);
        logger.info(' pickCardForBot :: roundTableData.opendDeck ---->> ', roundTableData.opendDeck);
        logger.info(' pickCardForBot :: roundTableData.opendDeck[roundTableData.opendDeck.length - 1].split("_")[2] ---->> ', roundTableData.opendDeck[roundTableData.opendDeck.length - 1].split("_")[2]);



        const playerData = await getPlayerGamePlay(currentTurnPlayerId, tableId) as playerPlayingDataIf;
        if (playerData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.PICK_UP_FROM_OPEN_DECK_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info('pickCardForBot ::  playerData.currentCards ---->> ', playerData.currentCards);

        let isValidCards: boolean = false;
        if (roundTableData.isBotWin) {
            const { currentCards, closeDeck, isValidCardsCount }: botCardIf = await botWinCardsManage(playerData.currentCards, roundTableData.closedDeck) as botCardIf;
            logger.info('pickCardForBot ::  isValidCardsCount ---->> ', isValidCardsCount);

            isValidCards = isValidCardsCount;
            roundTableData.closedDeck = closeDeck;
            playerData.currentCards = currentCards;

            await Promise.all([
                setPlayerGamePlay(currentTurnPlayerId, tableId, playerData),
                setRoundTableData(tableId, tableGamePlay.currentRound, roundTableData)
            ]);
        }


        /* card pick */
        const PGPData = await getPlayerGamePlay(currentTurnPlayerId, tableId) as playerPlayingDataIf;
        if (PGPData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.PICK_UP_FROM_OPEN_DECK_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info(' pickCardForBot ::  PGPData ---->> ', PGPData);


        if (roundTableData.opendDeck[roundTableData.opendDeck.length - 1].split("_")[2] == "J") {
            isPickCardFromCloseDeck = true;
        }

        if (isPickCardFromCloseDeck) {
            await pickupCardFromCloseDeck(data, socket, () => { });
        } else {
            await pickupCardFromOpenDeck(data, socket, () => { });
        }

        logger.info('pickCardForBot ::  isValidCards -->> ', isValidCards);
        let sortCard: any = {};
        if (roundTableData.isBotWin && isValidCards) {
            sortCard.dwdLen = NUMERICAL.ONE;
        } else {

            sortCard = await cardAutoSorting(PGPData.currentCards);
            logger.info(' sortCard ---->> ', sortCard);

            for (let i = 0; i < sortCard.cardObj1.length; i++) {
                const element = sortCard.cardObj1[i];
                logger.info(' element.group ---->> ', element);
                const data = {
                    currentRound: tableGamePlay.currentRound,
                    userId: currentTurnPlayerId,
                    tableId: tableId,
                    cards: element.group
                }
                await groupCardHandler({ data: data }, socket)
            }
        }

        let timer = await getRandomNumber(NUMERICAL.FIVE, NUMERICAL.TEN);

        logger.info('timer :------>> ', timer);
        logger.info('sortCard.dwdLen :------>> ', sortCard.dwdLen);

        if (sortCard.dwdLen === NUMERICAL.ONE) {

            await botFinishCardTimerQueue({
                tableId,
                timer: timer * NUMERICAL.THOUSAND,
                currentTurn: currentTurnPlayerId,
            })

        } else {

            await botcardPickTurnTimerQueue({
                tableId,
                timer: timer * NUMERICAL.THOUSAND,
                currentTurn: currentTurnPlayerId,
            })
        }


        return true;

    } catch (error) {
        logger.error('CATCH_ERROR :: pickCardforBot :: --->>', tableId, error);
    } finally {
        if (pickCardRobotLock) {
            await getLock().release(pickCardRobotLock);
        }
    }
}
