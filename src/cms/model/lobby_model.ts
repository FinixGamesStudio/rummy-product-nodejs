import * as mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { HeadToHead } from "../interfaces/headToHead.interface";
import { HEADTOHEAD_CONTANT } from "../../constants";


const headToHeadSchema = new mongoose.Schema(
  {
    tournamentName: {
      type: String,
      trim: true,
    },
    publisherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    tournamentType: {
      type: String,
      enum: HEADTOHEAD_CONTANT.TOURNAMENT_TYPE_ARRAY,
    },
    eventType: {
      type: String,
      required: true,
      enum: HEADTOHEAD_CONTANT.EVENT_TYPE_ARRAY,
    },
    gameType:{
      type:String,
      required:true
    },
    entryfee: {
      type: Number,
      required: true,
    },
    pricePool: {
      type: Array,
    },
    isGameModeOption: {
      type: Boolean,
      required: true,
    },
    gameModeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameMode",
    },
    isCash: {
      type: Boolean,
      required: true,
    },
    isLeaderboardScoreOn: {
      type: Boolean,
      required: true,
    },
    leaderboardScores: {
      type: Array,
    },
    leaderboardPoints: {
      type: Number,
    },
    pointValue: {
      type: Number,
    },
    isUseBot: {
      type: Boolean,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    numericId: {
      type: Number,
      default: 0,
    },
    minPlayer: {
      type: Number,
    },
    maxPlayer: {
      type: Number,
    },
    lobbyType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LobbyType",
      required: true,
    },
    noOfPlayer: {
      type: Number,
    },
    noOfDecks: {
      type: Number,
    },
    isDefaultPlatformCommission: {
      type: Boolean,
      required: true,
    },
    platformCommission: {
      type: Number,
      required: true,
    },
    isGST: {
      type: Boolean,
      required: true,
    },
    isDefaultGST: {
      type: Boolean,
    },
    GSTPercentage: {
      type: Number,
    },
    platformGST: {
      type: Number,
    },
    isDummyPlayer: {
      type: Boolean,
      required: true,
    },
    dummyPlayerStartPoint: {
      type: Number,
      default: 0,
    },
    GSTAmount: {
      type: Number,
    },
    isMultiWinner: {
      type: Boolean,
      required: true,
    },
    multiWinner: {
      type: Number,
    },
    maximumAllowEntry: {
      type: Number,
    },
    winningPrice: {
      type: Number,
      required: true,
    },
    tournamentRules: {
      type: String,
    },
    tournamentJoinStartDate: {
      type: Date,
    },
    tournamentPlayStartDate: {
      type: Date,
    },
    levelInfo: {
      type: Array,
    },
    tournamentIconImage: {
      type: String,
    },
    tournamentIconimageKey: {
      type: String,
    },
    minEntryFee: {
      type: Number,
    },
    maxEntryFee: {
      type: Number,
    },
    stakesAmount: {
      type: Number,
    },
    isAutoSplit: {
      type: Boolean,
    },
    createAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updateAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
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

headToHeadSchema.plugin(mongoosePaginate);

const HeadToHeadModel = mongoose.model<HeadToHead & mongoose.Document>(
  "headToHead",
  headToHeadSchema
);
export default HeadToHeadModel;
