import * as mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { InAppStore } from '../interfaces/inAppStore.interface';
import { IN_APP_STORE_CONSTANT } from '../../constants';

const inAppStoreSchema = new mongoose.Schema(
    {
        productId: {
            type: String,
            require: true
        },
        name: {
            type: String,
            required: true,
            index: true
        },
        items: {
            type: String,
            default: IN_APP_STORE_CONSTANT.IN_APP_STORE_ITEMS.coins
        },
        deviceType: {
            type: String,
            enum: IN_APP_STORE_CONSTANT.IN_APP_STORE_PLATFORM_ARRAY,
            default: 'Android'
        },
        price: {
            type: Number,
            required: true
        },
        coins: {
            type: Number,
            required: true
        },
        inAppStoreImage: {
            type: String,
            required: true
        },
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

inAppStoreSchema.plugin(mongoosePaginate);


const InAppStoreModel = mongoose.model<InAppStore & mongoose.Document>(
    'InAppStore',
    inAppStoreSchema
);

export default InAppStoreModel;
