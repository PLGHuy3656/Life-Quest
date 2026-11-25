import prisma from '../../config/database.js'

// Lấy danh sách thử thách
const findChallenges = async ({ status, userId, myChallengesOnly } = {}) => {
  const where = {}

  if (status) {
    where.status = status
  }

  if (myChallengesOnly && userId) {
    where.members = {
      some: {
        userId
      }
    }
  }

  return await prisma.challenge.findMany({
    where,
    include: {
      creator: {
        select: { id: true, username: true, profile: true }
      },
      _count: {
        select: {
          members: true
        }
      }
    },
    orderBy: { startAt: 'desc' }
  })
}

// Chi tiết thử thách theo ID
const findChallengeById = async (challengeId) => {
  return await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      creator: {
        select: { id: true, username: true, profile: true }
      },
      members: {
        include: {
          user: {
            select: { id: true, username: true, profile: true }
          }
        }
      }
    }
  })
}

// Tạo thử thách mới kèm ghi nhận Creator là thành viên ACCEPTED
const createChallengeWithCreator = async (creatorId, data) => {
  return await prisma.$transaction(async (tx) => {
    const challenge = await tx.challenge.create({
      data: {
        creatorId,
        name: data.name,
        description: data.description || null,
        conditionType: data.conditionType,
        conditionConfig: data.conditionConfig,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        status: 'UPCOMING',
        rewardConfig: data.rewardConfig || null
      }
    })

    await tx.challengeMember.create({
      data: {
        challengeId: challenge.id,
        userId: creatorId,
        status: 'ACCEPTED',
        joinedAt: new Date(),
        progress: 0
      }
    })

    return await tx.challenge.findUnique({
      where: { id: challenge.id },
      include: {
        creator: {
          select: { id: true, username: true, profile: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, profile: true }
            }
          }
        }
      }
    })
  })
}

// Cập nhật thông tin thử thách
const updateChallenge = async (challengeId, data) => {
  return await prisma.challenge.update({
    where: { id: challengeId },
    data
  })
}

// Tìm thành viên trong thử thách
const findChallengeMember = async (challengeId, userId) => {
  return await prisma.challengeMember.findUnique({
    where: {
      challengeId_userId: {
        challengeId,
        userId
      }
    },
    include: {
      user: {
        select: { id: true, username: true, profile: true }
      }
    }
  })
}

// Tạo hoặc cập nhật thành viên tham gia thử thách
const upsertChallengeMember = async (challengeId, userId, data) => {
  return await prisma.challengeMember.upsert({
    where: {
      challengeId_userId: {
        challengeId,
        userId
      }
    },
    update: data,
    create: {
      challengeId,
      userId,
      ...data
    },
    include: {
      user: {
        select: { id: true, username: true, profile: true }
      }
    }
  })
}

// Lấy danh sách thành viên trong thử thách
const findChallengeMembers = async (challengeId) => {
  return await prisma.challengeMember.findMany({
    where: { challengeId },
    include: {
      user: {
        select: { id: true, username: true, profile: true }
      }
    },
    orderBy: { joinedAt: 'asc' }
  })
}

// Lấy bảng xếp hạng theo tiến độ / điểm số
const findLeaderboard = async (challengeId) => {
  return await prisma.challengeMember.findMany({
    where: {
      challengeId,
      status: 'ACCEPTED'
    },
    include: {
      user: {
        select: { id: true, username: true, profile: true }
      }
    },
    orderBy: [
      { progress: 'desc' },
      { joinedAt: 'asc' }
    ]
  })
}

export const challengesRepository = {
  findChallenges,
  findChallengeById,
  createChallengeWithCreator,
  updateChallenge,
  findChallengeMember,
  upsertChallengeMember,
  findChallengeMembers,
  findLeaderboard
}
