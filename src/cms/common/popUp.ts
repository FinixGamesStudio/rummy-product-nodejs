import { NextFunction, Request, Response } from "express";
import { MESSAGES, NUMERICAL } from "../../constants";
import { successPopupMiddleware } from "../middleware/response_middleware";
import successMessages from "../../constants/messages/successMessages";
import logger from "../../logger";

export async function commonPopup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    //User Not Found
    console.log(
      "commonPopup :: starting ............................................"
    );
    let nonProdMsg = "User Not Found";
    const dataPopup = {
      isPopup: true,
      popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
      title: nonProdMsg,
      message: MESSAGES.ERROR.USER_NOT_FOUND,
      buttonCounts: NUMERICAL.ONE,
      button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.OK],
      button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.GREEN],
      button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.RESETAUTHTOKEN],
    };

    const responseData = {
      UserData: {},
      serverPopupData: dataPopup,
    };

    return successPopupMiddleware(
      {
        message: successMessages.COMMON.FETCH_SUCCESS.replace(
          ":attribute",
          "user not found popup"
        ),
        data: responseData,
      },
      req,
      res,
      next
    );
  } catch (error: any) {
    logger.error(" commonPopup :: >>>", error);
    return error;
  }
}

export async function lowBalancePopup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    //User Not Found
    console.log(
      "lowBalancePopup :: starting ............................................"
    );
    let nonProdMsg = "Not Enough Balance";
    const dataPopup = {
      isPopup: true,
      popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
      title: nonProdMsg,
      message: MESSAGES.ERROR.NOT_ENOUGH_BALANCE,
      buttonCounts: NUMERICAL.TWO,
      button_text: [
        MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.BUYNOW,
        MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.CLOSE,
      ],
      button_color: [
        MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.GREEN,
        MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED,
      ],
      button_methods: [
        MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.BUYCOINAPICALL,
        MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.HIDE_POPUP,
      ],
    };

    const responseData = {
      UserData: {},
      serverPopupData: dataPopup,
    };

    return successPopupMiddleware(
      {
        message: successMessages.COMMON.FETCH_SUCCESS.replace(
          ":attribute",
          "user not enough balance popup"
        ),
        data: responseData,
      },
      req,
      res,
      next
    );
  } catch (error: any) {
    logger.error(" lowBalancePopup :: >>>", error);
    return error;
  }
}
