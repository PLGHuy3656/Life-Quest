import ApiError from "../errors/ApiError.js";
const validate = schema => {
  // lấy request data
  // Joi validate
  // lỗi → throw ApiError
  // đúng → next()
  const validationMiddleware = (req, res, next) => {
    const requestData = {
      body: req.body,
      params: req.params,
      query: req.query
    };
    const validationResult = schema.validate(requestData);
    const validationError = validationResult.error;
    if (validationError) {
      const errorMessage = validationError.details[0].message;
      throw new ApiError(400, errorMessage);
    }
    next();
  };
  return validationMiddleware;
};
export default validate;