
import { milestonesService } from './milestonesService.js'
import { StatusCodes } from 'http-status-codes'


// Lấy danh sách Milestone theo GoalId
const getMilestonesByGoalId = async (req, res, next) => {
  try {
    const goalId = req.params.goalId
    const userId = req.query.userId

    const milestones = await milestonesService.getMilestonesByGoalId(goalId, userId)

    const responseData = {
      success: true,
      data: milestones
    }

    return res.status(StatusCodes.OK).json(responseData)
  } catch (error) {
    next(error)
  }
}


const createMilestone = async (req, res, next) => {
  try {
    const goalId = req.params.goalId
    const userId = req.query.userId
    const milestoneData = req.body

    const milestone = await milestonesService.createMilestone(goalId, userId, milestoneData)

    const responseData = {
      success: true,
      data: milestone
    }

    return res.status(StatusCodes.OK).json(responseData)
  } catch (error) {
    next(error)
  }
}


export const milestonesController = {
  getMilestonesByGoalId,
  createMilestone
}
