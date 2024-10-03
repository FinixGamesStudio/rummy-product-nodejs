import * as mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { Avatar } from '../interfaces/avatars.interface';

const avatarSchema = new mongoose.Schema(
  {
    avatarName: {
      type: String,
      required: true,
      index: true
    },
    avatarImage: {
      type: String,
      required: true
    },
    isFree : {
      type: Boolean,
      required: true
    },
    coins : {
      type: Number,
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

avatarSchema.plugin(mongoosePaginate);

const AvatarModel = mongoose.model<Avatar & mongoose.Document>(
  'Avatar',
  avatarSchema
);

export default AvatarModel;
