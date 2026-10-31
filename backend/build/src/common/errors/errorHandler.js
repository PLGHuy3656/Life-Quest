import { StatusCodes } from 'http-status-codes';
const errorHandler = (error, req, res, next) => {
  // Nếu không có statusCode thì mặc định dùng 500
  const statusCode = error.statusCode ? error.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;

  // Nếu không có message thì dùng message mặc định
  const errorMessage = error.message ? error.message : 'Internal Server Error';

  // Nếu không có error code thì dùng code mặc định
  const errorCode = error.errorCode ? error.errorCode : 'INTERNAL_SERVER_ERROR';
  const errorResponse = {
    succes: false,
    error: {
      code: errorCode,
      message: errorMessage
    }
  };
  return res.status(statusCode).json(errorResponse);
};
export default errorHandler;