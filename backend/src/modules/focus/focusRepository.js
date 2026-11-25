import prisma from '../../config/database.js'

// Tìm kiếm FocusSession theo ID kèm thông tin Execution và Quest
const findFocusSessionById = async (focusSessionId, tx) => {
  const db = tx || prisma
  return await db.focusSession.findUnique({
    where: {
      id: focusSessionId
    },
    include: {
      execution: {
        include: {
          quest: true
        }
      },
      interruptions: {
        orderBy: {
          startedAt: 'desc'
        }
      }
    }
  })
}

// Tìm phiên Focus đang ACTIVE của User để đảm bảo quy tắc đơn phiên
const findActiveFocusSessionByUser = async (userId, tx) => {
  const db = tx || prisma
  return await db.focusSession.findFirst({
    where: {
      status: 'ACTIVE',
      execution: {
        userId
      }
    },
    include: {
      execution: true
    }
  })
}

// Lấy toàn bộ phiên Focus của một Execution
const findFocusSessionsByExecutionId = async (executionId, tx) => {
  const db = tx || prisma
  return await db.focusSession.findMany({
    where: {
      executionId
    },
    include: {
      interruptions: {
        orderBy: {
          startedAt: 'desc'
        }
      }
    },
    orderBy: {
      startedAt: 'desc'
    }
  })
}

// Tạo mới một phiên Focus
const createFocusSession = async (executionId, tx) => {
  const db = tx || prisma
  return await db.focusSession.create({
    data: {
      executionId,
      status: 'ACTIVE',
      startedAt: new Date(),
      durationSeconds: 0
    },
    include: {
      interruptions: true
    }
  })
}

// Cập nhật thông tin phiên Focus
const updateFocusSession = async (focusSessionId, data, tx) => {
  const db = tx || prisma
  return await db.focusSession.update({
    where: {
      id: focusSessionId
    },
    data,
    include: {
      interruptions: true
    }
  })
}

// Tạo bản ghi gián đoạn phiên Focus
const createInterruption = async (interruptionData, tx) => {
  const db = tx || prisma
  return await db.focusInterruption.create({
    data: {
      focusSessionId: interruptionData.focusSessionId,
      startedAt: interruptionData.startedAt || new Date(),
      endedAt: interruptionData.endedAt || null,
      reason: interruptionData.reason || null,
      source: interruptionData.source || null
    }
  })
}

// Cộng dồn thời lượng phiên Focus vào Execution và cập nhật tiến độ nếu Quest loại FOCUS
const accumulateToExecution = async (executionId, sessionDurationSeconds, isFocusQuest, tx) => {
  const db = tx || prisma
  const currentExecution = await db.questExecution.findUnique({
    where: { id: executionId }
  })

  if (!currentExecution) return

  const updatedDuration = (currentExecution.durationSeconds || 0) + sessionDurationSeconds
  const updateData = {
    durationSeconds: updatedDuration
  }

  // Nếu Quest loại FOCUS thì cập nhật cả progressValue
  if (isFocusQuest) {
    updateData.progressValue = Number(currentExecution.progressValue || 0) + sessionDurationSeconds
  }

  return await db.questExecution.update({
    where: { id: executionId },
    data: updateData
  })
}

export const focusRepository = {
  findFocusSessionById,
  findActiveFocusSessionByUser,
  findFocusSessionsByExecutionId,
  createFocusSession,
  updateFocusSession,
  createInterruption,
  accumulateToExecution
}
