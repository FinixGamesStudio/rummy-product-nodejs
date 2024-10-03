export interface playedGames  {   // temporary Data 
  _id: string;
  userId: string;
  status: {
    win:number,
    loss:number,
    tie:number
  };
  runningTableId:string,
}