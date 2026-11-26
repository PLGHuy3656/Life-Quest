import prisma from '../../config/database.js'
import ApiError from '../errors/ApiError.js'

const authorizeAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication required', 'AUTHENTICATION_REQUIRED')
    }

    if (req.user.role === 'ADMIN') {
      return next()
    }

    // Kiểm tra trong database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      throw new ApiError(403, 'Admin privileges required', 'FORBIDDEN')
    }

    req.user.role = 'ADMIN'
    next()
  } catch (error) {
    next(error)
  }
}

export default authorizeAdmin
export { authorizeAdmin }
