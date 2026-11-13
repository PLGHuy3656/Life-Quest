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


const getQuestById = async (req, res, next) => {
  try {
    const questId = req.params.questId
    const userId = req.query.userId

    const quest = await questsService.getQuestById(questId, userId)
    const responseData = {
      success: true,
      data: quest
    }

    return res.status(StatusCodes.OK).json(responseData)
  } catch (error) {
    next(error)
  }
}


const updateQuest = async (req, res, next) => {
  try {
    const questData = req.body
    const questId = req.params.questId
    const userId = req.query.userId


    const updatedQuest = await questsService.updateQuest(questId, userId, questData)

    const responseData = {
      success: true,
      data: updatedQuest
    }

    return res.status(StatusCodes.OK).json(responseData)
  } catch (error) {
    next(error)
  }
}


const deleteQuest = async (req, res, next) => {
  try {
    const questId = req.params.questId
    const userId = req.query.userId


    const deletedQuest = await questsService.deleteQuest(questId, userId)

    const responseData = {
      success: true,
      data: deletedQuest
    }

    return res.status(StatusCodes.OK).json(responseData)
  } catch (error) {
    next(error)
  }
}


const pinQuest = async (req, res, next) => {
  try {
    const questId = req.params.questId
    const userId = req.query.userId

    const pinnedQuest = await questsService.pinQuest(questId, userId)

    const responseData = {
      success: true,
      data: pinnedQuest
    }

    return res.status(StatusCodes.OK).json(responseData)
  } catch (error) {
    next(error)
  }
}

const unpinQuest = async (req, res, next) => {
  try {
    const questId = req.params.questId
    const userId = req.query.userId

    const unpinnedQuest = await questsService.unpinQuest(questId, userId)

    const responseData = {
      success: true,
      data: unpinnedQuest
    }

    return res.status(StatusCodes.OK).json(responseData)
  } catch (error) {
    next(error)
  }
}


export const questsController = {
  getQuestsByUserId,
  createQuest,
  getQuestById,
  updateQuest,
  deleteQuest,
  pinQuest,
  unpinQuest
}