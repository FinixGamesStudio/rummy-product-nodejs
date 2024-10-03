import * as mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { UsersGameRunningStatus } from '../interfaces/usersGameRunningStatus.interface';

const RunningGameSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true
    },
    tableId: {
      type: String,
      required: true
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HeadToHead',
      required: true
    },
    status: {
      type: String,
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

RunningGameSchema.plugin(mongoosePaginate);

const UsersGameRunningStatusModel = mongoose.model<UsersGameRunningStatus & mongoose.Document>(
  'UsersGameRunningStatus',
  RunningGameSchema
);

export default UsersGameRunningStatusModel;
