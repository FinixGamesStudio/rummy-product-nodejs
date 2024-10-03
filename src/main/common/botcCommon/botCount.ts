import { BOT_CONSTANT } from "../../../constants";
import logger from "../../../logger";
import { getRoundTableData } from "../../gamePlay/cache/Rounds";

export async function botCount(tableId: string, currentRound: number) {
  let BotCount = 0;
  const roundTableData = await getRoundTableData(tableId, currentRound);
  logger.info("----->> botCount :: roundTableData :: ", roundTableData);

  for (const seatKey in roundTableData.seats) {
    const seat = roundTableData.seats[seatKey];
    if (seat && seat.isBot === true) {
      BotCount++;
    }
  }
  logger.info("----->> botCount :: BotCount :: ", BotCount);
  return BotCount

}

export async function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function getRandomBotType() {
  let botType = [BOT_CONSTANT.BOT_TYPES.MEDIUM, BOT_CONSTANT.BOT_TYPES.EXCELLENT];
  return botType[Math.floor(Math.random() * botType.length)];
}