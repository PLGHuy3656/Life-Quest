import { questsService } from './questsService.js'
import { StatusCodes } from 'http-status-codes'


const getQuestsByUserId = async (req, res, next) => {
  try {
    const userId = req.query.userId

    const quests = await questsService.getQuestsByUserId(userId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: quests
    })
  } catch (error) {
    next(error)
  }
}

// Tạo mới Quest cho người dùng.
const createQuest = async (req, res, next) => {
  try {
    const questData = req.body

    const createdQuest = await questsService.createQuest(questData)
    const responseData = {
      success: true,
      data: createdQuest
    }

    return res.status(StatusCodes.CREATED).json(responseData)
  } catch (error) {
    next(error)
  }
}

export const questsController = {
  getQuestsByUserId,
  createQuest
}