import { User } from "./user_interfaces";


export interface HeadToHead {
  _id: string;
  publisherId: User;
  gameId: Game;
  tournamentName?: string;
  tournamentType: string;
  description?: string;
  eventType: string;
  entryfee: number;
  pricePool: PricePool[];
  isGameModeOption: boolean;
  gameModeId?: string;
  isCash?: boolean;
  isLeaderboardScoreOn?: boolean;
  leaderboardScores?: number[];
  leaderboardPoints?: number;
  pointValue?: number;
  isUseBot: boolean;
  isActive: boolean;
  numericId: number;
  lobbyType?: string;
  minPlayer?: number;
  maxPlayer?: number;
  noOfPlayer?: number;
  noOfDecks?: number;
  isDefaultPlatformCommission: boolean;
  isGST?: boolean;
  isDefaultGST?: boolean;
  GSTPercentage?: number;
  platformCommission: number;
  isMultiWinner?: boolean;
  minEntryFee?: number;
  maxEntryFee?: number;
  stakesAmount?: number;
  multiWinner: number;
  winningPrice: number;
  createAdminId: string;
  isAutoSplit?: boolean;
  updateAdminId?: string;
  gameType:string;
}

export interface Game {
  _id: string;
  publisherId: User;
  gameName: string;
  description: string;
  gameIcon: string;
  gameIconKey: string;
  platform?: string;
  isOrientationPortrait?: boolean;
  genre: string;
  format?: string;
  engine?: string;
  gameStatus: string;
  gameDesignDocLink?: string;
  youtubeVideoLink?: string;
  isVirtualCurrency?: boolean;
  isVerified?: boolean;
  isGameLoopVerified?: boolean;
  isActive?: boolean;
  rejectReason?: string;
  iosAppId?: string;
  iosBundleId?: string;
  iosStoreUrl?: string;
  androidPackageName?: string;
  unityId?: string;
  unityPackageName?: string;
  entryFeesType?: string;
  isHighestScoreWin?: boolean;
  isGameModeOption: boolean;
  isNoOfPlayer: boolean;
  isMultipleDeck?: boolean | null;
  gameTag?: string;
  isModeWiseGameServerLink?: boolean;
  gameServerLink?: string;
  createAdminId: string;
  updateAdminId?: string;
  numericId: number;
}

export interface PricePool {
  rank: number;
  winningPrice: number;
}


export interface lobbyListIf{
  _id : string;
  gameId : string;
  entryfee : number;
  gameModeId : string;
  isCash : boolean;
  isUseBot : boolean;
  isActive : boolean;
  minPlayer : number;
  noOfPlayer : number;
  platformCommission : number;
  winningPrice : number;
  gameModeName : string;
  isCanPlay?: boolean;
}
