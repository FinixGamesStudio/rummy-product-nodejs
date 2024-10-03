import { NUMERICAL } from "../../../../constants";
import logger from "../../../../logger";
import setCardSuitWise from "../../play/cards/setCardSuitWise";

const _ = require("underscore");

export async function cardAutoSorting(userCards: string[][]) {
    let reqData = { pure: [], set: [], dwd: [userCards], seq: [] };
    let resSeqPriority = await verifCardBySeqPriority(reqData);
    reqData = { pure: [], set: [], dwd: [userCards], seq: [] };
    let resSeqPriorityDwdPoint = await cardsSum(resSeqPriority.dwd);
    if (resSeqPriority.dwd.length === 0) {
        for (const key in resSeqPriority.groupingCard) {
            let isBreak = false;
            for (let i = 0; i < resSeqPriority.groupingCard[key].length; i++) {
                if (resSeqPriority.groupingCard[key][i].length > 3) {
                    resSeqPriority.dwd = [resSeqPriority.groupingCard[key][i][0]];
                    resSeqPriority.groupingCard.dwd = [
                        [resSeqPriority.groupingCard[key][i][0]],
                    ];
                    resSeqPriority.groupingCard[key][i].splice(0, 1);
                    break;
                }
            }
            if (isBreak) break;
        }
    }

    let cardObj: any[] = [];
    let cardObj1: any[] = [];
    let groupIndex: number = 0;
    for (let i = 0; i < resSeqPriority.groupingCard.pure.length; i++) {
        let cardSubObj = [];
        for (let j = 0; j < resSeqPriority.groupingCard.pure[i].length; j++) {
            cardSubObj.push({
                card: resSeqPriority.groupingCard.pure[i][j],
                groupIndex: groupIndex,
            });
        }
        if (cardSubObj.length > 0) {
            cardObj.push(cardSubObj);
            cardObj1.push({
                group: resSeqPriority.groupingCard.pure[i],
                groupType: "Pure Sequence",
                cardPoints: 0,
            });
        }
        groupIndex++;
    }
    for (let i = 0; i < resSeqPriority.groupingCard.seq.length; i++) {
        let cardSubObj = [];
        for (let j = 0; j < resSeqPriority.groupingCard.seq[i].length; j++) {
            cardSubObj.push({
                card: resSeqPriority.groupingCard.seq[i][j],
                groupIndex: groupIndex,
            });
        }
        if (cardSubObj.length > 0) {
            cardObj.push(cardSubObj);
            cardObj1.push({
                group: resSeqPriority.groupingCard.seq[i],
                groupType: "Impure Sequence",
                cardPoints: 0,
            });
        }
        groupIndex++;
    }
    for (let i = 0; i < resSeqPriority.groupingCard.set.length; i++) {
        let cardSubObj = [];
        for (let j = 0; j < resSeqPriority.groupingCard.set[i].length; j++) {
            cardSubObj.push({
                card: resSeqPriority.groupingCard.set[i][j],
                groupIndex: groupIndex,
            });
        }
        if (cardSubObj.length > 0) {
            cardObj.push(cardSubObj);
            cardObj1.push({
                group: resSeqPriority.groupingCard.set[i],
                groupType: "Set",
                cardPoints: 0,
            });
        }
        groupIndex++;
    }
    for (let i = 0; i < resSeqPriority.groupingCard.dwd.length; i++) {
        let cardSubObj = [];
        for (let j = 0; j < resSeqPriority.groupingCard.dwd[i].length; j++) {
            cardSubObj.push({
                card: resSeqPriority.groupingCard.dwd[i][j],
                groupIndex: groupIndex,
            });
        }
        if (cardSubObj.length > 0) {
            cardObj.push(cardSubObj);
            cardObj1.push({
                group: resSeqPriority.groupingCard.dwd[i],
                groupType: "Invalid",
                cardPoints: resSeqPriorityDwdPoint,
            });
        }
        groupIndex++;
    }
    return { cardObj, cardObj1, dwdLen: resSeqPriority.dwd.length };
}

