import { USER_GAME_RUNNING_STATUS } from "../../constants";
import logger from "../../logger";
import UsersGameRunningStatusModel from "../model/runningGameStatus.model";
import { DB } from "../mongoDBServices";


export async function gameRunningStatusManage(userId: string, gameId: string) {
    try {

        const gameRunnigStatus = USER_GAME_RUNNING_STATUS.STATUS_OBJ;

        let query: any = {
            userId: userId,
            gameId: gameId,
            status: gameRunnigStatus.running
        };

        // update users game running status to completed
        const usersGameStatus = await DB.deleteMany(UsersGameRunningStatusModel, {
            query: query
        });

        return true;

    } catch (error: any) {
        logger.error("CATCH :: gameRunningStatusManage :: ERROR :: error ::=>>", error);
        logger.error(
            "CATCH :: gameRunningStatusManage :: ERROR :: error.message ::=>> ",
            error?.message
        );
        return false;
    }
}