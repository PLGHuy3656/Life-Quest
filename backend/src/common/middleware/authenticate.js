import jwt from 'jsonwebtoken'
import ApiError from '../errors/ApiError.js'


const IS_PRODUCTION = process.env.NODE_ENV === 'production' || process.env.BUILD_MODE === 'production'
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || (IS_PRODUCTION ? null : 'access_secret_default')
if (!ACCESS_SECRET) {
  throw new Error('JWT_ACCESS_SECRET must be configured in production')
}


// Middleware xác thực JWT từ Authorization header
// Set req.user = { id, email, username, status } nếu token hợp lệ
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']

    // Kiểm tra có header Authorization không
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required', 'AUTHENTICATION_REQUIRED')
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      throw new ApiError(401, 'Authentication required', 'AUTHENTICATION_REQUIRED')
    }

    // Verify access token
    let payload
    try {
      payload = jwt.verify(token, ACCESS_SECRET)
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token expired', 'TOKEN_EXPIRED')
      }
      throw new ApiError(401, 'Invalid token', 'INVALID_TOKEN')
    }

    // Gắn thông tin user vào request
    req.user = {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      status: payload.status
    }

    next()
  } catch (error) {
    next(error)
  }
}


export { authenticate }
export default authenticate
