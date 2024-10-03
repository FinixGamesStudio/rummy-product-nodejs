import { EVENTS, MESSAGES, NUMERICAL } from "../../constants";
import logger from "../../logger";
import commonEventEmitter from "../commonEventEmitter";

export async function privateTableManage(
    socket: any
  ): Promise<any> {
    try {
      //validation PopUp
      console.log("privateTableManage :: starting ............................................")
      const socketId = socket.id;
      let nonProdMsg = "Check Your Code";
      commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
        socket: socketId,
        data: {
          isPopup: true,
          popupType: MESSAGES.ALERT_MESSAGE.TYPE.INVALID_CODE_POPUP,
          title: nonProdMsg,
          message: MESSAGES.ERROR.CODE_ERROR,
          buttonCounts: NUMERICAL.ONE,
          button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.RETRY],
          button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
          button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.HIDE_POPUP],
          showLoader: false,
        },
      });
  
      return false;
    } catch (error: any) {
      logger.error(" privateTableManage :: >>>", error);
      return error;
    }
  }
  