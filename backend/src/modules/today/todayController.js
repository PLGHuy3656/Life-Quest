import { StatusCodes } from 'http-status-codes'
import { todayService } from './todayService.js'

// Lấy dữ liệu Today tổng hợp trong ngày cho người dùng
const getToday = async (req, res, next) => {
  try {
    const userId = req.user.id
    const queryDate = req.query.date

    const todayData = await todayService.getToday(userId, queryDate)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: todayData
    })
  } catch (error) {
    next(error)
  }
}

const completeExecution = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { executionId } = req.params

    const result = await todayService.completeExecution(userId, executionId)

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Quest execution completed successfully',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const todayController = {
  getToday,
  completeExecution
}
