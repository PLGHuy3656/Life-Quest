import ApiError from '../errors/ApiError.js'

const validate = (schema) => {
  const validationMiddleware = (req, res, next) => {
    const requestData = {
      body: req.body,
      params: req.params,
      query: req.query
    }

    // allowUnknown: true cho phép các trường không nằm trong định nghĩa schema của route (như body trong GET) không bị báo lỗi
    const validationResult = schema.validate(requestData, {
      abortEarly: false,
      allowUnknown: true
    })
    const validationError = validationResult.error

    if (validationError) {
      const errorMessage = validationError.details[0].message

      throw new ApiError(400, errorMessage, 'VALIDATION_ERROR')
    }
    next()
  }
  return validationMiddleware
}

export default validate
