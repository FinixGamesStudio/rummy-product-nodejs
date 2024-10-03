export interface checkBalanceIf {
  tournamentId: string;
}


export interface rediusCheckDataRes {
  _id: string;
  gameId: string;
  isGameRadiusLocationOn: boolean;
  LocationRange: string;
  numericId: number;
  createdAt: string;
  updatedAt: string;
}

export interface multiPlayerDeductEntryFeeResponse {
  isMinPlayerEntryFeeDeducted: boolean;
  isInsufficiantBalance: boolean;
  insufficiantBalanceUserIds: Array<string>;
  deductedUserIds: Array<string>;
  notDeductedUserIds: Array<string>;
  deductedEntryFeesData: Array<any>;
  refundedUserIds: Array<string>;
}

export interface multiPlayerDeductEntryFeeIf {
  tableId: string;
  tournamentId: string;
  userIds: Array<string>;
}

export interface upadedBalanceIf {
  userId: string;
  balance: number;
}

export interface formateScoreIf {
  userId: string;
  score: number;
  rank?: string;
  winningAmount?: string;
  winLossStatus?: string;
}

export interface multiPlayerWinnScoreIf {
  tableId: string;
  tournamentId: string;
  playersScore: formateScoreIf[]
}

export interface playersDataIf {
  userId: string;
  winningAmount: number;
  winLossStatus: string;
  score: number,
  rank?: string;
}

export interface markCompletedGameStatusIf {
  tableId: string;
  tournamentId: string;
  gameId: string;
}

export interface addGameRunningStatusIf {
  tableId: string;
  tournamentId: string;
  gameId: string;
}

export interface firstTimeIntrectionInput {
  gameId: string;
  gameModeId?: string;
}

export interface multiPlayerDeductEntryFeeForPoolRummyIf {
  tournamentId: string;
  tableId: string;
  userId: string;
}
export interface getBotIf {
  isBotAvailable: boolean;
  botDetails: botUser
}

export interface botUser {
  _id: string;
  email: string;
  role: string;
  password?: string;
  isBlock?: boolean;
  lastActivateAt?: Date;
  commission?: number;
  title: string;
  phoneNumber: string;
  bonus?: number;
  address?: string;
  country?: string;
  platformFee?: number;
  deviceType?: string;
  payoutMethod?: string;
  winCash?: number;
  cash?: number;
  totalDeposits?: number;
  totalWithdrawals?: number;
  totalEarnings?: number;
  isReceivePromotions?: boolean;
  isUseCookie?: boolean;
  timeZone?: string;
  profileImage?: string;
  profileImageKey?: string;
  fullName: string;
  coins?: number;
  nickName?: string;
  isAvatarAsProfileImage?: boolean;
  referralCode: string;
  ipAddress: string;
  deviceId: string;
  longitude: string;
  latitude: string;
  state: string;
  isBot?: boolean;
  token?: string;
  adminUserPermission: any;
  isUserDeleteAcount?: boolean;
  userDeleteAccountAt?: string;
  isAllowNotifications?: boolean;
  openingWalletBalance?: number;
  createAdminId: string;
  updateAdminId?: string;
  numericId: number;
}
