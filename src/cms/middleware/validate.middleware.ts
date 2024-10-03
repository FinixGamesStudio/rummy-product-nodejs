import logger from "../../logger";

export const validateRequest = async (validator: any, bodyData: any) => {
  try {
    logger.info("validateRequest :: bodyData :===>> ", bodyData);

    const { error } = validator?.validate(bodyData);
    if (error) {
      if (error?.details[0]?.message) {
        throw new Error(error?.details[0]?.message);
      }
      throw error;
    }
    return true;
  } catch (error) {
    logger.error("validateRequest :: error :>> ", error);
    throw error;
  }
};


