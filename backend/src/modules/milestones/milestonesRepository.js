import prisma from '../../config/database.js'


// Lấy danh sách Milestone theo GoalId
const findMilestonesByGoalId = async (goalId) => {
  return await prisma.milestone.findMany({
    where: {
      goalId
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

export const milestonesRepository = {
  findMilestonesByGoalId,
  getMaxPositionByGoalId,
  createMilestone,
  findMilestonesById
}