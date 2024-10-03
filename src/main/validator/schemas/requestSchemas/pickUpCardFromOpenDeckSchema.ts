import Joi from "joi"

const pickUpCardFromOpenDeckSchema = Joi.object().keys({
    userId : Joi.string().required().description("user id"),
    tableId : Joi.string().required().description("table Id"),
    currentRound : Joi.number().required().description("current Round"),
}).unknown(true);

export = pickUpCardFromOpenDeckSchema;