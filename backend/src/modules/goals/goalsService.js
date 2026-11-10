import { usersRepository } from '../users/usersRepository.js'
import { goalsRepository } from './goalsRepository.js'
import ApiError from '../../common/errors/ApiError.js'

// Lấy danh sách toàn bộ mục tiêu của một người dùng.
const getGoalsByUserId = async (userId) => {
  const goals = await goalsRepository.findGoalsByUserId(userId)


  return goals
}

// Lấy thông tin chi tiết một mục tiêu theo ID và xác thực quyền sở hữu của người dùng.
const getGoalById = async (goalId, userId) => {
  const goal = await goalsRepository.findGoalById(goalId)


  // Kiểm tra Goal có tồn tại
  if (!goal) {
    throw new ApiError(404, 'Goal not found', 'GOAL_NOT_FOUND')
  }

  // Kiểm tra Goal có thuộc User
  if (goal.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to access this goal', 'GOAL_ACCESS_DENIED')
  }


  return goal
}


// Tạo mới mục tiêu sau khi kiểm tra sự tồn tại của người dùng và tính hợp lệ của khoảng thời gian.
const createGoal = async (goalData) => {
  const user = await usersRepository.findUserById(goalData.userId)

  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
  }

  const startDate = new Date(goalData.startDate)
  const dueDate = new Date(goalData.dueDate)

  if (startDate >= dueDate) {
    throw new ApiError(400, 'Start date must be before due date', 'INVALID_GOAL_DATE_RANGE')
  }

  const goal = await goalsRepository.createGoal({
    userId: goalData.userId,
    title: goalData.title,
    description: goalData.description,
    startDate,
    dueDate
  })

  return goal
}

// Cập nhật mục tiêu theo ID có kiểm tra quyền sở hữu và ràng buộc trạng thái.
const updateGoal = async (goalId, userId, updateData) => {
  // Kiểm tra Goal tồn tại và User có quyền truy cập
  const goal = await getGoalById(goalId, userId)

  if (goal.status === 'COMPLETED' || goal.status === 'ARCHIVED') {
    throw new ApiError(400, 'Cannot update a completed or archived goal', 'GOAL_CANNOT_BE_UPDATED')
  }


  // Xác định ngày mới, nếu không gửi thì giữ ngày hiện tại
  const startDate = updateData.startDate ? new Date(updateData.startDate) : goal.startDate
  const dueDate = updateData.dueDate ? new Date(updateData.dueDate) : goal.dueDate


  // Kiểm tra khoảng thời gian của Goal
  if (startDate >= dueDate) {
    throw new ApiError(400, 'Start date must be before due date', 'INVALID_GOAL_DATE_RANGE')
  }


  const validUpdateData = {
    title: updateData.title,
    description: updateData.description,
    startDate: updateData.startDate ? startDate : undefined,
    dueDate: updateData.dueDate ? dueDate : undefined
  }
  const updatedGoal = await goalsRepository.updateGoal(goalId, validUpdateData)

  return updatedGoal
}

const archiveGoal = async (goalId, userId) => {
  // Kiểm tra Goal tồn tại và User có quyền truy cập
  const goal = await getGoalById(goalId, userId)

  if (goal.status === 'ARCHIVED') {
    throw new ApiError(400, 'Goal is already archived', 'GOAL_ALREADY_ARCHIVED')
  }

  if (goal.status === 'COMPLETED') {
    throw new ApiError(400, 'Cannot archived a completed goal', 'GOAL_CANNOT_BE_ARCHIVED')
  }
  const archivedGoal = await goalsRepository.archiveGoal(goalId)
  return archivedGoal
}


const pauseGoal = async (goalId, userId) => {
  const goal = await getGoalById(goalId, userId)

  if (goal.status !== 'ACTIVE') {
    throw new ApiError(400, 'Only active goals can be paused', 'GOAL_CANNOT_BE_PAUSED')
  }
  const pausedGoal = await goalsRepository.pauseGoal(goalId)
  return pausedGoal
}


export const goalsService = {
  getGoalsByUserId,
  getGoalById,
  createGoal,
  updateGoal,
  archiveGoal,
  pauseGoal
}
