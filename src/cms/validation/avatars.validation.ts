import Joi from "joi";

const useAvatarValidator = Joi.object().keys({
    avatarId: Joi.string().required(),
});

const buyAvatarValidator = Joi.object().keys({
    avatarId: Joi.string().required(),
});


const exportObject = {
    useAvatarValidator,
    buyAvatarValidator
};

export = exportObject;