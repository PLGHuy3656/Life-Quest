import prisma from '../../config/database.js'

const createDuo = async (data) => {
  return await prisma.duoPartnership.create({
    data,
    include: {
      user1: {
        select: { id: true, username: true, email: true }
      },
      user2: {
        select: { id: true, username: true, email: true }
      }
    }
  })
}

const findDuoById = async (id) => {
  return await prisma.duoPartnership.findUnique({
    where: { id },
    include: {
      user1: {
        select: { id: true, username: true, email: true }
      },
      user2: {
        select: { id: true, username: true, email: true }
      }
    }
  })
}

const findActiveDuosForUser = async (userId) => {
  return await prisma.duoPartnership.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: { in: ['ACTIVE', 'PENDING'] }
    },
    include: {
      user1: {
        select: { id: true, username: true, email: true }
      },
      user2: {
        select: { id: true, username: true, email: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

const countActiveDuosForUser = async (userId) => {
  return await prisma.duoPartnership.count({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: 'ACTIVE'
    }
  })
}

const updateDuo = async (id, data) => {
  return await prisma.duoPartnership.update({
    where: { id },
    data,
    include: {
      user1: {
        select: { id: true, username: true, email: true }
      },
      user2: {
        select: { id: true, username: true, email: true }
      }
    }
  })
}

const findActiveExpiringDuosForUser = async (userId, now) => {
  return await prisma.duoPartnership.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: 'ACTIVE',
      expiresAt: { gt: now }
    }
  })
}

export const duosRepository = {
  createDuo,
  findDuoById,
  findActiveDuosForUser,
  countActiveDuosForUser,
  updateDuo,
  findActiveExpiringDuosForUser
}