export async function verifCardBySeqPriority(groupingCard: any) {
    let dwd = _.flatten(groupingCard.dwd);
    dwd = await dwdSortingByNumber(dwd);

    // Find sequences
    let seqResData = await findSeqFromDwd(dwd, groupingCard);
    if (seqResData.groupingCard.pure.length === 0) {
        return {
            dwd: seqResData.dwd,
            groupingCard: seqResData.groupingCard,
        };
    }
    let impureSeqResData = await findImpureSeqFromDwd(
        seqResData.dwd,
        seqResData.groupingCard
    );

    if (
        impureSeqResData.groupingCard.seq.length === 0 &&
        seqResData.groupingCard.pure.length < 2
    ) {
        return {
            dwd: impureSeqResData.dwd,
            groupingCard: impureSeqResData.groupingCard,
        };
    }

    // Find set
    let setResData = await findSetFromDwd(
        impureSeqResData.dwd,
        impureSeqResData.groupingCard
    );

    return {
        dwd: setResData.dwd,
        groupingCard: setResData.groupingCard,
    };
}

export async function verifCardBySetPriority(groupingCard: any) {
    let dwd = _.flatten(groupingCard.dwd);
    dwd = await dwdSortingByNumber(dwd);
    // Find set
    let setResData = await findSetFromDwd(dwd, groupingCard);
    // Find sequences
    let seqResData = await findSeqFromDwd(
        setResData.dwd,
        setResData.groupingCard
    );

    return {
        dwd: seqResData.dwd,
        groupingCard: seqResData.groupingCard,
    };
}

export async function findSeqFromDwd(dwd: any, groupingCard: any) {
    let seqArray = [];
    let tempDWD = dwd;
    let tempDWD1 = [];
    for (let mainIndex = 0; mainIndex < tempDWD.length; mainIndex++) {
        for (let index = 0; index < dwd.length; index++) {
            if (seqArray.length === 0) {
                seqArray.push(dwd[mainIndex]);
            } else {
                let oldCard = seqArray[seqArray.length - 1];
                let oldCardSplit = oldCard.split("_");
                let newCard = dwd[index];
                let newCardSplit = newCard.split("_");
                if (
                    oldCardSplit[0] === newCardSplit[0] &&
                    Number(oldCardSplit[1]) + 1 === Number(newCardSplit[1])
                ) {
                    seqArray.push(dwd[index]);
                }
            }
        }
        if (seqArray.length >= 3) {
            groupingCard.pure.push(seqArray);
            dwd = await removeCardFromDwd(dwd, seqArray);
        } else {
            for (let dIndex = 0; dIndex < seqArray.length; dIndex++) {
                tempDWD1.push(seqArray[dIndex]);
            }
            tempDWD = await removeCardFromDwd(tempDWD, seqArray);
        }
        seqArray = [];
        mainIndex = -1;
    }
    tempDWD1 = await dwdSortingByNumber(tempDWD1);
    groupingCard.dwd = [tempDWD1];
    return { dwd: tempDWD1, groupingCard: groupingCard };
}

export async function findImpureSeqFromDwd(dwd: any, groupingCard: any) {
    let seqArray = [];
    let tempDWD = dwd;
    let tempDWD1 = [];
    for (let mainIndex = 0; mainIndex < tempDWD.length; mainIndex++) {
        for (let index = 0; index < dwd.length; index++) {
            if (seqArray.length === 0) {
                seqArray.push(dwd[mainIndex]);
            } else {
                let oldCard = seqArray[seqArray.length - 1];
                let oldCardSplit = oldCard.split("_");
                let newCard = dwd[index];
                let newCardSplit = newCard.split("_");
                if (oldCardSplit[1] === "J") {
                    seqArray.push(dwd[index]);
                } else if (
                    oldCardSplit[0] === newCardSplit[0] &&
                    Number(oldCardSplit[1]) + 1 === Number(newCardSplit[1])
                ) {
                    seqArray.push(dwd[index]);
                }
            }
        }
        if (seqArray.length >= 3) {
            groupingCard.seq.push(seqArray);
            dwd = await removeCardFromDwd(dwd, seqArray);
        } else {
            for (let dIndex = 0; dIndex < seqArray.length; dIndex++) {
                tempDWD1.push(seqArray[dIndex]);
            }
            tempDWD = await removeCardFromDwd(tempDWD, seqArray);
        }
        seqArray = [];
        mainIndex = -1;
    }
    tempDWD1 = await dwdSortingByNumber(tempDWD1);
    groupingCard.dwd = [tempDWD1];
    return { dwd: tempDWD1, groupingCard: groupingCard };
}

