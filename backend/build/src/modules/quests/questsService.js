import { questsRepository } from "./questsRepository.js";
import { goalsRepository } from "../goals/goalsRepository.js";
import { milestonesRepository } from "../milestones/milestonesRepository.js";
import { usersRepository } from "../users/usersRepository.js";
import ApiError from "../../common/errors/ApiError.js";
const getQuestsByUserId = async (userId, filters = {}) => {
  const quests = await questsRepository.findQuestsByUserId(userId, filters);
  return quests;
};

// Tạo mới Quest sau khi kiểm tra sự tồn tại của User, Goal và Milestone.
const createQuest = async questData => {
  // Kiểm tra User có tồn tại.
  const user = await usersRepository.findUserById(questData.userId);
  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }

  // Nếu Quest thuộc Goal thì kiểm tra Goal.
  if (questData.goalId) {
    const goal = await goalsRepository.findGoalById(questData.goalId);

    // Kiểm tra Goal có tồn tại.
    if (!goal) {
      throw new ApiError(404, 'Goal not found', 'GOAL_NOT_FOUND');
    }

    // Kiểm tra Goal có thuộc User.
    if (goal.userId !== questData.userId) {
      throw new ApiError(403, 'You do not have permission to access this goal', 'GOAL_ACCESS_DENIED');
    }

    // Chỉ Goal đang ACTIVE mới được tạo Quest.
    if (goal.status !== 'ACTIVE') {
      throw new ApiError(400, 'Only active goals can create quests', 'GOAL_CANNOT_CREATE_QUEST');
    }
  }

  // Nếu Quest thuộc Milestone thì kiểm tra Milestone.
  if (questData.milestoneId) {
    // Milestone bắt buộc phải có Goal.
    if (!questData.goalId) {
      throw new ApiError(400, 'Milestone requires a goal', 'MILESTONE_REQUIRES_GOAL');
    }
    const milestone = await milestonesRepository.findMilestoneById(questData.milestoneId);

    // Kiểm tra Milestone có tồn tại.
    if (!milestone) {
      throw new ApiError(404, 'Milestone not found', 'MILESTONE_NOT_FOUND');
    }

    // Kiểm tra Milestone có thuộc đúng Goal.
    if (milestone.goalId !== questData.goalId) {
      throw new ApiError(400, 'Milestone does not belong to the specified goal', 'MILESTONE_GOAL_MISMATCH');
    }
  }

  // Tạo Quest sau khi hoàn thành các bước kiểm tra.
  const createdQuest = await questsRepository.createQuest({
    userId: questData.userId,
    goalId: questData.goalId,
    milestoneId: questData.milestoneId,
    title: questData.title,
    description: questData.description,
    type: questData.type,
    priority: questData.priority,
    proofRequirement: questData.proofRequirement,
    targetValue: questData.targetValue,
    targetUnit: questData.targetUnit,
    estimatedDurationSeconds: questData.estimatedDurationSeconds,
    startAt: questData.startAt,
    dueAt: questData.dueAt
  });
  return createdQuest;
};

