import { EVENTS, NUMERICAL, PLAYER_STATE } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";
import { getPlayerGamePlay } from "../../gamePlay/cache/Players";
import { getRoundTableData } from "../../gamePlay/cache/Rounds";
import { getRejoinTableHistory } from "../../gamePlay/cache/TableHistory";
import { getTableData } from "../../gamePlay/cache/Tables";
import { getUser } from "../../gamePlay/cache/User";
import { getUserPrfile } from "../../interfaces/requestIf";
import { userIf } from "../../interfaces/userSignUpIf";

// this function not use in virtul rummy



async function getUserProfile(
  data: getUserPrfile,
  socket: any,
  ack?: Function
) {
  logger.info(" ------- getUserProfile ------- ");

//   try {
//     logger.info("--- getUserProfile :: data :: ", data);

//     const { userId } = data;
//     let isRejoin = false;
//     let lobbyId: string = "";
//     let  isCreateRoom = false ;
//     let isReferralCode: string = ""
//     let noOfPlayer: number = NUMERICAL.ZERO
//     let rummyType: string = ""

//     const getUserPrfileData: userIf = await getUser(userId);
//     logger.info(
//       "--- getUserProfile :: getUserPrfileData :: ",
//       getUserPrfileData
//     );
//     let balance = Number(NUMERICAL.FIVE_THOUSAND);
//     if (getUserPrfileData) {
//       // let rejoinPlayerData =
//       // getUserPrfileData.isCreateRoom && getUserPrfileData.isReferralCode != ""
//       //   ? await getRejoinTableHistory(userId, getUserPrfileData.gameId, getUserPrfileData.lobbyId as string)
//       //   : await getRejoinTableHistory(userId, getUserPrfileData.gameId , getUserPrfileData.OldLobbyId as string);

//       const rejoinPlayerData = await getRejoinTableHistory(
//         getUserPrfileData.userId,
//         getUserPrfileData.gameId,
//         getUserPrfileData.OldLobbyId as string
//       );
//       console.log(":::::: getUserProfile rejoinPlayerData :::>>>>", rejoinPlayerData);

//       if (rejoinPlayerData) {
//         let { tableId } = rejoinPlayerData;

//         const tabledata = await getTableData(tableId);
//         console.log(":::::: getUserProfile tableid :::>>>>", tableId);
//         console.log(":::::: getUserProfile tabledata :::>>>>", tabledata);
//         console.log(":::::: getUserProfile rejoinPlayerData :::>>>>", rejoinPlayerData);

//         if (tabledata) {
//           const playerData = await getPlayerGamePlay(userId, tableId);
//           console.log(
//             ":::::: getUserProfile :: playerData :::>>>>",
//             playerData
//           );

//           if (playerData && playerData.userStatus !== PLAYER_STATE.LEFT && !playerData.isLeft) {
//             isRejoin = true;
//             lobbyId = tabledata.lobbyId;
//             isCreateRoom = tabledata.isCreateRoom ;
//             isReferralCode = tabledata.isReferralCode ;
//             noOfPlayer = tabledata.maximumSeat;
//             rummyType= tabledata.rummyType
//           }

//           console.log(
//             ":::::: -------------------getUserProfile ------------------------ :::>>>>",
//             tableId
//           );
//         }
//       }
//       balance = getUserPrfileData.balance as number;
//     }

//     logger.info("--- getUserPrfileData :: balance :: ", balance);

//     commonEventEmitter.emit(EVENTS.GET_USER_PROFILE, {
//       socket: socket.id,
//       data: {
//         userId,
//         balance: balance,
//         isRejoin,
//         lobbyId,
//         isCreateRoom,
//         isReferralCode,
//         noOfPlayer,
//         rummyType
//       },
//     });
//   } catch (error) {
//     logger.info(":: >>>> getUserProfile error", error);
//   }
}
export = getUserProfile;
