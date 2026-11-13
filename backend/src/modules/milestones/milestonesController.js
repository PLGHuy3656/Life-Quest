
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

    const createdMilestone = await milestonesService.createMilestone(goalId, userId, milestoneData)

    const responseData = {
      success: true,
      data: createdMilestone
    }

    return res.status(StatusCodes.OK).json(responseData)
  } catch (error) {
    next(error)
  }
}

const getMilestonesById = async (req, res, next) => {
  try {
    const milestoneId = req.params.milestoneId
    const userId = req.query.userId

    const getByIdMilestoned = await milestonesService.getMilestonesById(milestoneId, userId)

    const responseData = {
      success: true,
      data: getByIdMilestoned
    }

    return res.status(StatusCodes.OK).json(responseData)
  } catch (error) {
    next(error)
  }
}


// Cập nhật Milestone
const updateMilestone = async (req, res, next) => {
  try {
    const milestoneId = req.params.milestoneId
    const userId = req.query.userId
    const data = req.body

    const updatedMilestone = await milestonesService.updateMilestone(milestoneId, userId, data)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: updatedMilestone
    })
  } catch (error) {
    next(error)
  }
}

// Xóa Milestone
const deleteMilestone = async (req, res, next) => {
  try {
    const milestoneId = req.params.milestoneId
    const userId = req.query.userId

    const deletedMilestone = await milestonesService.deleteMilestone(milestoneId, userId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: deletedMilestone
    })
  } catch (error) {
    next(error)
  }
}


const completeMilestone = async (req, res, next) => {
  try {
    const milestoneId = req.params.milestoneId
    const userId = req.query.userId

    const completedMilestone = await milestonesService.completeMilestone(milestoneId, userId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: completedMilestone
    })
  } catch (error) {
    next(error)
  }
}


const reorderMilestones = async (req, res, next) => {
  try {
    const goalId = req.params.goalId
    const userId = req.query.userId
    const milestoneIds = req.body.milestoneIds

    const reorderedMilestones = await milestonesService.reorderMilestones(goalId, userId, milestoneIds)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: reorderedMilestones
    })
  } catch (error) {
    next(error)
  }
}


export const milestonesController = {
  getMilestonesByGoalId,
  createMilestone,
  getMilestonesById,
  updateMilestone,
  deleteMilestone,
  completeMilestone,
  reorderMilestones
}
