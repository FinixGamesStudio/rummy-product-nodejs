export interface createBattleRequest {
  battleId: string;
  requestId: string;
  lobbyId: number;
  userIds: Array<number>;
  roundId?: string;
}

export interface playerData {
  userId: number;
  score: number;
  rank: number;
  cashWinnings: number;
  tokenWinnings: number;
  canPlayAgain: boolean;
  nextLobbyConfig: string;
  extraInfo: string;
  extReward: string;
}
export interface battleFinishPayload {
  showResultOnAlert?: string;
  payload: {
    players: Array<winnersDetail>;
  };
}
export interface winnersDetail {
  userId: string;
  username: string;
  // tableName: string;
  seatIndex: number;
  // socketId: string;
  isPlaying: boolean;
  avatar: string;
  score: number;
  winAmount?: number;
  winType: string;
  // userMove : Array<number>
}

export interface battleLobbyPayload {
  players?: any;
  playersData: Array<playerDataParent>;
}
export interface playerDataParent {
  battleId: string;
  userId: number;
  score: number;
  rank: number;
  cashWinningsDecimal: number;
  tokenWinnings: number;
  canPlayAgain: boolean;
  nextLobbySuggestedConfig: string;
}

// {"players":[{"userId":708682,"score":43,"rank":1,"cashWinnings":0.0,"tokenWinnings":0,"canPlayAgain":true,"nextLobbyConfig":"","extraInfo":"{\"forceSubmit\":false}","extReward":null,"cashWinningsV2":{"currencyId":"INR","amount":"0.00"},"tokenWinningsV2":{"currencyId":"INR","amount":"0"},"isCashReward":true},{"userId":3536652,"score":22,"rank":2,"cashWinnings":0.0,"tokenWinnings":0,"canPlayAgain":true,"nextLobbyConfig":"","extraInfo":"{\"forceSubmit\":false}","extReward":null,"cashWinningsV2":{"currencyId":"INR","amount":"0.00"},"tokenWinningsV2":{"currencyId":"INR","amount":"0"},"isCashReward":true}],"battleAgainDisabled":true,"battleStatus":"CLOSED"}
