import { executionsRepository } from './executionsRepository.js'
import { questsRepository } from '../quests/questsRepository.js'
import { proofsRepository } from '../proofs/proofsRepository.js'
import prisma from '../../config/database.js'
import ApiError from '../../common/errors/ApiError.js'

// Lấy danh sách Execution của User theo bộ lọc
const getExecutions = async (userId, filters = {}) => {
  return await executionsRepository.findExecutions(userId, filters)
}

// Lấy chi tiết một Execution theo ID
const getExecutionById = async (userId, executionId) => {
  const execution = await executionsRepository.findExecutionById(executionId)

  if (!execution) {
    throw new ApiError(404, 'Execution not found', 'EXECUTION_NOT_FOUND')
  }

  if (execution.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to access this execution', 'EXECUTION_ACCESS_DENIED')
  }

  return execution
}

// Tạo mới một Execution (PLANNED hoặc bắt đầu ngay IN_PROGRESS)
const createExecution = async (userId, executionData) => {
  const quest = await questsRepository.findQuestById(executionData.questId)

  if (!quest || quest.deletedAt) {
    throw new ApiError(404, 'Quest not found', 'QUEST_NOT_FOUND')
  }

  if (quest.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to create an execution for this quest', 'QUEST_ACCESS_DENIED')
  }

  // Chỉ Quest đang ACTIVE mới được tạo Execution
  if (quest.status !== 'ACTIVE') {
    throw new ApiError(400, 'Only active quests can have executions created', 'QUEST_CANNOT_EXECUTE')
  }

  const startImmediately = executionData.startImmediately === true
  const status = startImmediately ? 'IN_PROGRESS' : 'PLANNED'
  const startedAt = startImmediately ? new Date() : null
  const scheduledAt = executionData.scheduledAt ? new Date(executionData.scheduledAt) : (startImmediately ? null : new Date())

  return await executionsRepository.createExecution({
    questId: executionData.questId,
    userId,
    scheduleId: executionData.scheduleId || null,
    status,
    scheduledAt,
    startedAt,
    progressValue: 0,
    durationSeconds: 0
  })
}

// Bắt đầu thực hiện Execution (PLANNED -> IN_PROGRESS)
const startExecution = async (userId, executionId) => {
  const execution = await getExecutionById(userId, executionId)

  if (execution.status === 'IN_PROGRESS') {
    return execution
  }

  if (execution.status !== 'PLANNED') {
    throw new ApiError(400, `Cannot start an execution with status ${execution.status}`, 'INVALID_STATE_TRANSITION')
  }

  return await executionsRepository.updateExecution(executionId, {
    status: 'IN_PROGRESS',
    startedAt: new Date()
  })
}

// Cập nhật tiến độ của Execution đang IN_PROGRESS
const updateProgress = async (userId, executionId, progressData) => {
  const execution = await getExecutionById(userId, executionId)

  if (execution.status !== 'IN_PROGRESS') {
    throw new ApiError(400, 'Progress can only be updated for executions in progress', 'EXECUTION_NOT_IN_PROGRESS')
  }

  const updateFields = {
    progressValue: progressData.progressValue
  }

  if (progressData.durationSeconds !== undefined) {
    updateFields.durationSeconds = progressData.durationSeconds
  }

  return await executionsRepository.updateExecution(executionId, updateFields)
}

// Kiểm tra điều kiện hoàn thành chỉ tiêu mục tiêu
const checkTargetMet = async (quest, execution) => {
  if (!quest.targetValue) {
    return true
  }

  const target = Number(quest.targetValue)

  switch (quest.type) {
    case 'SIMPLE':
      return true

    case 'QUANTITY':
    case 'PROGRESS':
      return Number(execution.progressValue) >= target

    case 'DURATION': {
      // Nếu targetUnit là minutes thì đổi ra giây
      const targetSec = quest.targetUnit === 'minutes' ? target * 60 : target
      return execution.durationSeconds >= targetSec || Number(execution.progressValue) >= target
    }

    case 'FOCUS': {
      const completedFocusSec = await executionsRepository.sumCompletedFocusSeconds(execution.id)
      const targetSec = quest.targetUnit === 'minutes' ? target * 60 : target
      return completedFocusSec >= targetSec || execution.durationSeconds >= targetSec
    }

    default:
      return true
  }
}

// Hoàn thành Execution (IN_PROGRESS -> COMPLETED)
const completeExecution = async (userId, executionId) => {
  const execution = await getExecutionById(userId, executionId)

  if (execution.status === 'COMPLETED') {
    throw new ApiError(409, 'Execution is already completed', 'EXECUTION_ALREADY_COMPLETED')
  }

  if (execution.status === 'PLANNED') {
    throw new ApiError(400, 'Execution must be started before it can be completed', 'EXECUTION_NOT_STARTED')
  }

  if (execution.status !== 'IN_PROGRESS') {
    throw new ApiError(400, `Cannot complete an execution with status ${execution.status}`, 'INVALID_STATE_TRANSITION')
  }

  const quest = execution.quest

  // 1. Kiểm tra chỉ tiêu mục tiêu
  const isTargetMet = await checkTargetMet(quest, execution)
  if (!isTargetMet) {
    throw new ApiError(400, 'Target condition for this quest has not been met yet', 'TARGET_NOT_MET')
  }

  // 2. Kiểm tra điều kiện bằng chứng bắt buộc (nếu có)
  if (quest.proofRequirement === 'REQUIRED') {
    const hasProof = await proofsRepository.hasValidProof(executionId)
    if (!hasProof) {
      throw new ApiError(400, 'This quest requires at least one proof before completion', 'PROOF_REQUIRED')
    }
  }

  // 3. Transaction hoàn thành và cộng thưởng
  return await prisma.$transaction(async (tx) => {
    // Cập nhật trạng thái Execution sang COMPLETED
    const completedExecution = await executionsRepository.updateExecution(
      executionId,
      {
        status: 'COMPLETED',
        completedAt: new Date()
      },
      tx
    )

    // Trao thưởng XP & Coins nếu có cấu hình
    const xpReward = quest.xpReward || 0
    const coinReward = quest.coinReward || 0

    if (xpReward > 0 || coinReward > 0) {
      await executionsRepository.awardRewards(userId, xpReward, coinReward, tx)
    }

    return {
      execution: completedExecution,
      rewardsEarned: {
        xp: xpReward,
        coin: coinReward
      }
    }
  })
}

// Bỏ qua Execution (PLANNED -> SKIPPED)
const skipExecution = async (userId, executionId) => {
  const execution = await getExecutionById(userId, executionId)

  if (execution.status !== 'PLANNED') {
    throw new ApiError(400, 'Only planned executions can be skipped', 'CANNOT_SKIP_EXECUTION')
  }

  return await executionsRepository.updateExecution(executionId, {
    status: 'SKIPPED'
  })
}

// Từ bỏ Execution giữa chừng (IN_PROGRESS -> ABANDONED)
const abandonExecution = async (userId, executionId) => {
  const execution = await getExecutionById(userId, executionId)

  if (execution.status !== 'IN_PROGRESS') {
    throw new ApiError(400, 'Only in-progress executions can be abandoned', 'CANNOT_ABANDON_EXECUTION')
  }

  return await executionsRepository.updateExecution(executionId, {
    status: 'ABANDONED',
    abandonedAt: new Date()
  })
}

export const executionsService = {
  getExecutions,
  getExecutionById,
  createExecution,
  startExecution,
  updateProgress,
  completeExecution,
  skipExecution,
  abandonExecution
}
