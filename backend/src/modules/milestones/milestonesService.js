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


// Lấy danh sách Milestone theo GoalId
const getMilestonesById = async (milestoneId, userId) => {
  // Tìm Milestone
  const milestone = await milestonesRepository.findMilestonesById(milestoneId)

  if (!milestone || milestone.deletedAt !== null) {
    throw new ApiError(404, 'Milestone not found', 'MILESTONE_NOT_FOUND')
  }

  // Tìm Goal chứa Milestone
  const goal = await goalsRepository.findGoalById(milestone.goalId)

  if (goal.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to access this milestone', 'GOAL_ACCESS_DENIED')
  }
  return milestone
}


// Cập nhật Milestone
const updateMilestone = async (milestoneId, userId, data) => {
  // Tìm Milestone
  const milestone = await milestonesRepository.findMilestonesById(milestoneId)

  if (!milestone) {
    throw new ApiError(404, 'Milestone not found', 'MILESTONE_NOT_FOUND')
  }

  // Tìm Goal chứa Milestone
  const goal = await goalsRepository.findGoalById(milestone.goalId)

  // Kiểm tra quyền sở hữu Goal
  if (goal.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to update this milestone', 'GOAL_ACCESS_DENIED')
  }

  // Không cho phép cập nhật Milestone thuộc Goal đã ARCHIVED
  if (goal.status === 'ARCHIVED') {
    throw new ApiError(403, 'Cannot update milestone of an archived goal', 'GOAL_ARCHIVED')
  }

  // Chỉ cập nhật title và description
  const updateData = {}

  if (data.title !== undefined) {
    updateData.title = data.title
  }

  if (data.description !== undefined) {
    updateData.description = data.description
  }

  return await milestonesRepository.updateMilestone(milestoneId, updateData)
}

const deleteMilestone = async (milestoneId, userId) => {
  // Tìm Milestone
  const milestone = await milestonesRepository.findMilestonesById(milestoneId)


  if (!milestone || milestone.deletedAt !== null) {
    throw new ApiError(404, 'Milestone not found', 'MILESTONE_NOT_FOUND')
  }

  // Tìm goal chứa milestone
  const goal = await goalsRepository.findGoalById(milestone.goalId)

  // Kiểm tra quyền sở hữu Goal
  if (goal.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to delete this milestone', 'GOAL_ACCESS_DENIED')
  }

  // Không cho phép xóa Milestone thuộc Goal đã ARCHIVED
  if (goal.status === 'ARCHIVED') {
    throw new ApiError(403, 'Cannot delete milestone of an archived goal', 'GOAL_ARCHIVED')
  }

  return await milestonesRepository.softDeleteMilestone(milestoneId)
}


export const milestonesService = {
  getMilestonesByGoalId,
  createMilestone,
  getMilestonesById,
  updateMilestone,
  deleteMilestone
}