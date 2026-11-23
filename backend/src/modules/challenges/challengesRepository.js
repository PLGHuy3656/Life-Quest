import prisma from '../../config/database.js'

const findActiveChallenges = async (now = new Date()) => {
  return await prisma.challenge.findMany({
    where: {
      isActive: true,
      endAt: { gte: now }
    },
    orderBy: {
      startAt: 'asc'
    }
  })
}

const createChallenge = async (data) => {
  return await prisma.challenge.create({
    data
  })
}

const findChallengeById = async (id) => {
  return await prisma.challenge.findUnique({
    where: { id }
  })
}

const findUserParticipations = async (userId, challengeIds) => {
  if (!userId || !challengeIds.length) return []
  return await prisma.challengeParticipant.findMany({
    where: {
      userId,
      challengeId: { in: challengeIds }
    }
  })
}

const findParticipant = async (challengeId, userId) => {
  return await prisma.challengeParticipant.findUnique({
    where: {
      challengeId_userId: {
        challengeId,
        userId
      }
    }
  })
}

const createParticipant = async (data) => {
  return await prisma.challengeParticipant.create({
    data,
    include: {
      challenge: true
    }
  })
}

const getLeaderboard = async (challengeId) => {
  return await prisma.challengeParticipant.findMany({
    where: { challengeId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    },
    orderBy: [
      { currentProgress: 'desc' },
      { updatedAt: 'asc' }
    ]
  })
}

const findUserActiveChallenges = async (userId, now = new Date()) => {
  return await prisma.challengeParticipant.findMany({
    where: {
      userId,
      isCompleted: false,
      challenge: {
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now }
      }
    },
    include: {
      challenge: true
    }
  })
}

export const challengesRepository = {
  findActiveChallenges,
  createChallenge,
  findChallengeById,
  findUserParticipations,
  findParticipant,
  createParticipant,
  getLeaderboard,
  findUserActiveChallenges
}
