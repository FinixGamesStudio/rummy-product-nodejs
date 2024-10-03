import { locationIf } from "./userSignUpIf";

interface splitDetailsIf {
    splitStatus: string;
    amount: number;
    drop: number;
}

export interface playerPlayingDataIf {
    _id: string;
    userId: string;
    username: string;
    profilePicture: string;
    roundTableId: string;
    seatIndex: number;
    userStatus: string;
    dealType: number;
    poolType: number;
    playingStatus: string;
    splitDetails: splitDetailsIf,
    isFirstTurn: boolean;
    socketId: string;
    lastPickCard: string;
    lastDiscardcard: string;
    lastCardPickUpScource: string;
    finishCard: string;
    currentCards: string[][];
    groupingCards: groupingCard,
    remainSecondryTime: number;
    remainDrop: number;
    cardPoints: number;
    gamePoints: number;
    dropCutPoint: number;
    roundLostPoint: number;
    firstDropCutPoints: number;
    refrensDropsCountPoint: number;
    isUseBot: boolean;
    isBot: boolean;
    isLeft: boolean;
    isAuto: boolean;
    isTurn: boolean;
    isSplit: boolean;
    isCardPickUp: boolean;
    isDiscardcard: boolean;
    isSecondaryTurn: boolean;
    isWinner: boolean;
    isDisconneted: boolean;
    isDrop: boolean;
    isDeclaringState: boolean;
    isSwitchTable: boolean;
    isWaitingForRejoinPlayer: boolean;
    winAmount: number;
    countTurns: number;
    remainMissingTurn: number;
    createdAt: Date;
    updatedAt: Date;
}


export interface groupingCard {
    pure: Array<any>,
    impure: Array<any>,
    set: Array<any>,
    dwd: Array<any>,
    wildCards: Array<any>,
}

export interface defaultPlayerTableIf {
    _id: string;
    userId: string;
    username: string;
    socketId: string;
    profilePicture: string;
    lobbyId: string;
    isFTUE: boolean;
    gameId: string;
    fromBack: boolean;
    dealType: number;
    gamePoolType: number;
    tableId?: string;
    oldTableId?: string[];
    maximumSeat: number;
    minPlayer: number;
    authToken: string;
    isUseBot: boolean;
    bootAmount: number;
    moneyMode: string;
    rummyType: string;
    OldLobbyId?: string;
    // balance: number;
    location: locationIf;
    platformCommission: number;
    createdAt?: Date;
    updatedAt?: Date;
    roundTableId: string;
    seatIndex: number;
    isCash:boolean;
    coins:number;
    cash:number;
    winCash:number;
    bonus:number;
    isBot : boolean;
}

export interface RejoinTableHistoryIf {
    userId: string;
    tableId: string;
    lobbyId: string;
    isEndGame: boolean;
}