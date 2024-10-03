import { roundTableIf } from "../../interfaces/roundTableIf";
import Joi from "joi";
import Errors from "../../errors";
import { playarDetail } from "../../interfaces/responseIf";
import logger from "../../../logger";
import { responseValidator } from "../../validator";

// Formant Join Table Event Document
async function formatJoinTableInfo(
    seatIndex: number,
    roundTableData: roundTableIf,
):Promise<playarDetail> {
    try {
        let data: playarDetail = {
            _id: roundTableData.seats[`s${seatIndex}`]._id,
            userId: roundTableData.seats[`s${seatIndex}`].userId,
            username: roundTableData.seats[`s${seatIndex}`].username,
            profilePicture: roundTableData.seats[`s${seatIndex}`].profilePicture,
            seatIndex,
            userStatus: roundTableData.seats[`s${seatIndex}`].userStatus,
            coins: roundTableData.seats[`s${seatIndex}`].coins,
            avatarName:roundTableData.seats[`s${seatIndex}`].avatarName
        };
        data = await responseValidator.formatJoinTableInfoValidator(data);
        logger.info("----->> formatJoinTableInfo :: data :: ", data)
        logger.info("----->> formatJoinTableInfo :: roundTableData :: ", roundTableData)

        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatJoinTableInfo :: ',
            seatIndex,
            roundTableData,
            error,
        );
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatJoinTableInfo;