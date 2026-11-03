import { usersRepository } from '../users/usersRepository.js'
import { goalsRepository } from './goalsRepository.js'
import ApiError from '../../common/errors/ApiError.js'


const getGoalsByUserId = async (userId) => {
  const goals = await goalsRepository.findGoalsByUserId(userId)


  return goals
}


const createGoal = async (goalData) => {
  const user = await usersRepository.findUserById(goalData.userId)

  if (!user) {
    throw new ApiError(403, 'User not found', 'USER_NOT_FOUND')
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
export const goalsService = {
  getGoalsByUserId,
  createGoal
}
