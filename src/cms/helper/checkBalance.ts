
import logger from "../../logger";
import { HeadToHead } from "../interfaces/headToHead.interface";
import { User } from "../interfaces/user_interfaces";
import HeadToHeadModel from "../model/lobby_model";
import UserModel from "../model/user_model";
import { DB } from "../mongoDBServices";


export async function checkBalanceHandle(lobbyId: string , userId:string) {
    try {
        let isSufficiantBalance: boolean = false;

        const findUser = await DB.findOne(UserModel, { query: { _id: userId } });
         if (!findUser) {
           throw new Error(`Can not get lobbys for rummy game`);
           }
          logger.info("findUser :: ==>> ", findUser);

        const getHeadToHead: HeadToHead = await DB.findOne(HeadToHeadModel, { query: { _id: lobbyId } });
        logger.info("checkBalance  :: getHeadToHead :: ==>> ", getHeadToHead);
        if (!getHeadToHead) {
            throw new Error(`Can not get lobby for rummy game`);
        }

        if (getHeadToHead.isCash && ((findUser.cash + findUser.bonus + findUser.winCash) >= getHeadToHead.entryfee)) {
            isSufficiantBalance = true;
        }
        else {
            if (findUser.coins >= getHeadToHead.entryfee) {
                isSufficiantBalance = true;
            }
        }
        return isSufficiantBalance;
    } catch (err: any) {
        logger.error("CATCH :: checkBalance :: ERROR :: error ::>>", err);
        logger.error(
            "CATCH :: checkBalance :: ERROR :: err.message ::>> ",
            err?.message
        );
        throw err;
    }
}
