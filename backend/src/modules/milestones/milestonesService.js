import { milestonesRepository } from './milestonesRepository.js'
import { goalsRepository } from '../goals/goalsRepository.js'
import ApiError from '../../common/errors/ApiError.js'
import prisma from '../../config/database.js'

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


const createMilestone = async (goalId, userId, milestoneData) => {
  const milestone = await prisma.$transaction(async (tx) => {
    // Khóa Goal để các request tạo Milestone phải thực hiện lần lượt
    await goalsRepository.lockGoalForUpdate(goalId, tx)

    // Kiểm tra Goal có tồn tại không
    const goal = await goalsRepository.findGoalById(goalId, tx)

    if (!goal) {
      throw new ApiError(404, 'Goal not found', 'GOAL_NOT_FOUND')
    }

    // Kiểm tra quyền sở hữu Goal
    if (goal.userId !== userId) {
      throw new ApiError(403, 'You do not have permission to access this goal', 'GOAL_ACCESS_DENIED')
    }

    // Kiểm tra trạng thái Goal
    if (goal.status !== 'ACTIVE') {
      throw new ApiError(400, 'Cannot create milestone for a non-active goal', 'GOAL_NOT_ACTIVE')
    }

    // Lấy vị trí lớn nhất trong transaction
    const maxPosition = await milestonesRepository.getMaxPositionByGoalId(goalId, tx)

    const position = maxPosition === null ? 1 : maxPosition + 1

    // Tạo Milestone trong transaction
    return await milestonesRepository.createMilestone({
      goalId,
      title: milestoneData.title,
      description: milestoneData.description,
      position
    }, tx)
  })

  return milestone
}


export const milestonesService = {
  getMilestonesByGoalId,
  createMilestone
}