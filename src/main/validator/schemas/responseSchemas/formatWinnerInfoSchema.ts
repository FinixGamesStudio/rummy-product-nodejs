import Joi from "joi"

const formatWinnerInfoSchema = Joi.object().keys({
    tableId: Joi.string().required().description("table Id"),
    userId: Joi.string().required().description("user Id"),
    seatIndex: Joi.number().required().description("seat Index"),
    winAmount: Joi.number().required().description("win Amount"),
    // balance: Joi.number().required().description("balance"),
    isCash:Joi.boolean().description('cash mode flag'),
    coins:Joi.number().required().allow(null).description('user coins'), 
    cash:Joi.number().required().allow(null).description('user cash'), 
    winCash:Joi.number().required().allow(null).description('user wincash'), 
    bonus:Joi.number().required().allow(null).description('user bouns'), 
    
}).unknown(true);

export = formatWinnerInfoSchema;