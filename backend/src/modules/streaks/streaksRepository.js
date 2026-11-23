import prisma from '../../config/database.js'

const findStreakByUserId = async (userId) => {
  return await prisma.userStreak.findUnique({
    where: { userId }
  })
}

const createStreak = async (data) => {
  return await prisma.userStreak.create({
    data
  })
}

const updateStreak = async (userId, data) => {
  return await prisma.userStreak.update({
    where: { userId },
    data
  })
}

export const streaksRepository = {
  findStreakByUserId,
  createStreak,
  updateStreak
}
