import { focusRepository } from './focusRepository.js'
import { executionsRepository } from '../executions/executionsRepository.js'
import prisma from '../../config/database.js'
import ApiError from '../../common/errors/ApiError.js'

// Lấy thông tin FocusSession và kiểm tra quyền sở hữu
const getFocusSessionWithAuth = async (userId, focusSessionId) => {
  const session = await focusRepository.findFocusSessionById(focusSessionId)

  if (!session) {
    throw new ApiError(404, 'Focus session not found', 'FOCUS_SESSION_NOT_FOUND')
  }

  if (session.execution.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to access this focus session', 'FOCUS_ACCESS_DENIED')
  }

  return session
}

// Khởi tạo và bắt đầu một phiên Focus mới cho Execution
const createFocusSession = async (userId, executionId) => {
  const execution = await executionsRepository.findExecutionById(executionId)

  if (!execution) {
    throw new ApiError(404, 'Execution not found', 'EXECUTION_NOT_FOUND')
  }

  if (execution.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to start a focus session for this execution', 'EXECUTION_ACCESS_DENIED')
  }

  if (['COMPLETED', 'SKIPPED', 'ABANDONED'].includes(execution.status)) {
    throw new ApiError(400, `Cannot focus on an execution with status ${execution.status}`, 'CANNOT_FOCUS_FINISHED_EXECUTION')
  }

  // Tự động chuyển Execution sang IN_PROGRESS nếu đang PLANNED
  if (execution.status === 'PLANNED') {
    await executionsRepository.updateExecution(executionId, {
      status: 'IN_PROGRESS',
      startedAt: new Date()
    })
  }

  // Quy tắc Single Active Session: Kiểm tra user có phiên focus nào đang ACTIVE không
  const activeSession = await focusRepository.findActiveFocusSessionByUser(userId)
  if (activeSession) {
    throw new ApiError(409, 'You already have an active focus session in progress', 'ACTIVE_FOCUS_SESSION_EXISTS')
  }

  return await focusRepository.createFocusSession(executionId)
}

// Lấy danh sách các phiên Focus của một Execution
const getFocusSessionsByExecutionId = async (userId, executionId) => {
  const execution = await executionsRepository.findExecutionById(executionId)

  if (!execution) {
    throw new ApiError(404, 'Execution not found', 'EXECUTION_NOT_FOUND')
  }

  if (execution.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to view focus sessions for this execution', 'EXECUTION_ACCESS_DENIED')
  }

  return await focusRepository.findFocusSessionsByExecutionId(executionId)
}

// Bắt đầu hoặc tiếp tục phiên Focus
const startFocusSession = async (userId, focusSessionId) => {
  const session = await getFocusSessionWithAuth(userId, focusSessionId)

  if (session.status === 'ACTIVE') {
    return session
  }

  if (session.status === 'PAUSED') {
    return await resumeFocusSession(userId, focusSessionId)
  }

  throw new ApiError(400, `Cannot start a focus session with status ${session.status}`, 'INVALID_STATE_TRANSITION')
}

// Tạm dừng phiên Focus (ACTIVE -> PAUSED)
const pauseFocusSession = async (userId, focusSessionId) => {
  const session = await getFocusSessionWithAuth(userId, focusSessionId)

  if (session.status !== 'ACTIVE') {
    throw new ApiError(400, 'Only active focus sessions can be paused', 'SESSION_NOT_ACTIVE')
  }

  const now = new Date()
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - new Date(session.startedAt).getTime()) / 1000))
  const newDuration = (session.durationSeconds || 0) + elapsedSeconds

  return await focusRepository.updateFocusSession(focusSessionId, {
    status: 'PAUSED',
    durationSeconds: newDuration,
    startedAt: now
  })
}

