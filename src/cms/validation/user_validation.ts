import joi from "joi";


  const userValidator = joi.object().keys(
   { deviceId: joi.string().required(),
    deviceType: joi.string().required(),
    token: joi.string().allow("").required(),
    isLink: joi.boolean().required()

   })

    const editUserValidator = joi.object().keys({
      userName: joi.string().required()
    });
    const getUserDataValidator = joi.object().keys({
      deviceId: joi.string().required()
    });

    

   const exportObject ={
    userValidator,
    editUserValidator,
    getUserDataValidator
   }

   export = exportObject