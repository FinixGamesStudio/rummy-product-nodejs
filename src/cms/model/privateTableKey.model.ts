import * as mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { privateTableKey } from '../interfaces/privateTableKey.interface';

const privateTableKeySchema = new mongoose.Schema(
    {
          lobbyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'headToHead',
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
          isCreateRoom: {
            type: Boolean,
            required: true
          },
          isReferralCode: {
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

privateTableKeySchema.plugin(mongoosePaginate);

const privateTableKeyModel = mongoose.model<privateTableKey & mongoose.Document>(
  'privateTableKey',
  privateTableKeySchema
);

export default privateTableKeyModel;
