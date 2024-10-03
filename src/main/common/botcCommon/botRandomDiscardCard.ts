import { ERROR_TYPE, MESSAGES } from "../../../constants";
import logger from "../../../logger";
import { getPlayerGamePlay } from "../../gamePlay/cache/Players";
import { throwErrorIF } from "../../interfaces/throwError";

export async function botRandomDiscardCard(
 currentTurn: string,
  tableId: string
) {
  logger.info("================>> botRandomDiscardCard <<================");
  try {
    const playerData = await getPlayerGamePlay(currentTurn, tableId);
        if (playerData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.PICK_UP_FROM_OPEN_DECK_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
    logger.info("==========>> botRandomDiscardCard :: playerData <<=======",playerData);

    // Flatten the groupingCards.dwd array
    const dwdCards = playerData.groupingCards.dwd.flat();
    console.log("dwdCards", dwdCards);

    const lastPickCard = playerData.lastPickCard;
    logger.info("==========>> botRandomDiscardCard :: lastPickCard <<=======",lastPickCard);

    // Extract the base card without the suffix for comparison
    const baseLastPickCard = lastPickCard.slice(0, -2);

    // Get 6 random unique cards from dwdCards
    const getRandomCards = (arr:any, num:any) => {
      // Filter out the joker cards and cards that have 'j' in the first character
      const filteredArr = dwdCards.filter(card => {
        const baseCard = card.slice(0, -2);
        return baseCard !== baseLastPickCard && !card.includes("J");
      });
       logger.info("==========>> botRandomDiscardCard :: filteredArr", filteredArr);

      // Shuffle the filtered array
       const shuffled = filteredArr.sort(() => 0.5 - Math.random());
      // const shuffled = arr.sort(() => 0.5 - Math.random());
      logger.info("==========>> botRandomDiscardCard :: shuffled", shuffled);
      return shuffled.slice(0, num);
    };

    const randomDWDCards = getRandomCards(dwdCards, 6);
    logger.info("==========>> botRandomDiscardCard :: randomDWDCards", randomDWDCards);

    // Check if a card exists in the currentCards array
    const cardExistsInCurrentCards = (card:any, currentCards:any) => {
      return currentCards.some((group:any) => group.includes(card));
    };

    // Find a card that exists in both randomDWDCards and currentCards
    const findCardInBoth = (randomCards:any, currentCards:any) => {
      return randomCards.find((card:any) =>
        cardExistsInCurrentCards(card, currentCards)
      );
    };
    
    const resultCard = findCardInBoth(randomDWDCards, playerData.currentCards);
    logger.info("==========>> botRandomDiscardCard :: resultCard", resultCard);

    return [resultCard]
  } catch (error) {
    logger.error("---botRandomDiscardCard :: ERROR: " + error);
  }
}
