import * as mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
import { User } from "../interfaces/user_interfaces";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, trim: true },
    phoneNumber: { type: String },
    profileImage: {
      type: String,
    },
    userName: {
      type: String,
      required: true
    },
    nickName: {
      type: String,
    },
    deviceId: {
      type: String,
      required: true
    },
    deviceType: {
      type: String,
      required: true
    },
    address: {
      type: String,
      default: "Surat",
    },
    state: {
      type: String,
      default: "Gujrat",
    },
    country: {
      type: String,
      default: "India",
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      // required: true,
    },
    isBlock: {
      type: Boolean,
      default: false,
    },
    lastActivateAt: {
      type: Date,
      default: Date.now,
    },
    bonus: {
      type: Number,
    },
    winCash: {
      type: Number,
    },
    cash: {
      type: Number,
    },
    coins: {
      type: Number,
    },
    totalDeposits: {
      type: Number,
    },
    totalWithdrawals: {
      type: Number,
    },
    totalEarnings: {
      type: Number,
      default : 0,
    },
    timeZone: {
      type: String,
    },
    isBot: {
      type: Boolean,
      default: false,
    },
    isLink: {
      type: Boolean,
      default: false,
    },
    token: {
      type: String,
    },
    avatarName: {
      type: String,
    },
    useAvatar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Avatar",
    },
    purchaseAvatars: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Avatar",
    }]
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      getters: true,
    },
  }
);

userSchema.plugin(mongoosePaginate);
userSchema.plugin(aggregatePaginate);

const UserModel = mongoose.model<User & mongoose.Document>("User", userSchema);

export default UserModel;
