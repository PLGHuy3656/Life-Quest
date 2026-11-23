import jwt from 'jsonwebtoken'
import ApiError from '../errors/ApiError.js'


const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_default'


// Middleware xác thực JWT từ Authorization header
// Set req.user = { id, userId, sub, email, username, status } nếu token hợp lệ
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

    const userIdentifier = payload.sub || payload.id || payload.userId

    // Gắn thông tin user vào request (hỗ trợ đầy đủ id, userId, sub)
    req.user = {
      id: userIdentifier,
      userId: userIdentifier,
      sub: userIdentifier,
      email: payload.email,
      username: payload.username,
      status: payload.status
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Middleware xác thực tùy chọn (nếu có Bearer token thì giải mã, không có thì bỏ qua)
export const authenticateOptional = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      if (token) {
        try {
          const payload = jwt.verify(token, ACCESS_SECRET)
          const userIdentifier = payload.sub || payload.id || payload.userId
          req.user = {
            id: userIdentifier,
            userId: userIdentifier,
            sub: userIdentifier,
            email: payload.email,
            username: payload.username,
            status: payload.status
          }
        } catch {
          // Token không hợp lệ hoặc hết hạn thì bỏ qua ở chế độ optional
        }
      }
    }
    next()
  } catch {
    next()
  }
}


export { authenticate }
export default authenticate
