import { verifyUserProfile } from './verifyUserProfile';
import { getUserOwnProfile } from './getUserOwnProfile';
// import { wallateDebit } from './walletDebit'
import { gameSettinghelp } from './gameSettingMenuHelp'
import { checkBalance } from "./checkBalance";
import { getOneRobot } from "./getOneRobot";
import { rediusCheck } from "./rediusCheck";
import { firstTimeIntrection } from "./firstTimeIntrection";
import { markCompletedGameStatus } from "./markCompletedGameStatus";
import { checkUserBlockStatus } from "./checkUserBlockStatus";
import { checkMaintanence } from "./checkMaintanence";
import { multiPlayerDeductEntryFee } from "./multiPlayerDeductEntryFee";
import { multiPlayerWinnScore } from './multiPlayerWinnScore';



let exportedObj = {
  verifyUserProfile,
  getUserOwnProfile,
  // wallateDebit,
  gameSettinghelp,
  checkBalance,
  getOneRobot,
  rediusCheck,
  firstTimeIntrection,
  markCompletedGameStatus,
  checkUserBlockStatus,
  checkMaintanence,
  multiPlayerDeductEntryFee,
  multiPlayerWinnScore,
};

export = exportedObj;
