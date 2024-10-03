import Joi from "joi"

const seatsSchema = Joi.object()
    .keys({
        _id: Joi.string().allow("").description('user Unique Id'),
        userId: Joi.string().allow("").description('user Unique Id'),
        username: Joi.string().allow('').description('user name'),
        profilePicture: Joi.string().allow('').description('user profile pic'),
        seatIndex: Joi.number().description('user seat index'),
        userStatus: Joi.string().allow('').description('user game playing status'),
        inGame: Joi.boolean().optional().description('user game playing status'),
        gameScore: Joi.number().optional().description('user game playing status'),
        authToken : Joi.string().description('user authtoken'),
        coins: Joi.number().description('user coins'),
        avatarName: Joi.string().description('user avatarName'),
        isBot : Joi.boolean().optional().description('user is Bot'),
    })
    .optional()
    .unknown(true);

export = seatsSchema;