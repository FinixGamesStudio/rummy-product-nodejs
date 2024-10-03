import config from "../../../connections/config";
import { EVENTS } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";
import { getTableData } from "../../gamePlay/cache/Tables";
import { getUser } from "../../gamePlay/cache/User";
import { playingTableIf } from "../../interfaces/playingTableIf";
import { shareReferralCodeReqIf } from "../../interfaces/requestIf";

async function shareReferralCode(
  { data }: shareReferralCodeReqIf,
  socket: any,
  ack?: Function
) {
  const { SERVER_URL } = config();
  logger.info(" ------- shareReferralCode ------- ");
  try {
    logger.info("--- shareReferralCode :: data :: ", data);

    const { tableId, userId } = data;

    const userData = await getUser(userId);
    logger.info("--- shareReferralCode :: userData :: ", userData);

    const playingTable: playingTableIf = await getTableData(tableId);
    logger.info("--- shareReferralCode :: playingTable :: ", playingTable);

    const referralCode = playingTable.isReferralCode as string;
    logger.info("--- shareReferralCode :: referralCode :: ", referralCode);

    commonEventEmitter.emit(EVENTS.SHARE_REFERRAL_CODE, {
      socket: socket.id,
      userId,
      data: {
        referralCode: playingTable.isReferralCode,
        // message: `Play Point Rummy with friend on my private table.\nTo join this private table use the code below or you can join using the link\n\ncode:${playingTable.isReferralCode}\n\n OR \n\n ${config.SERVER_URL}/deeplink/${playingTable.isReferralCode}`,
        message: `Play Rummy with friends on private table.\nTo join this private table use the code below or you can join using the link\n\ncode : ${playingTable.isReferralCode}\n\n OR \n`,
        url: `${SERVER_URL}/deeplink/${playingTable.isReferralCode}`,
      },
    });
  } catch (error) {
    logger.error("<<< ::: respose :: shareReferralCode :::: >>>", error);
  }
}

export = shareReferralCode;
