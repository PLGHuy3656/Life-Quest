import { goalsService } from './goalsService.js'
import { StatusCodes } from 'http-status-codes'


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

export const goalsController = {
  getGoalsByUserId,
  getGoalById,
  createGoal
}