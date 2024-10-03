import { NextFunction, Request, Response } from "express";
import { EVENTS, MESSAGES, NUMERICAL } from "../../constants";
import successMessages from "../../constants/messages/successMessages";
import logger from "../../logger";
import { successPopupMiddleware } from "../middleware/response_middleware";

export async function invalidCodePopupLink(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    //Table Full PopUp
    console.log(
      "invalidCodePopupLink :: starting ............................................"
    );
    let nonProdMsg = "Alert";

    const dataPopup = {
      isPopup: true,
      popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
      title: nonProdMsg,
      message: MESSAGES.ERROR.PRIVATE_TABLE_IS_CLOSE,
      buttonCounts: NUMERICAL.ONE,
      button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.OK],
      button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
      button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT_BTN_CLICK],
      showLoader: false,
    };

    const responseData = {
      tableData: {},
      serverPopupData: dataPopup,
    };

    return successPopupMiddleware(
      {
        message: successMessages.COMMON.FETCH_SUCCESS.replace(
          ":attribute",
          "table popup"
        ),
        data: responseData,
      },
      req,
      res,
      next
    );
  } catch (error: any) {
    logger.error(" invalidCodePopup :: >>>", error);
    return error;
  }
}


export async function invalidCodePopup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    //Table Full PopUp
    console.log(
      "invalidCodePopup :: starting ............................................"
    );
    let nonProdMsg = "Check Your Code";
    const dataPopup = {
      isPopup: true,
      popupType: MESSAGES.ALERT_MESSAGE.TYPE.INVALID_CODE_POPUP,
      title: nonProdMsg,
      message: MESSAGES.ERROR.CODE_ERROR,
      buttonCounts: NUMERICAL.ONE,
      button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.RETRY],
      button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
      button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.HIDE_POPUP],
      showLoader: false,
    };

    const responseData = {
      tableData: {},
      serverPopupData: dataPopup,
    };

    return successPopupMiddleware(
      {
        message: successMessages.COMMON.FETCH_SUCCESS.replace(
          ":attribute",
          "table popup"
        ),
        data: responseData,
      },
      req,
      res,
      next
    );
  } catch (error: any) {
    logger.error(" invalidCodePopup :: >>>", error);
    return error;
  }
}
