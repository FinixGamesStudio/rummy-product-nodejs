export interface Avatar {
    _id: string;
    avatarName: string;
    gender:string;
    avatarImage: string;
    isFree : boolean;
    coins : number;
  }
  
  export interface GetAllAvatar {
    $or?: any;
  }
  
  export interface UpdateAvatar {
    avatarName?: string;
    gender:string;
    avatarImage?: string;
    isFree? : boolean;
    coins? : number;
  }
  
  
  export interface avatarList {
    _id: string;
    avatarImage: string;
    isFree : boolean;
    coins : number;
    isCanBuy : boolean;
    isPurchase : boolean;
    isUsedAvatar : boolean;
  }