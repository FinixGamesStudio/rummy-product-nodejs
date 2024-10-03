import { ERROR_TYPE, MESSAGES, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../constants";
import logger from "../../../../logger";
import { playerPlayingDataIf } from "../../../interfaces/playerPlayingTableIf";
import { setupRoundIf } from "../../../interfaces/startRoundIf";
import { throwErrorIF } from "../../../interfaces/throwError";
import { userIf } from "../../../interfaces/userSignUpIf";
import { getLock } from "../../../lock";
import { setPlayerGamePlay } from "../../cache/Players";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import { getTableData, setTableData } from "../../cache/Tables";
import { defaultPlayerGamePlayData, defaultTableData } from "../../defaultGenerator";
import defaultRoundTableData from "../../defaultGenerator/defaultRoundTableData";
import { getQueue } from "../../utils/manageQueue";

//find Table
export const findAvaiableTable = async (queueKey: string, oldTableId: string[]): Promise<string | null> => {
    const tableId: string | null = await getQueue(queueKey, oldTableId);
    return tableId;
};

// for creating new table
export const createTable = async (data: userIf): Promise<string> => {
    try {
        const tableData = defaultTableData(data);
        return setTableData(tableData);
    } catch (error) {
        logger.error('CATCH_ERROR : createTable :: insertPlayerInTable ::', data, error);
        throw error;
    }
};

export const setupRound = async ({ tableId, roundNo, totalPlayers, dealType, rummyType }: setupRoundIf): Promise<void> => {
    // create round one table
    try {
        const roundOneTableData = await defaultRoundTableData({
            tableId,
            totalPlayers,
            dealType,
            rummyType
        });

        await setRoundTableData(tableId, roundNo, roundOneTableData);
    } catch (error) {
        logger.error("---insertNewPlayer :: setupRound :: ERROR ::", error);
        throw error;
    }
};

// for creating and inserting playergameplay data
export const insertPlayerGamePlayData = async (
    userData: userIf,
    roundTableId: string,
    seatIndex: number,
): Promise<void> => {
    try {

        const playerGamePlayData: playerPlayingDataIf =
            defaultPlayerGamePlayData({
                roundTableId,
                seatIndex,
                ...userData,
            });

        await setPlayerGamePlay(
            userData.userId,
            playerGamePlayData.roundTableId,
            playerGamePlayData,
        );

    } catch (error) {
        logger.error("---insertNewPlayer :: insertPlayerGamePlayData :: ERROR ::", error);
        throw error;
    }
};

export const insertPlayerInTable = async (userData: userIf, tableId: string | null, queueKey: string, previoustableId: string[]): Promise<number> => {
    logger.info("---------->> insertPlayerInTable <<-------------");
    const TableLock = await getLock().acquire([`locks:${tableId}`], 2000);
    try {

        let tableConfig = await getTableData(tableId as string);

        if (!tableConfig) {

            tableId = await findAvaiableTable(queueKey, previoustableId)
            logger.info('---->> insertNewPlayer ::: before tableId ::: ', tableId);

            if (!tableId) {
                tableId = await createTable(userData);

                await setupRound({
                    tableId,
                    roundNo: NUMERICAL.ONE,
                    totalPlayers: userData.maximumSeat,
                    dealType: userData.dealType,
                    rummyType: userData.rummyType
                });
                tableConfig = await getTableData(tableId);
            }
        }

        tableId = tableId as string;

        let RoundTableData = await getRoundTableData(tableId, tableConfig.currentRound);
        logger.info(`insertPlayerInTable :: tableConfig :: `, tableConfig);

        if (tableConfig === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.INSERT_NEW_PLAYER_ERROR,
                message: MESSAGES.ERROR.TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        logger.info(`insertPlayerInTable :: RoundTableData :: `, RoundTableData);
        if (RoundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.INSERT_NEW_PLAYER_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        let seatIndex: number = -1;

        if (RoundTableData != null) {

            for (let i = 0; i < RoundTableData.maxPlayers; i++) {

                const key = `s${i}`;
                const seat = RoundTableData.seats[`s${i}`];

                logger.info(
                    'add user Data in table : userData :: ',
                    userData,
                    'Object.keys(seat).length : userData :: ',
                    Object.keys(seat).length,
                );

                if (Object.keys(seat).length === NUMERICAL.ZERO) {
                    // inserting player in seat
                    RoundTableData.seats[key]._id = userData._id;
                    RoundTableData.seats[key].userId = userData.userId;
                    RoundTableData.seats[key].username = userData.username;
                    RoundTableData.seats[key].profilePicture = userData.profilePicture;
                    RoundTableData.seats[key].coins = userData.coins;
                    RoundTableData.seats[key].avatarName = userData.avatarName;
                    RoundTableData.seats[key].seatIndex = i;
                    RoundTableData.seats[key].userStatus = RoundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER || RoundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS || RoundTableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED ?
                        PLAYER_STATE.PLAYING : PLAYER_STATE.WATCHING;
                    RoundTableData.seats[key].inGame = true;
                    RoundTableData.seats[key].isBot = userData.isBot;
                    RoundTableData.seats[key].authToken = userData.authToken;

                    RoundTableData.totalPlayers += RoundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER || RoundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS || RoundTableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED ?
                        NUMERICAL.ONE : NUMERICAL.ZERO;
                        RoundTableData.currentPlayer += RoundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER || RoundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS || RoundTableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED ?
                        NUMERICAL.ONE : NUMERICAL.ZERO;

                    seatIndex = i;

                    break;

                } else {

                    if (RoundTableData.seats[key].userId === userData.userId) {
                        seatIndex = i;
                        break;
                    }

                }
            }
        }
        if (seatIndex != -1) {

            logger.info('add user Data in table : RoundTableData :: ', RoundTableData);

            let totalPlayersCount: number = NUMERICAL.ZERO;

            for await (const seat of Object.keys(RoundTableData.seats)) {
                if (Object.keys(RoundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                    totalPlayersCount += NUMERICAL.ONE;
                }
            }

            if (NUMERICAL.TWO <= totalPlayersCount) {

                if (
                    RoundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS ||
                    RoundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER ||
                    RoundTableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED
                ) {
                    RoundTableData.tableState = TABLE_STATE.ROUND_TIMER_STARTED === RoundTableData.tableState ? TABLE_STATE.ROUND_TIMER_STARTED : TABLE_STATE.WAITING_FOR_PLAYERS;
                }

            }

            await setRoundTableData(tableId, NUMERICAL.ONE, RoundTableData);

            await insertPlayerGamePlayData(
                {
                    ...userData,
                    dealType: tableConfig.dealType,
                    gamePoolType: tableConfig.gamePoolType,
                    rummyType: tableConfig.rummyType,
                },
                tableId,
                seatIndex
            );
        }

        return seatIndex;

    } catch (error) {
        logger.error(
            'CATCH_ERROR : insertPlayerInTable :: ',
            error,
            "userId ::",
            userData.userId
        );
        throw error;
    } finally {
        await getLock().release(TableLock);
    }
};