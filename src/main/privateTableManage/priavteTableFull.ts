import { EVENTS, MESSAGES, NUMERICAL } from "../../constants";
import logger from "../../logger";
import commonEventEmitter from "../commonEventEmitter";

export async function PrivateTableFull(
    socket: any
  ): Promise<any> {
    try {
      //Table Full PopUp
      console.log("PrivateTableFull :: starting ............................................")
      const socketId = socket.id;
      let nonProdMsg = "Alert";
      commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
        socket: socketId,
        data: {
          isPopup: true,
          popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
          title: nonProdMsg,
          message: MESSAGES.ERROR.PRIVATE_TABLE_IS_CLOSE,
          buttonCounts: NUMERICAL.ONE,
          button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.OK],
          button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
          button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.POPUPEXITBTNCLICK],
          showLoader: false,
        },
      });
  
      return false;
    } catch (error: any) {
      logger.error(" PrivateTableFull :: >>>", error);
      return error;
    }
  }