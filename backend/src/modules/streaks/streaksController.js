import { StatusCodes } from 'http-status-codes'
import { streaksService } from './streaksService.js'
import { getCurrentUserId } from '../../common/utils/getCurrentUserId.js'

const getMyStreak = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req)
    const data = await streaksService.getMyStreak(userId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

const freezeStreak = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req)
    const data = await streaksService.freezeStreak(userId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

export const streaksController = {
  getMyStreak,
  freezeStreak
}