export async function findSetFromDwd(dwd: any, groupingCard: any) {
    let setArray = [];
    let tempDWD = dwd;
    let tempDWD1 = [];
    let oldColor = [];
    for (let mainIndex = 0; mainIndex < tempDWD.length; mainIndex++) {
        for (let index = 0; index < dwd.length; index++) {
            if (setArray.length === 0) {
                setArray.push(dwd[mainIndex]);
            } else {
                let oldCard = setArray[setArray.length - 1];
                let oldCardSplit = oldCard.split("_");
                let newCard = dwd[index];
                let newCardSplit = newCard.split("_");
                const regexPattern = new RegExp(`^(${newCardSplit[0]})`);
                const filteredArray = setArray.filter((item) =>
                    regexPattern.test(item)
                );

                if (
                    Number(oldCardSplit[1]) === Number(newCardSplit[1]) &&
                    filteredArray.length === 0
                ) {
                    setArray.push(dwd[index]);
                }
            }
        }
        if (setArray.length >= 3) {
            groupingCard.set.push(setArray);
            dwd = await removeCardFromDwd(dwd, setArray);
        } else {
            for (let dIndex = 0; dIndex < setArray.length; dIndex++) {
                tempDWD1.push(setArray[dIndex]);
            }
            tempDWD = await removeCardFromDwd(tempDWD, setArray);
        }
        setArray = [];
        mainIndex = -1;
    }
    tempDWD1 = await dwdSortingByNumber(tempDWD1);
    groupingCard.dwd = [tempDWD1];
    return { dwd: tempDWD1, groupingCard: groupingCard };
}

export async function removeCardFromDwd(dwd: any, seqArray: any) {
    seqArray.forEach((removeCard: any) => {
        const cardIndex = dwd.findIndex((card: any) => card === removeCard);
        if (cardIndex !== -1) {
            dwd.splice(cardIndex, 1);
        }
    });
    return dwd;
}

export async function dwdSortingByNumber(dwd: any) {
    let i = 0,
        j;
    while (i < dwd.length) {
        j = i + 1;

        while (j < dwd.length) {
            let aCard = dwd[j].split("_");
            let bCard = dwd[i].split("_");

            if (Number(aCard[1]) < Number(bCard[1])) {
                let temp = dwd[i];
                dwd[i] = dwd[j];
                dwd[j] = temp;
            }
            j++;
        }
        i++;
    }
    return dwd;
}

export function cardsSum(cards: any[]) {
    let sum: number = 0;
    for (let i = 0; i < cards.length; i++) {
        sum += cardPoint(cards[i]);
    }
    return sum;
}

export function cardPoint(card: any) {
    const differCardSuitCard = differCardSuit(card);
    if (
        differCardSuitCard.rank === 11 ||
        differCardSuitCard.rank === 12 ||
        differCardSuitCard.rank === 13
    ) {
        return 10;
    }

    return differCardSuitCard.rank;
}

export function differCardSuit(cards: any) {
    const object: any = { suit: [], rank: [], deck: [] };
    if (Array.isArray(cards)) {
        for (let i = 0; i < cards.length; i++) {
            if (cards[i]) {
                const d = cards[i].split("_");
                object.suit.push(d[0]);
                object.rank.push(parseInt(d[1] === "J" ? 0 : d[1], 10));
                object.deck.push(parseInt(d[3], 10));
            }
        }
    } else {
        const splitCards = cards.split("_");
        object.suit = splitCards[0];
        splitCards[1] = splitCards[1] === "J" ? 0 : splitCards[1];
        object.rank = +splitCards[1];
        object.deck = +splitCards[3];
    }
    return object;
}

export async function setSingleArray(userCards: any[]) {
    let cards: any[] = [];
    let cardObj: any[] = [];

    for (let i = 0; i < userCards.length; i++) {
        cards = cards.concat(userCards[i].group);
    }
    for (let i = 0; i < cards.length; i++) {
        cardObj.push({
            card: cards[i],
            groupIndex: 0,
        });
    }

    return { cards, cardObj };
}