// Tiếp tục phiên Focus (PAUSED -> ACTIVE)
const resumeFocusSession = async (userId, focusSessionId) => {
  const session = await getFocusSessionWithAuth(userId, focusSessionId)

  if (session.status !== 'PAUSED') {
    throw new ApiError(400, 'Only paused focus sessions can be resumed', 'SESSION_NOT_PAUSED')
  }

  // Kiểm tra không có phiên ACTIVE khác
  const activeSession = await focusRepository.findActiveFocusSessionByUser(userId)
  if (activeSession && activeSession.id !== focusSessionId) {
    throw new ApiError(409, 'You already have another active focus session', 'ACTIVE_FOCUS_SESSION_EXISTS')
  }

  return await focusRepository.updateFocusSession(focusSessionId, {
    status: 'ACTIVE',
    startedAt: new Date()
  })
}

// Ghi nhận gián đoạn phiên Focus
const interruptFocusSession = async (userId, focusSessionId, interruptData) => {
  const session = await getFocusSessionWithAuth(userId, focusSessionId)

  if (!['ACTIVE', 'PAUSED'].includes(session.status)) {
    throw new ApiError(400, `Cannot interrupt a focus session with status ${session.status}`, 'INVALID_STATE_TRANSITION')
  }

  const now = new Date()

  // Tạo bản ghi gián đoạn
  await focusRepository.createInterruption({
    focusSessionId,
    startedAt: now,
    endedAt: interruptData.durationSeconds ? new Date(now.getTime() + interruptData.durationSeconds * 1000) : null,
    reason: interruptData.reason,
    source: interruptData.source
  })

  // Nếu session đang ACTIVE thì tự động chuyển sang PAUSED
  if (session.status === 'ACTIVE') {
    return await pauseFocusSession(userId, focusSessionId)
  }

  return await focusRepository.findFocusSessionById(focusSessionId)
}

// Hoàn tất phiên Focus (ACTIVE | PAUSED -> COMPLETED)
const completeFocusSession = async (userId, focusSessionId) => {
  const session = await getFocusSessionWithAuth(userId, focusSessionId)

  if (session.status === 'COMPLETED') {
    throw new ApiError(409, 'Focus session is already completed', 'SESSION_ALREADY_COMPLETED')
  }

  if (session.status === 'ABANDONED') {
    throw new ApiError(400, 'Cannot complete an abandoned focus session', 'CANNOT_COMPLETE_ABANDONED_SESSION')
  }

  const now = new Date()
  let finalDuration = session.durationSeconds || 0

  if (session.status === 'ACTIVE') {
    const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - new Date(session.startedAt).getTime()) / 1000))
    finalDuration += elapsedSeconds
  }

  const isFocusQuest = session.execution?.quest?.type === 'FOCUS'

  return await prisma.$transaction(async (tx) => {
    // 1. Cập nhật trạng thái session sang COMPLETED
    const completedSession = await focusRepository.updateFocusSession(
      focusSessionId,
      {
        status: 'COMPLETED',
        endedAt: now,
        durationSeconds: finalDuration
      },
      tx
    )

    // 2. Tự động cộng dồn thời lượng vào Execution
    await focusRepository.accumulateToExecution(
      session.executionId,
      finalDuration,
      isFocusQuest,
      tx
    )

    return completedSession
  })
}

// Từ bỏ phiên Focus (ACTIVE | PAUSED -> ABANDONED)
const abandonFocusSession = async (userId, focusSessionId) => {
  const session = await getFocusSessionWithAuth(userId, focusSessionId)

  if (session.status === 'COMPLETED') {
    throw new ApiError(400, 'Cannot abandon an already completed focus session', 'CANNOT_ABANDON_COMPLETED_SESSION')
  }

  return await focusRepository.updateFocusSession(focusSessionId, {
    status: 'ABANDONED',
    endedAt: new Date()
  })
}

export const focusService = {
  createFocusSession,
  getFocusSessionsByExecutionId,
  startFocusSession,
  pauseFocusSession,
  resumeFocusSession,
  interruptFocusSession,
  completeFocusSession,
  abandonFocusSession
}
