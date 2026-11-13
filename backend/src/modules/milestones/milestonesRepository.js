import prisma from '../../config/database.js'


// Lấy danh sách Milestone theo GoalId
const findMilestonesByGoalId = async (goalId) => {
  return await prisma.milestone.findMany({
    where: {
      goalId,
      deletedAt: null
    },
    orderBy: {
      position: 'asc'
    }
  })
}

const findAllMilestonesByGoalId = async (goalId, tx) => {
  return await tx.milestone.findMany({
    where: {
      goalId
    },
    orderBy: {
      position: 'asc'
    }
  })
}


const updateDeletedMilestonePositions = async (milestoneId, position, tx) => {
  return await tx.milestone.update({
    where: {
      id: milestoneId
    },
    data: {
      position
    }
  })
}

// Lấy position lớn nhất của Milestone trong Goal
const getMaxPositionByGoalId = async (goalId, tx) => {
  const result = await tx.milestone.aggregate({
    where: {
      goalId
    },
    _max: {
      position: true
    }
  })

  return result._max.position
}

// Tạo mới Milestone có transaction
const createMilestone = async (milestoneData, tx) => {
  return await tx.milestone.create({
    data: milestoneData
  })
}


const findMilestonesById = async (milestoneId) => {
  return await prisma.milestone.findUnique({
    where: {
      id: milestoneId
    }
  })
}

// Cập nhật thông tin Milestone
const updateMilestone = async (milestoneId, data) => {
  return await prisma.milestone.update({
    where: {
      id: milestoneId
    },
    data: data
  })
}


// Xóa mềm Milestone
const softDeleteMilestone = async (milestoneId) => {
  return await prisma.milestone.update({
    where: {
      id: milestoneId
    },
    data: {
      deletedAt: new Date()
    }
  })
}


// Đánh dấu Milestone đã hoàn thành
const completeMilestone = async (milestoneId) => {
  return await prisma.milestone.update({
    where: {
      id: milestoneId
    },
    data: {
      status: 'COMPLETED',
      completedAt: new Date()
    }
  })
}


// Sắp xếp lại thứ tự Milestone trong Goal
const reorderMilestones = async (goalId, milestoneIds, tx) => {
  // Lấy tất cả Milestone của Goal
  const allMilestones = await findAllMilestonesByGoalId(goalId, tx)

  // Lấy các Milestone đã bị soft delete
  const deletedMilestones = allMilestones.filter((milestone) => milestone.deletedAt !== null)

  // Xác định vị trí tạm bắt đầu, nhỏ hơn position nhỏ nhất hiện tại
  const minPosition = allMilestones.length > 0 ? allMilestones[0].position : 0

  const temporaryPositionBase = Math.min(0, minPosition) - 1

  // Cập nhật position tạm thời cho Milestone đã xóa
  await Promise.all(
    deletedMilestones.map((milestone, milestoneIndex) => {
      const temporaryPosition = temporaryPositionBase - milestoneIndex

      return updateDeletedMilestonePositions(milestone.id, temporaryPosition, tx)
    })
  )

  // Cập nhật position tạm thời cho Milestone active
  await Promise.all(
    milestoneIds.map((milestoneId, milestoneIndex) => {
      const temporaryPosition = temporaryPositionBase - deletedMilestones.length - milestoneIndex

      return tx.milestone.update({
        where: {
          id: milestoneId
        },
        data: {
          position: temporaryPosition
        }
      })
    })
  )

  // Cập nhật position chính thức
  const reorderedMilestones = await Promise.all(
    milestoneIds.map((milestoneId, milestoneIndex) => {
      const newPosition = milestoneIndex + 1

      return tx.milestone.update({
        where: {
          id: milestoneId
        },
        data: {
          position: newPosition
        }
      })
    })
  )

  return reorderedMilestones
}


export const milestonesRepository = {
  findMilestonesByGoalId,
  findAllMilestonesByGoalId,
  updateDeletedMilestonePositions,
  getMaxPositionByGoalId,
  createMilestone,
  findMilestonesById,
  updateMilestone,
  softDeleteMilestone,
  completeMilestone,
  reorderMilestones
}