import { NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { cards } from "../../../../interfaces/cards";
import { roundTableIf } from "../../../../interfaces/roundTableIf";
import { UserInfoIf } from "../../../../interfaces/scoreBoardIf";
import { getPlayerGamePlay } from "../../../cache/Players";
import checkCardSequence from "../../cards/checkCardSequence";


async function dealRummyScoreBoadPlayerInfo(
    tableId: string,
    roundTableData: roundTableIf,
): Promise<UserInfoIf[]> {
    logger.info("--------->> dealRummyScoreBoadPlayerInfo <<----------")
    try {
        logger.info("--->> dealRummyScoreBoadPlayerInfo :: tableId :: ", tableId)

        let playersInfo: UserInfoIf[] = [];

        for await (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ONE) {
                if (roundTableData.seats[seat].inGame) {
                    let resCard: cards[] = []
                    let eliminated: boolean = false;
                    const playerData = await getPlayerGamePlay(roundTableData.seats[seat].userId, tableId);
                    const state = roundTableData.seats[seat].userStatus;
                    const avatarName = roundTableData.seats[seat].avatarName;
                    logger.info("--->> dealRummyScoreBoadPlayerInfo :: playerData :: ", playerData);
                    logger.info("--->> dealRummyScoreBoadPlayerInfo :: roundTableData.seats[seat].avatarName; :: ", roundTableData.seats[seat].avatarName);
                    logger.info("--->> dealRummyScoreBoadPlayerInfo :: avatarName :: ", avatarName);
                    if (
                        roundTableData.tableState !== TABLE_STATE.LOCK_IN_PERIOD &&
                        roundTableData.tableState !== TABLE_STATE.COLLECTING_BOOT_VALUE &&
                        roundTableData.tableState !== TABLE_STATE.TOSS_CARDS
                    ) {
                        resCard = await checkCardSequence(playerData.currentCards, playerData, tableId)
                        logger.info("----->> dealRummyScoreBoadPlayerInfo :: gamePoints ::", playerData.gamePoints)
                        logger.info("----->> dealRummyScoreBoadPlayerInfo :: eliminated ::", eliminated)
                    }
                    const obj: UserInfoIf = {
                        userName: playerData.username,
                        userId: playerData.userId,
                        seatIndex: playerData.seatIndex,
                        profilePicture: playerData.profilePicture,
                        DealScore: (playerData.playingStatus === PLAYER_STATE.WIN_ROUND || state === PLAYER_STATE.PLAYING) ?
                            NUMERICAL.ZERO : (state === PLAYER_STATE.DROP_TABLE_ROUND) ?
                                playerData.dropCutPoint : (state === PLAYER_STATE.WRONG_DECLARED) ?
                                    80 : playerData.isDrop ?
                                        playerData.dropCutPoint : playerData.playingStatus === PLAYER_STATE.LEFT || state === PLAYER_STATE.LEFT || state === PLAYER_STATE.LOST ?
                                            80 : playerData.cardPoints === NUMERICAL.ZERO ?
                                                NUMERICAL.TWO : playerData.cardPoints,
                        gameScore: playerData.gamePoints,
                        Status: (state === PLAYER_STATE.PLAYING) ?
                            PLAYER_STATE.DECLARING : state === PLAYER_STATE.WIN_ROUND ?
                                PLAYER_STATE.WIN_ROUND : (state === PLAYER_STATE.DROP_TABLE_ROUND) ?
                                    PLAYER_STATE.DROP_TABLE_ROUND : playerData.isDrop ?
                                        PLAYER_STATE.DROP_TABLE_ROUND : state === PLAYER_STATE.LEFT ?
                                            PLAYER_STATE.LEFT : state === PLAYER_STATE.LOST ?
                                                PLAYER_STATE.LOST : (state === PLAYER_STATE.WRONG_DECLARED) ?
                                                    PLAYER_STATE.WRONG_DECLARED : (state === PLAYER_STATE.WIN_ROUND) ?
                                                        PLAYER_STATE.WIN_ROUND : (state === PLAYER_STATE.DECLARED) ?
                                                            PLAYER_STATE.DECLARED : "LOST",
                        dealType: playerData.dealType,
                        cards: resCard,
                        message: (state === PLAYER_STATE.PLAYING) ?
                            `declaring` : (state === PLAYER_STATE.DROP_TABLE_ROUND) ?
                                `DROP` : state === PLAYER_STATE.LEFT ?
                                    "LEFT" : state === PLAYER_STATE.LOST ?
                                        `LOST` : (state === PLAYER_STATE.WRONG_DECLARED) ?
                                            `WRONG_SHOW` : (state === PLAYER_STATE.WIN_ROUND) ?
                                                `WIN` : (state === PLAYER_STATE.DECLARED) ?
                                                    `LOST` : "LOST",
                        socketId: playerData.socketId,
                        tableId: playerData.roundTableId,
                        avatarName:avatarName,
                        isDeclared: state === PLAYER_STATE.PLAYING ? false : true,
                    };

                    playersInfo.push(obj)
                }
            }
        }
        logger.info("--->> dealRummyScoreBoadPlayerInfo :: playersInfo :: ", playersInfo);
        return playersInfo;
    } catch (error) {
        logger.error("--dealRummyScoreBoadPlayerInfo :: ERROR :: ", error);
        throw error;
    }
}

export = dealRummyScoreBoadPlayerInfo;