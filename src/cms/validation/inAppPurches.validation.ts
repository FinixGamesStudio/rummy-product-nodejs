import joi from "joi";

  const addCoinsValidator = joi.object().keys({
    coins: joi.number().required(),
  });

  const exportObject ={
    addCoinsValidator
   }

   export = exportObject