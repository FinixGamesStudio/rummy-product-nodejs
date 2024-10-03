import Joi from "joi";

const formatSplitDeclareInfoSchema = Joi.object().keys({
    tableId: Joi.string().required().description("table id"),
    playerDetails: Joi.object().keys({
        userId: Joi.string().required().description("user id"),
        winAmount: Joi.number().required().description("win amount"),
        // balance: Joi.number().required().description("balance"),
    isCash:Joi.boolean().description('cash mode flag'),
    coins:Joi.number().required().allow(null).description('user coins'), 
    cash:Joi.number().required().allow(null).description('user cash'), 
    winCash:Joi.number().required().allow(null).description('user wincash'), 
    bonus:Joi.number().required().allow(null).description('user bouns'), 
    })
});

export = formatSplitDeclareInfoSchema;