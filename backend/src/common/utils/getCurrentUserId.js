import ApiError from '../errors/ApiError.js'

/**
 * Lấy userId của người dùng hiện tại từ request
 * Thứ tự ưu tiên:
 * 1. req.user?.id (từ JWT middleware trong tương lai)
 * 2. req.headers['x-user-id']
 * 3. req.query.userId
 * 4. req.body.userId
 * 
 * @param {object} req - Express request
 * @param {boolean} isOptional - Nếu true và không tìm thấy userId, trả về null thay vì ném lỗi 401
 */
export const getCurrentUserId = (req, isOptional = false) => {
  const userId = req.user?.id || req.headers['x-user-id'] || req.query?.userId || req.body?.userId

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    if (isOptional) {
      return null
    }
    throw new ApiError(401, 'Unauthorized: missing userId', 'UNAUTHORIZED')
  }

  return userId.trim()
}
