import { questsService } from './questsService.js'
import { StatusCodes } from 'http-status-codes'


const getQuestsByUserId = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { status, goalId, milestoneId, search } = req.query

    const quests = await questsService.getQuestsByUserId(userId, { status, goalId, milestoneId, search })

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
    const userId = req.user.id
    const questData = req.body

    const createdQuest = await questsService.createQuest(userId, questData)
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
    const userId = req.user.id

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
    const userId = req.user.id


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
    const userId = req.user.id


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
    const userId = req.user.id

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
    const userId = req.user.id

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

const archiveQuest = async (req, res, next) => {
  try {
    const questId = req.params.questId
    const userId = req.user.id

    const archivedQuest = await questsService.archiveQuest(questId, userId)

    const responseData = {
      success: true,
      data: archivedQuest
    }

    return res.status(StatusCodes.OK).json(responseData)
  } catch (error) {
    next(error)
  }
}


const restoreQuest = async (req, res, next) => {
  try {
    const questId = req.params.questId
    const userId = req.user.id

    const restoredQuest = await questsService.restoreQuest(questId, userId)

    const responseData = {
      success: true,
      data: restoredQuest
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
  unpinQuest,
  archiveQuest,
  restoreQuest
}
