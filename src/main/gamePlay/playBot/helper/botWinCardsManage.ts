import { NUMERICAL } from "../../../../constants";
import logger from "../../../../logger";
import setCardSuitWise from "../../play/cards/setCardSuitWise";
import shuffleCards from "../../play/cards/shuffleCards";

export async function botWinCardsManage(userCards: string[][], closeDeck: string[]) {
    let isValidCardsCount = true;
    try {
        logger.info(' --------------------------------------------------------------------------------------------------------------------------------------- ');
        logger.info(' userCards :-->> ', userCards);
        logger.info(' closeDeck :-->> ', closeDeck, " --> ", closeDeck.length);

        const cards: string[] = userCards.flat();
        const allCards: string[] = cards.concat(closeDeck);

        const allCardsSuitWise: string[][] = await setCardSuitWise(allCards);
        const allCardSuitWiseSequence: string[][] = await setCardSuitWiseSequence(allCardsSuitWise) as string[][];
        logger.info(' allCardSuitWiseSequence :--->> ', allCardSuitWiseSequence);

        let botNewCards: string[][] = [];
        let j = 0;
        for (let i = 0; i < allCardSuitWiseSequence.length; i++) {
            const element = allCardSuitWiseSequence[i];
            if (j > 3) break;
            if (element.length >= 3) {
                if (j == 0 && element.length > 3) {
                    botNewCards.push(element.slice(NUMERICAL.ZERO, NUMERICAL.FOUR));
                } else {
                    botNewCards.push(element.slice(NUMERICAL.ZERO, NUMERICAL.THREE));
                }
            }
            j++;
        }
        logger.info('botNewCards :-------->> ', botNewCards);

        const totalCount = botNewCards.reduce((acc, arr) => acc + arr.length, 0);
        logger.info('totalCount :-------->> ', totalCount);
        if(totalCount != NUMERICAL.THIRTEEN){
            isValidCardsCount = false;
            throw new Error(`bot cards not found 13.`)  
        }

        for (let i = 0; i < botNewCards.length; i++) {
            const element = botNewCards[i];
            for (let j = 0; j < element.length; j++) {
                const ele = element[j];
                const findIndex = allCards.findIndex((card) => card === ele);
                if (findIndex != NUMERICAL.MINUS_ONE) {
                    allCards.splice(findIndex, NUMERICAL.ONE);
                }
            }
        }
        const closeDeckCards = await shuffleCards(allCards);
        logger.info('closeDeckCards :-------->> ', closeDeckCards, " --> ", closeDeckCards.length);
        logger.info(' --------------------------------------------------------------------------------------------------------------------------------------- ');
        return { currentCards: botNewCards, closeDeck: closeDeckCards, isValidCardsCount };

    } catch (error) {
        logger.warn('CARD_WARNING :: botWinCardsManage :: -------->>', error);
        return { currentCards: userCards, closeDeck: closeDeck, isValidCardsCount};
    }
}


async function setCardSuitWiseSequence(cards: string[][]) {
    try {
        const result: string[][] = [];

        cards.forEach((suit) => {
            let sequence: string[] = [];
            for (let i = 0; i < suit.length; i++) {
                const currentCardNumber = Number(suit[i].split("_")[1]);
                const previousCardNumber = i > 0 ? Number(suit[i - 1].split("_")[1]) : null;

                if (!previousCardNumber || currentCardNumber - previousCardNumber === 1) {
                    sequence.push(suit[i]);
                } else {
                    if (sequence.length >= 3) {
                        result.push(sequence.slice(0)); // Push a copy of the sequence to the result array
                    }
                    sequence = [suit[i]];
                }
            }

            if (sequence.length >= 3) {
                result.push(sequence.slice(0)); // Push the last sequence to the result array
            }

        });

        return result.sort((a: string[], b: string[]) => b.length - a.length);;

    } catch (error) {
        logger.error('CATCH_ERROR :: setCardSuitWiseSequence :: --->>', error);

    }
}


