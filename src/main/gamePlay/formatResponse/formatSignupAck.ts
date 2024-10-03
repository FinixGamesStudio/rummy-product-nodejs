import UserModel from "../../../cms/model/user_model";
import { DB } from "../../../cms/mongoDBServices";
import config from "../../../connections/config";
import { NUMERICAL, RUMMY_TYPES } from "../../../constants";
import logger from "../../../logger";
import { ackTableDataIF, formatSignupAckIf } from "../../interfaces/responseIf";
import { userIf } from "../../interfaces/userSignUpIf";
import { responseValidator } from "../../validator";
import { getTableData } from "../cache/Tables";


async function formatSignupAck(
    userData: userIf,
    tableInfo: ackTableDataIF[],
    reconnect: boolean
) {
    const { MAXIMUM_TABLE_CREATE_LIMIT } = config();

    const tableData = await getTableData(tableInfo[NUMERICAL.ZERO].tableId);
    logger.info(`----->> formatSignupAck :: tableData :: `, tableData);
    logger.info(`----->> formatSignupAck :: userData :: `, userData);
    let query = { _id: userData.userId }
    logger.info(`----->> formatSignupAck :: query :: `, query);

    const findUser = await DB.findOne(UserModel, { query: { _id: userData.userId } });
    logger.info("--------->> userSignUp :: formatSignupAck <<----------  findUser :: ==>> ", findUser);

    let dealType: number = NUMERICAL.ZERO;
    let gamePoolType: number = NUMERICAL.ZERO;

    if (tableData.rummyType === RUMMY_TYPES.POOL_RUMMY) {
        gamePoolType = tableData.gamePoolType;
    } else if (tableData.rummyType === RUMMY_TYPES.DEALS_RUMMY) {
        dealType = tableData.dealType;
    }

    try {
        let resObj: formatSignupAckIf = {
            signupResponse: {
                _id: userData.userId,
                un: userData.username,
                pp: userData.profilePicture,
                socketid: userData.socketId,
                lobbyId: userData.lobbyId,
                isFTUE: userData.isFTUE,
                isPlay: false,
                fromBack: userData.fromBack,
                gameId: userData.gameId,
                dealType: dealType,
                gamePoolType: gamePoolType,
                tableId: tableData._id,
                maximumSeat: userData.maximumSeat,
                // chips: userData.balance,
                entryFee: userData.bootAmount,
                isRobot: false,
                latitude: userData.location.latitude,
                longitude: userData.location.longitude,
                authToken: userData.authToken,
                rummyType: tableData.rummyType,
                maxTableCreateLimit: MAXIMUM_TABLE_CREATE_LIMIT,
                isCreateRoom : tableData.isCreateRoom,
                isReferralCode : tableData.isReferralCode,
                isPrivateTableContinue : userData.isPrivateTableContinue,
                gameEntryFee:userData.gameEntryFee,
                isLink : userData.isLink,
                isCash:userData.isCash,
                coins: userData.coins,
                winCash : userData.winCash,
                cash : userData.cash,
                bonus : userData.bonus,
                avatarName: findUser.avatarName
            },
            gameTableInfoData: tableInfo,
            reconnect: reconnect
        }
        resObj = await responseValidator.formatSignupAckValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("--- formatSignupAck :: ERROR :: ", error);
        throw error;
    }
}

export = formatSignupAck;