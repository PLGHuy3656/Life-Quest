import jwt from 'jsonwebtoken'
import ApiError from '../errors/ApiError.js'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_default'

/**
 * Lấy userId của người dùng hiện tại từ request
 * Thứ tự ưu tiên:
 * 1. req.user?.id || req.user?.userId || req.user?.sub
 * 2. Giải mã Bearer token từ Authorization header (fallback nếu route chưa bọc middleware authenticate)
 * 3. req.headers['x-user-id']
 * 4. req.query.userId
 * 5. req.body.userId
 * 
 * @param {object} req - Express request
 * @param {boolean} isOptional - Nếu true và không tìm thấy userId, trả về null thay vì ném lỗi 401
 */
export const getCurrentUserId = (req, isOptional = false) => {
  let userId = req.user?.id || req.user?.userId || req.user?.sub

  // Nếu req.user chưa có nhưng có Authorization header Bearer token -> tự parse an toàn
  if (!userId) {
    const authHeader = req.headers?.['authorization'] || req.headers?.['Authorization']
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]?.trim()
      if (token) {
        try {
          const decoded = jwt.verify(token, ACCESS_SECRET)
          userId = decoded?.sub || decoded?.id || decoded?.userId
          if (userId && !req.user) {
            req.user = {
              id: userId,
              userId: userId,
              sub: userId,
              email: decoded.email,
              username: decoded.username,
              status: decoded.status
            }
          }
        } catch {
          // Token verify lỗi thì không set userId
        }
      }
    }
  }

  // Fallback sang headers / query / body
  if (!userId) {
    userId = req.headers?.['x-user-id'] || req.query?.userId || req.body?.userId
  }

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    if (isOptional) {
      return null
    }
    throw new ApiError(401, 'Unauthorized: missing userId', 'UNAUTHORIZED')
  }

  return userId.trim()
}
