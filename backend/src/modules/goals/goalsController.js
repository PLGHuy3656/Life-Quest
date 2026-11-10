import { goalsService } from './goalsService.js'
import { StatusCodes } from 'http-status-codes'


// Lấy danh sách toàn bộ mục tiêu theo ID người dùng
const getGoalsByUserId = async (req, res, next) => {
  try {
    const userId = req.query.userId

    const goals = await goalsService.getGoalsByUserId(userId)

    const responseData = {
      success: true,
      data: goals
    }

    return res.status(StatusCodes.OK).json(responseData)
  } catch (error) {
    next(error)
  }
}

// Lấy thông tin chi tiết một mục tiêu theo goalId.
const getGoalById = async (req, res, next) => {
  try {
    const goalId = req.params.goalId
    const userId = req.query.userId


    const goal = await goalsService.getGoalById(goalId, userId)

    const responseData = {
      success: true,
      data: goal
    }

    return res.status(StatusCodes.OK).json(responseData)
  } catch (error) {
    next(error)
  }
}


// Tạo mới một mục tiêu(Goal).
const createGoal = async (req, res, next) => {
  try {
    const goalData = req.body

    const goal = await goalsService.createGoal(goalData)

    const responseData = {
      success: true,
      data: goal
    }

    return res.status(StatusCodes.CREATED).json(responseData)
  } catch (error) {
    next(error)
  }
}

// Cập nhật thông tin một mục tiêu theo goalId.
const updateGoal = async (req, res, next) => {
  try {
    const goalId = req.params.goalId
    const userId = req.query.userId
    const updateData = req.body


    const updatedGoal = await goalsService.updateGoal(goalId, userId, updateData)

    const responseData = {
      success: true,
      data: updatedGoal
    }
    return res.status(StatusCodes.OK).json(responseData)
  } catch (error) {
    next(error)
  }
}


// Xóa mềm Goal
const archiveGoal = async (req, res, next) => {
  try {
    const goalId = req.params.goalId
    const userId = req.query.userId

    const archivedGoal = await goalsService.archiveGoal(goalId, userId)

    const responseData = {
      success: true,
      data: archivedGoal
    }
    return res.status(StatusCodes.OK).json(responseData)
  } catch (error) {
    next(error)
  }
}


const pauseGoal = async (req, res, next) => {
  try {
    const goalId = req.params.goalId
    const userId = req.query.userId

    const pausedGoal = await goalsService.pauseGoal(goalId, userId)

    const responseData = {
      success: true,
      data: pausedGoal
    }
    return res.status(StatusCodes.OK).json(responseData)
  } catch (error) {
    next(error)
  }
}


export const goalsController = {
  getGoalsByUserId,
  getGoalById,
  createGoal,
  updateGoal,
  archiveGoal,
  pauseGoal
}