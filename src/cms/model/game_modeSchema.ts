import * as mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { game_mode_interface } from '../interfaces/game_mode_interface';


const gameModeSchema = new mongoose.Schema(
    {
      gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game',
        required: true
      },
      gameModeName: {
        type: String,
        required: true
      },
      gameTypeName: {
        type: String,
        required: true
      },
      gameModeIcon: {
        type: String
      },
      position: {
        type: Number
      },
      createAdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      updateAdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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
  
  
  
  gameModeSchema.plugin(mongoosePaginate);
  
  
  const GameModeModel = mongoose.model<game_mode_interface & mongoose.Document>(
    'GameMode',
    gameModeSchema
  );
  
  
  
  export default GameModeModel;