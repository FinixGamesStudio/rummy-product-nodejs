export interface formatedwinnerScoreData {
    userId: string;
    score:number;
    rank: string;
    winningAmount:string;
    winLossStatus:string;
  }

  export interface formatedwinnerData {
    tableId : string;
    tournamentId : string;
    playersScore : formatedwinnerScoreData[];
  }