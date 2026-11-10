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


export const milestonesRepository = {
  findMilestonesByGoalId
}