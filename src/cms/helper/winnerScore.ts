
import { ERROR_MESSAGES, USER_CONSTANCE, WINNER_STATUS } from "../../constants";
import logger from "../../logger";
import { formateScoreIf, multiPlayerWinnScoreIf } from "../../main/interfaces/clientApiIf";
import { HeadToHead } from "../interfaces/headToHead.interface";
import { formatedwinnerData, formatedwinnerScoreData } from "../interfaces/winner.interface";
import HeadToHeadModel from "../model/lobby_model";
import UserModel from "../model/user_model";
import { DB } from "../mongoDBServices";



import { gameRunningStatusManage } from "./gameRunningStatus";

export async function winnerScoreHandle(winnerData: multiPlayerWinnScoreIf, gameId: string) {
    try {

        logger.info("winnerScore :: winnerData :: =>> ", winnerData);
        const { playersScore, tournamentId: lobbyId } = winnerData;

        const players = playersScore.map((value: formateScoreIf) => value.userId);
        logger.info('winnerScore :: players ::==>> ', players);

        // const allPlayersScoreArray = playersScore.map((value: formatedwinnerScoreData) => value.score);
        // logger.info('winnerScore :: allPlayersScoreArray ::==>> ', allPlayersScoreArray);

        // let allPlayersTotalScore = Number(allPlayersScoreArray.reduce((a: Number, b: Number) => Number(a) + Number(b), 0));
        // logger.info('winnerScore :: allPlayersTotalScore ::==>> ', allPlayersTotalScore);

        // check players araay contains unique value or not.
        const isAllUnique = await !players.some((v: string, i: number) => players.indexOf(v) < i);
        if (!isAllUnique) {
            throw new Error(ERROR_MESSAGES.COMMON.NOT_SAME.replace(':attribute', 'players'));
        }

        // check user exists on given ids
        const getAllUsers = await DB.find(UserModel, {
            query: { _id: players, role: USER_CONSTANCE.ROLES.USER }
        });
        logger.info("winnerScore :: getAllUsers :: ==>> ", getAllUsers);


        const getHeadToHead: HeadToHead = await DB.findOne(HeadToHeadModel, { query: { _id: lobbyId } });
        logger.info("winnerScore  :: getHeadToHead :: ==>> ", getHeadToHead);
        if (!getHeadToHead) {
            throw new Error(`Can not get lobby for rummy game`);
        }

        if (players.length != getAllUsers.length) {
            throw new Error(ERROR_MESSAGES.COMMON.INVALID.replace(':attribute', 'players'));
        }

        for (let i = 0; i < playersScore.length; i++) {
            const player = playersScore[i];
            const userId = player.userId;
            if (player.winLossStatus === WINNER_STATUS.WIN_LOSS_STATUS.win || player.winLossStatus === WINNER_STATUS.WIN_LOSS_STATUS.tie) {

                let winAmount = Number(player.winningAmount);
                let updateData
                logger.info("winnerScore :: winAmount :: ==>> ", winAmount);

                if(!getHeadToHead.isCash){           
                     updateData = { $inc: { coins: winAmount } };
                     logger.info("winnerScore :: 1 :: ==>>");

                }else{
                    updateData = { $inc: { winCash: winAmount } };
                    logger.info("winnerScore :: 2 :: ==>>");
                }


                // add winning amount into users table.
                const updatedUser = await DB.findOneAndUpdate(UserModel, {
                    query: { _id: userId },
                    updateData: updateData
                });

                logger.info("winnerScore :: updatedUser :: ==>> ", updatedUser);

            }

            /* mark complete all previous running game staus of user */
            await gameRunningStatusManage(userId, gameId);

        }

        return true;

    } catch (err: any) {
        logger.error("CATCH :: winnerScore :: ERROR :: error ::>>", err);
        logger.error(
            "CATCH :: winnerScore :: ERROR :: err.message ::>> ",
            err?.message
        );
        throw false;
    }
}