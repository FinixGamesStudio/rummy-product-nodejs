import NUMERICAL from './numerical';
import REDIS from "./redis"
import SOCKET from "./socket";
import MESSAGES from './messages';
import BOT from "./bot"
import EVENTS from "./events"
import MONGO from "./mongo"
import GRPC_ERROR_REASONS from './grpcErrorReasons';
import TABLE_STATE from "./tableState"
import PLAYER_STATE from './playerState';
import EVENT_EMITTER from './eventEmitter';
import SHUFFLE_CARDS from "./shuffleCards";
import CARDS_STATUS from "./cardStatus"
import ERROR_TYPE from './error';
import SPLIT_STATE from "./splitStatus";
import RUMMY_TYPES from "./rummyTypes";
import STATUS_CODE from './statusCode';
import USER_CONSTANCE from './userConstants';
import HEADTOHEAD_CONTANT from "./headToHeadConstant";
import USER_GAME_RUNNING_STATUS from "./userGameRunningStatusConstant";
import ERROR_MESSAGES from "./errorMessages";
import WINNER_STATUS from "./winnerStatus";
import IN_APP_STORE_CONSTANT from './inAppStoreConstant';
import BOT_CONSTANT from "./botConstant";

const exportObject = {
  NUMERICAL,
  REDIS,
  SOCKET,
  MESSAGES,
  BOT,
  EVENTS,
  MONGO,
  GRPC_ERROR_REASONS,
  TABLE_STATE,
  PLAYER_STATE,
  EVENT_EMITTER,
  SHUFFLE_CARDS,
  CARDS_STATUS,
  ERROR_TYPE,
  SPLIT_STATE,
  RUMMY_TYPES,
  PRODUCTION: 'production',
  NULL: "",
  GAME_TYPE: {
    SOLO: "RUMMY",
    PRACTICE: 'PRACTICE',
  },
  STATUS_CODE,
  USER_CONSTANCE,
  VM: "virtualMoney",
  HEADTOHEAD_CONTANT,
  USER_GAME_RUNNING_STATUS,
  ERROR_MESSAGES,
  WINNER_STATUS,
  IN_APP_STORE_CONSTANT,
  BOT_CONSTANT,

}

export = exportObject