export async function cardAutoSortingForDeclare(userCards: string[][]) {
    let reqData = { pure: [], set: [], dwd: [userCards], seq: [] };
    let resSeqPriority = await verifCardBySeqPriority(reqData);
    reqData = { pure: [], set: [], dwd: [userCards], seq: [] };
    let resSeqPriorityDwdPoint = await cardsSum(resSeqPriority.dwd);
    if (resSeqPriority.dwd.length === 0) {
        for (const key in resSeqPriority.groupingCard) {
            let isBreak = false;
            for (let i = 0; i < resSeqPriority.groupingCard[key].length; i++) {
                if (resSeqPriority.groupingCard[key][i].length > 3) {
                    resSeqPriority.dwd = [resSeqPriority.groupingCard[key][i][0]];
                    resSeqPriority.groupingCard.dwd = [
                        [resSeqPriority.groupingCard[key][i][0]],
                    ];
                    resSeqPriority.groupingCard[key][i].splice(0, 1);
                    break;
                }
            }
            if (isBreak) break;
        }
    }

    let cardObj: any[] = [];
    let cardObj1: any[] = [];
    let groupIndex: number = 0;
    for (let i = 0; i < resSeqPriority.groupingCard.pure.length; i++) {
        let cardSubObj = [];
        for (let j = 0; j < resSeqPriority.groupingCard.pure[i].length; j++) {
            cardSubObj.push({
                card: resSeqPriority.groupingCard.pure[i][j],
                groupIndex: groupIndex,
            });
        }
        if (cardSubObj.length > 0) {
            cardObj.push(cardSubObj);
            cardObj1.push({
                group: resSeqPriority.groupingCard.pure[i],
                groupType: "Pure Sequence",
                cardPoints: 0,
            });
        }
        groupIndex++;
    }
    for (let i = 0; i < resSeqPriority.groupingCard.seq.length; i++) {
        let cardSubObj = [];
        for (let j = 0; j < resSeqPriority.groupingCard.seq[i].length; j++) {
            cardSubObj.push({
                card: resSeqPriority.groupingCard.seq[i][j],
                groupIndex: groupIndex,
            });
        }
        if (cardSubObj.length > 0) {
            cardObj.push(cardSubObj);
            cardObj1.push({
                group: resSeqPriority.groupingCard.seq[i],
                groupType: "Impure Sequence",
                cardPoints: 0,
            });
        }
        groupIndex++;
    }
    for (let i = 0; i < resSeqPriority.groupingCard.set.length; i++) {
        let cardSubObj = [];
        for (let j = 0; j < resSeqPriority.groupingCard.set[i].length; j++) {
            cardSubObj.push({
                card: resSeqPriority.groupingCard.set[i][j],
                groupIndex: groupIndex,
            });
        }
        if (cardSubObj.length > 0) {
            cardObj.push(cardSubObj);
            cardObj1.push({
                group: resSeqPriority.groupingCard.set[i],
                groupType: "Set",
                cardPoints: 0,
            });
        }
        groupIndex++;
    }
    for (let i = 0; i < resSeqPriority.groupingCard.dwd.length; i++) {
        let cardSubObj = [];
        let cardArray = [];
        for (let j = 0; j < resSeqPriority.groupingCard.dwd[i].length; j++) {
            cardSubObj.push({
                card: resSeqPriority.groupingCard.dwd[i][j],
                groupIndex: groupIndex,
            });
        }
        if (cardSubObj.length > 0) {

            // keval
            const formatedCards = await setCardSuitWise(resSeqPriority.groupingCard.dwd[i]);
            logger.info("--------:: cardAutoSorting :: formatedCards",formatedCards)

            for (let i = 0; i < formatedCards.length; i++) {
                const cards = formatedCards[i];
                logger.info("--------:: cardAutoSorting :: cards",cards)
                if(cards.length > NUMERICAL.ONE){
                    cardSubObj.push({
                        card: cards,
                        groupIndex: groupIndex,
                    });
                    cardObj.push(cardSubObj);
                    cardObj1.push({
                        group: cards,
                        groupType: "Invalid",
                        cardPoints: resSeqPriorityDwdPoint,
                    });
                }else{
                    cardArray.push(cards[0])
                    logger.info("--------:: cardAutoSorting :: cardArray",cardArray)
                }
            }
            if(cardArray.length >= NUMERICAL.ONE){
                cardSubObj.push({
                    card: cardArray,
                    groupIndex: groupIndex,
                   });
                   cardObj.push(cardSubObj);
                   cardObj1.push({
                    group: cardArray,
                    groupType: "Invalid",
                    cardPoints: resSeqPriorityDwdPoint,
                   });
            }
        }
        groupIndex++;
    }
    return { cardObj, cardObj1, dwdLen: resSeqPriority.dwd.length };
}