// Lấy thông tin một Quest theo ID.
const getQuestById = async (questId, userId) => {
  // Tìm Quest theo ID.
  const quest = await questsRepository.findQuestById(questId);

  // Kiểm tra Quest có tồn tại.
  if (!quest || quest.deletedAt) {
    throw new ApiError(404, 'Quest not found', 'QUEST_NOT_FOUND');
  }

  // Kiểm tra Quest có thuộc User.
  if (quest.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to access this quest', 'QUEST_ACCESS_DENIED');
  }
  return quest;
};
const updateQuest = async (questId, userId, questData) => {
  // Tìm Quest cần cập nhật.
  const quest = await questsRepository.findQuestById(questId);
  if (!quest || quest.deletedAt) {
    throw new ApiError(404, 'Quest not found', 'QUEST_NOT_FOUND');
  }

  // Kiểm tra quyền sở hữu.
  if (quest.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to access this quest', 'QUEST_ACCESS_DENIED');
  }

  // Không cho phép cập nhật Quest đã Archive.
  if (quest.status === 'ARCHIVED') {
    throw new ApiError(409, 'Archived quest cannot be updated', 'QUEST_CANNOT_UPDATE');
  }

  // Xác định Goal và Milestone cuối cùng sau khi cập nhật.
  const finalGoalId = Object.hasOwn(questData, 'goalId') ? questData.goalId : quest.goalId;
  const finalMilestoneId = Object.hasOwn(questData, 'milestoneId') ? questData.milestoneId : quest.milestoneId;

  // Nếu Milestone tồn tại thì bắt buộc phải có Goal.
  if (finalMilestoneId && !finalGoalId) {
    throw new ApiError(400, 'Milestone requires a goal', 'MILESTONE_REQUIRES_GOAL');
  }

  // Kiểm tra Goal khi Client thay đổi Goal.
  const goalChanged = Object.hasOwn(questData, 'goalId') && questData.goalId !== quest.goalId;
  if (goalChanged && finalGoalId) {
    const goal = await goalsRepository.findGoalById(finalGoalId);
    if (!goal) {
      throw new ApiError(404, 'Goal not found', 'GOAL_NOT_FOUND');
    }
    if (goal.userId !== userId) {
      throw new ApiError(403, 'You do not have permission to access this goal', 'GOAL_ACCESS_DENIED');
    }
    if (goal.status !== 'ACTIVE') {
      throw new ApiError(400, 'Only active goals can have quests assigned', 'GOAL_CANNOT_ASSIGN_QUEST');
    }
  }

  // Kiểm tra Milestone khi quan hệ Goal/Milestone thay đổi.
  const milestoneChanged = Object.hasOwn(questData, 'milestoneId') && questData.milestoneId !== quest.milestoneId;
  if (finalMilestoneId && (goalChanged || milestoneChanged)) {
    const milestone = await milestonesRepository.findMilestoneById(finalMilestoneId);
    if (!milestone) {
      throw new ApiError(404, 'Milestone not found', 'MILESTONE_NOT_FOUND');
    }
    if (milestone.goalId !== finalGoalId) {
      throw new ApiError(400, 'Milestone does not belong to the specified goal', 'MILESTONE_GOAL_MISMATCH');
    }
  }

  // Cập nhật Quest.
  const updatedQuest = await questsRepository.updateQuest(questId, questData);
  return updatedQuest;
};
const deleteQuest = async (questId, userId) => {
  // Tìm Quest cần cập nhật
  const quest = await questsRepository.findQuestById(questId);
  if (!quest || quest.deletedAt) {
    throw new ApiError(404, 'Quest not found', 'QUEST_NOT_FOUND');
  }
  if (quest.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to access this quest', 'QUEST_ACCESS_DENIED');
  }
  const deletedQuest = await questsRepository.deleteQuest(questId);
  return deletedQuest;
};
const pinQuest = async (questId, userId) => {
  // Tìm Quest cần cập nhật
  const quest = await questsRepository.findQuestById(questId);
  if (!quest || quest.deletedAt) {
    throw new ApiError(404, 'Quest not found', 'QUEST_NOT_FOUND');
  }
  if (quest.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to access this quest', 'QUEST_ACCESS_DENIED');
  }
  if (quest.isPinned) {
    throw new ApiError(409, 'Quest is already pinned', 'QUEST_ALREADY_PINNED');
  }
  if (quest.status === 'ARCHIVED') {
    throw new ApiError(409, 'Archived quest cannot be pinned', 'QUEST_CANNOT_PIN');
  }
  const pinnedQuest = await questsRepository.pinQuest(questId);
  return pinnedQuest;
};
const unpinQuest = async (questId, userId) => {
  const quest = await questsRepository.findQuestById(questId);
  if (!quest || quest.deletedAt) {
    throw new ApiError(404, 'Quest not found', 'QUEST_NOT_FOUND');
  }
  if (quest.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to unpin this quest', 'QUEST_ACCESS_DENIED');
  }
  if (!quest.isPinned) {
    throw new ApiError(409, 'Quest is not pinned', 'QUEST_NOT_PINNED');
  }
  const unpinnedQuest = await questsRepository.unpinQuest(questId);
  return unpinnedQuest;
};
const archiveQuest = async (questId, userId) => {
  const quest = await questsRepository.findQuestById(questId);
  if (!quest || quest.deletedAt) {
    throw new ApiError(404, 'Quest not found', 'QUEST_NOT_FOUND');
  }
  if (quest.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to archive this quest', 'QUEST_ACCESS_DENIED');
  }
  if (quest.status === 'ARCHIVED') {
    throw new ApiError(409, 'Quest is already archived', 'QUEST_ALREADY_ARCHIVED');
  }
  const archivedQuest = await questsRepository.archiveQuest(questId);
  return archivedQuest;
};
const restoreQuest = async (questId, userId) => {
  // Tìm Quest
  const quest = await questsRepository.findQuestById(questId);
  if (!quest || quest.deletedAt) {
    throw new ApiError(404, 'Quest not found', 'QUEST_NOT_FOUND');
  }

  // Kiểm tra quyền sở hữu
  if (quest.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to restore this quest', 'QUEST_ACCESS_DENIED');
  }

  // Chỉ cho phép Restore Quest đã Archive
  if (quest.status !== 'ARCHIVED') {
    throw new ApiError(409, 'Quest is not archived', 'QUEST_NOT_ARCHIVED');
  }
  const restoredQuest = await questsRepository.restoreQuest(questId);
  return restoredQuest;
};
export const questsService = {
  getQuestsByUserId,
  createQuest,
  getQuestById,
  updateQuest,
  deleteQuest,
  pinQuest,
  unpinQuest,
  archiveQuest,
  restoreQuest
};