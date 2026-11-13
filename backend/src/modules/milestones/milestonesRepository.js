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

export const milestonesRepository = {
  findMilestonesByGoalId,
  getMaxPositionByGoalId,
  createMilestone,
  findMilestonesById,
  updateMilestone,
  softDeleteMilestone,
  completeMilestone
}