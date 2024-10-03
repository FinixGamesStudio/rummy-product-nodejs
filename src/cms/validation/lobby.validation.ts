import joi from "joi";

const getLobbyValidator = joi.object().keys({
    gameModeName: joi.string().required(),
    gameTypeName: joi.string().required(),
    isCash: joi.boolean().required(),
    gameType: joi.string().allow("").required(),
    noOfPlayer: joi.number().required(),
  });

  const codeWithLobbyValidator = joi.object().keys({
    isReferralCode: joi.string().required().allow(""),
    deviceId: joi.string().required(),
    deviceType: joi.string().required(),
    isLink: joi.boolean().required()
  });

  const exportObject ={
    getLobbyValidator,
    codeWithLobbyValidator,
   }

   export = exportObject