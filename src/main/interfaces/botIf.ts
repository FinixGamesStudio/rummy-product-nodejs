export interface botCardPickTurnTimerIf {
    timer: number;
    tableId: string;
    currentTurn: string;
}
export interface botFinishCardTimerIf {
    timer: number;
    tableId: string;
    currentTurn: string;
}

export interface botWinTimerIf {
    timer: number;
    tableId: string;
}

export interface botCardIf{
    currentCards : string[][];
    closeDeck : string[];
    isValidCardsCount : boolean;
}

export interface botAutoDeclareIf {
    timer: number;
    tableId: string;
    currentRound: number,
}
