export interface playersSplitAmountDetailsIf {
    userId: string;
    amount: number;
    splitStatus: string;
    remainDrops : number;
    socketId: string;
    userName: string;
    gameScore: number;
    isBot:boolean;
}


export interface splitAmountDeclareIf {
    userId: string;
    winAmount: number;
    // balance: number;
    cash:number;
    coins:number;
    isCash:boolean;
    winCash:number;
    bonus:number;
}