import { questsRepository } from './questsRepository.js'
import { goalsRepository } from '../goals/goalsRepository.js'
import { milestonesRepository } from '../milestones/milestonesRepository.js'
import { usersRepository } from '../users/usersRepository.js'
import ApiError from '../../common/errors/ApiError.js'


const getQuestsByUserId = async (userId) => {
  const quests = await questsRepository.findQuestsByUserId(userId)

  return quests
}

// Tạo mới Quest sau khi kiểm tra sự tồn tại của User, Goal và Milestone.
const createQuest = async (questData) => {
  // Kiểm tra User có tồn tại.
  const user = await usersRepository.findUserById(questData.userId)

  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
  }


  // Nếu Quest thuộc Goal thì kiểm tra Goal.
  if (questData.goalId) {
    const goal = await goalsRepository.findGoalById(questData.goalId)

    // Kiểm tra Goal có tồn tại.
    if (!goal) {
      throw new ApiError(404, 'Goal not found', 'GOAL_NOT_FOUND')
    }

    // Kiểm tra Goal có thuộc User.
    if (goal.userId !== questData.userId) {
      throw new ApiError(403, 'You do not have permission to access this goal', 'GOAL_ACCESS_DENIED')
    }

    // Chỉ Goal đang ACTIVE mới được tạo Quest.
    if (goal.status !== 'ACTIVE') {
      throw new ApiError(400, 'Only active goals can create quests', 'GOAL_CANNOT_CREATE_QUEST')
    }
  }


  // Nếu Quest thuộc Milestone thì kiểm tra Milestone.
  if (questData.milestoneId) {
    // Milestone bắt buộc phải có Goal.
    if (!questData.goalId) {
      throw new ApiError(400, 'Milestone requires a goal', 'MILESTONE_REQUIRES_GOAL')
    }

    const milestone = await milestonesRepository.findMilestoneById(questData.milestoneId)

    // Kiểm tra Milestone có tồn tại.
    if (!milestone) {
      throw new ApiError(404, 'Milestone not found', 'MILESTONE_NOT_FOUND')
    }

    // Kiểm tra Milestone có thuộc đúng Goal.
    if (milestone.goalId !== questData.goalId) {
      throw new ApiError(400, 'Milestone does not belong to the specified goal', 'MILESTONE_GOAL_MISMATCH')
    }
  }


  // Tạo Quest sau khi hoàn thành các bước kiểm tra.
  const createdQuest = await questsRepository.createQuest({
    userId: questData.userId,
    goalId: questData.goalId,
    milestoneId: questData.milestoneId,
    title: questData.title,
    description: questData.description
  })

  return createdQuest
}

// Lấy thông tin một Quest theo ID.
const getQuestById = async (questId, userId) => {
  // Tìm Quest theo ID.
  const quest = await questsRepository.findQuestById(questId)

  // Kiểm tra Quest có tồn tại.
  if (!quest) {
    throw new ApiError(404, 'Quest not found', 'QUEST_NOT_FOUND')
  }

  // Kiểm tra Quest có thuộc User.
  if (quest.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to access this quest', 'QUEST_ACCESS_DENIED')
  }

  return quest
}


const updateQuest = async (questId, userId, questData) => {
  // Tìm Quest cần cập nhật
  const quest = await questsRepository.findQuestById(questId)

  if (!quest) {
    throw new ApiError(404, 'Quest not found', 'QUEST_NOT_FOUND')
  }


  if (quest.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to access this quest', 'QUEST_ACCESS_DENIED')
  }

  // Cập nhật quest
  const updateQuest = await questsRepository.updateQuest(questId, questData)

  return updateQuest
}


export const questsService = {
  getQuestsByUserId,
  createQuest,
  getQuestById,
  updateQuest
}