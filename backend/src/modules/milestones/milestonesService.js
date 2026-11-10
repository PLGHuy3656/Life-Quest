import { milestonesRepository } from './milestonesRepository.js'
import { goalsRepository } from '../goals/goalsRepository.js'
import ApiError from '../../common/errors/ApiError.js'

// Lấy danh sách Milestone theo GoalId
const getMilestonesByGoalId = async (goalId, userId) => {
  // Kiểm tra Goal có tồn tại không
  const goal = await goalsRepository.findGoalById(goalId)

  if (!goal) {
    throw new ApiError(404, 'Goal not found', 'GOAL_NOT_FOUND')
  }

  // Kiểm tra quyền sở hữu Goal
  if (goal.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to access this goal', 'GOAL_ACCESS_DENIED')
  }

  const milestones = await milestonesRepository.findMilestonesByGoalId(goalId)
  return milestones
}


export const milestonesService = {
  getMilestonesByGoalId
}