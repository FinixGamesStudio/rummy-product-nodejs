

import { PREFIX } from "../../../../constants/redis";
import logger from "../../../../logger";
import redis from "../../../redis";

const setRefCodeHistory = async(
    value :string[]
  )=>{
  try {
    return redis.commands.setValueInKey(`${PREFIX.REFCODE_HISTROY}:${PREFIX.PRIVATE_ROOM}:${PREFIX.REFCODE}`, value);
  } catch (error) {
    logger.error("CATCH_ERROR : setRefCodeHistory", error)
      throw error
  }
  }
  const getRefCodeHistory = async():Promise<string[]>=>{
    try {
      const ReffHistory = await redis.commands.getValueFromKey(`${PREFIX.REFCODE_HISTROY}:${PREFIX.PRIVATE_ROOM}:${PREFIX.REFCODE}`);
      return ReffHistory
    } catch (error) {
      logger.error("CATCH_ERROR : getRefCodeHistory", error)
      throw error
    }
  }

  const exportObject = {
    setRefCodeHistory , 
    getRefCodeHistory
}

export = exportObject