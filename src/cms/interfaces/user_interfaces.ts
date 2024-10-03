export interface User {
    _id: string;
    email: string;
    role: string;
    password?: string;
    isBlock?: boolean;
    lastActivateAt?: Date;
    phoneNumber: string;
    address?: string;
    country?: string;
    bonus: number;
    winCash: number;
    cash: number;
    totalDeposits?: number;
    totalWithdrawals?: number;
    totalEarnings?: number;
    timeZone?: string;
    profileImage?: string;
    coins: number;
    nickName?: string;
    userName?:string
    deviceId: string;
    deviceType: string;
    state: string;
    isBot?: boolean;
    token?: string;
    isLink?: boolean;
    useAvatar : string;
    avatarName : string,
    purchaseAvatars : string[];
  }
  
  export interface userDataIf {
    _id: string;
    role: string;
    deviceId : string;
  }