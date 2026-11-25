import prisma from '../../config/database.js'

// Lấy toàn bộ danh mục Huy hiệu đang active trong hệ thống
const findAllActiveAchievements = async (tx) => {
  const db = tx || prisma
  return await db.achievement.findMany({
    where: {
      isActive: true
    },
    include: {
      iconMedia: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })
}

// Tìm kiếm Huy hiệu theo ID
const findAchievementById = async (achievementId, tx) => {
  const db = tx || prisma
  return await db.achievement.findUnique({
    where: {
      id: achievementId
    },
    include: {
      iconMedia: true
    }
  })
}

// Lấy danh sách tiến trình Huy hiệu của một User
const findUserAchievements = async (userId, tx) => {
  const db = tx || prisma
  return await db.userAchievement.findMany({
    where: {
      userId
    },
    include: {
      achievement: {
        include: {
          iconMedia: true
        }
      }
    }
  })
}

// Tìm kiếm tiến trình của User đối với một Huy hiệu cụ thể
const findUserAchievement = async (userId, achievementId, tx) => {
  const db = tx || prisma
  return await db.userAchievement.findUnique({
    where: {
      userId_achievementId: {
        userId,
        achievementId
      }
    }
  })
}

// Mở khóa Huy hiệu cho User
const unlockAchievement = async (userId, achievementId, tx) => {
  const db = tx || prisma
  return await db.userAchievement.upsert({
    where: {
      userId_achievementId: {
        userId,
        achievementId
      }
    },
    update: {
      unlockedAt: new Date(),
      progress: 100
    },
    create: {
      userId,
      achievementId,
      progress: 100,
      unlockedAt: new Date()
    }
  })
}

export const achievementsRepository = {
  findAllActiveAchievements,
  findAchievementById,
  findUserAchievements,
  findUserAchievement,
  unlockAchievement
}
