import * as mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { userDailyActiveStatus } from '../interfaces/userDailyActiveStatus.interface';

const userDailyActiveStatusSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
            required: true
        }
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            getters: true
        }
    }
);

userDailyActiveStatusSchema.plugin(mongoosePaginate);

const userDailyActiveStatusModel = mongoose.model<userDailyActiveStatus & mongoose.Document>(
    'userDailyActiveStatus',
    userDailyActiveStatusSchema
);

export default userDailyActiveStatusModel;
