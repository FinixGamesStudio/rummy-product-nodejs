
import jwt from "jsonwebtoken";
import config from '../../connections/config';
import logger from "../../logger";
import { User, userDataIf } from "../interfaces/user_interfaces";
import { DB } from "../mongoDBServices";
import UserModel from "../model/user_model";
import { USER_CONSTANCE } from "../../constants";

export async function checkIsValidTokenHandle(token: string) {
  try {
    const { JWT_SECRET } = config();
    const userData = jwt.verify(token, JWT_SECRET) as userDataIf;
    logger.info(" checkIsValidToken :: userData :: =>", userData)
    const _id = userData._id;

    let isValidUser = true;
    const user : User = await DB.findOne(UserModel, {
      query: { _id, role: USER_CONSTANCE.ROLES.USER },
      select: "_id",
    }) as User;
    if (!user) {
      isValidUser = false;
    }
    if (user.isBlock) {
      isValidUser = false;
    }
    return { isValidUser, user};
  } catch (err : any) {
    logger.error("CATCH :: checkIsValidToken :: ERROR :: error ::>>", err);
    logger.error(
      "CATCH :: checkIsValidToken :: ERROR :: err.message ::>> ",
      err?.message
    );
    throw err;
  }
}
