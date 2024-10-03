import Joi from "joi";

const formatBootCollectionInfoSchema = Joi.object().keys({
    // userId: Joi.string().required().description("userId"),
    // seatIndex: Joi.number().required().description("seat Index"),
    // bootAmount: Joi.number().required().description("boot Amount"),
    winPrice: Joi.number().required().description("winPrice"),
    // balance: Joi.number().required().description("balance"),
    listOfSeatsIndex :Joi.array().items(Joi.number()).required(),
    isCash:Joi.boolean().description('cash mode flag'),
    coins:Joi.number().required().allow(null).description('user coins'), 
    cash:Joi.number().required().allow(null).description('user cash'), 
    winCash:Joi.number().required().allow(null).description('user wincash'), 
    bonus:Joi.number().required().allow(null).description('user bouns'), 
}).unknown(true);


export = formatBootCollectionInfoSchema