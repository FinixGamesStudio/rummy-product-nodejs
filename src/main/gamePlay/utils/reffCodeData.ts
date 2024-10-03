import { NUMERICAL } from "../../../constants";
import logger from "../../../logger";
import { getRefCodeHistory, setRefCodeHistory } from "../cache/reffCode.ts";

export async function setReffCode(ReffCode: string) {
    try {
      let refCodeList = await getRefCodeHistory();
  
      if (!refCodeList) {
        refCodeList = [];
      }
  
      refCodeList.push(ReffCode);
  
      await setRefCodeHistory(refCodeList);
    } catch (error) {
      throw error;
    }
  }
  
  export async function removeReffCode(ReffCode: string | undefined) {
    try {
      let refCodeAvalible : string[]= await getRefCodeHistory();
      logger.info("----->> utils :: removeReffCode ::refCodeAvalible :>> ", refCodeAvalible);
  
  
      if (!refCodeAvalible) {
        refCodeAvalible = [];
      }
      const Code = refCodeAvalible.filter((RCode)=>{
          return RCode == ReffCode
      })
      logger.info("----->> utils :: removeReffCode :: Code :: >>", Code);
  
  
      if(Code.length == NUMERICAL.ONE){
      logger.info("----->> utils :: removeReffCode :: ONE LENGTH :: >>> ");
          const index = refCodeAvalible.findIndex((RCode)=> RCode ==Code[0])
      logger.info("----->> utils :: index ::  removeReffCode :: ", index);
      if (index != -1) {
          refCodeAvalible.splice(index, 1);
      }
      }else{
          for await (const code1 of Code){
              const index = refCodeAvalible.findIndex((RCode)=> RCode === code1)
              if (index != -1) {
                  refCodeAvalible.splice(index, 1);
              }
          }
      }
      logger.info("----->> utils :: removeReffCode :: refCodeAvalible :: 2 ", refCodeAvalible);

        await setRefCodeHistory(refCodeAvalible)
      
    } catch (error) {
      throw error;
    }
  }