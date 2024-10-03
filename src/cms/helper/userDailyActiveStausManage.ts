import logger from "../../logger";
import moment from "moment";
import { DB } from "../mongoDBServices";
import userDailyActiveStatusModel from "../model/userDailyActiveStatus.model";

async function userDailyActiveStausManage(userId: string) {
    try {

        const date: any = moment().startOf("day");
        logger.info("userDailyActiveStausManage :: date :: ==>>", date);

        const query = {
            userId: userId,
            createdAt: {
                $gte: new Date(date)
            }
        }

        let userDailyActiveStatus = await DB.findOne(userDailyActiveStatusModel, {
            query: query
        })
        logger.info("userDailyActiveStatus ::: ==>>", userDailyActiveStatus);

        if (userDailyActiveStatus) {

            await DB.findOneAndUpdate(userDailyActiveStatusModel, {
                query: query,
                updateData: { $set: { userId: userId } }
            });

        } else {
            await DB.create(userDailyActiveStatusModel, {
                insert: {
                    userId: userId
                }
            });
        }

    } catch (error: any) {
        logger.error("CATCH :: userDailyActiveStausManage :: ERROR :: error ::>>", error);
        logger.error(
            "CATCH :: userDailyActiveStausManage :: ERROR :: err.message ::>> ",
            error?.message
        );
        return false;
    }
}

const exportObj = {
    userDailyActiveStausManage,
};
export = exportObj;