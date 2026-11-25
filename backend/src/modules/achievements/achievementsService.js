import { achievementsRepository } from './achievementsRepository.js'
import ApiError from '../../common/errors/ApiError.js'

// Lấy danh mục Huy hiệu hệ thống (ẩn mô tả nếu là huy hiệu ẩn chưa mở khóa)
const getAchievements = async (userId) => {
  const [achievements, userAchievements] = await Promise.all([
    achievementsRepository.findAllActiveAchievements(),
    achievementsRepository.findUserAchievements(userId)
  ])

  const unlockedMap = new Set(
    userAchievements
      .filter((ua) => ua.unlockedAt !== null)
      .map((ua) => ua.achievementId)
  )

  return achievements.map((ach) => {
    const isUnlocked = unlockedMap.has(ach.id)
    if (ach.isHidden && !isUnlocked) {
      return {
        id: ach.id,
        code: ach.code,
        name: 'Thành tựu ẩn',
        description: 'Tiếp tục khám phá và hoàn thành nhiệm vụ để mở khóa bí mật này',
        type: ach.type,
        isHidden: true,
        rewardXp: ach.rewardXp,
        rewardCoin: ach.rewardCoin,
        isUnlocked: false
      }
    }

    return {
      ...ach,
      isUnlocked
    }
  })
}

// Lấy chi tiết một Huy hiệu theo ID
const getAchievementById = async (userId, achievementId) => {
  const achievement = await achievementsRepository.findAchievementById(achievementId)

  if (!achievement || !achievement.isActive) {
    throw new ApiError(404, 'Achievement not found', 'ACHIEVEMENT_NOT_FOUND')
  }

  const userAchievement = await achievementsRepository.findUserAchievement(userId, achievementId)
  const isUnlocked = userAchievement?.unlockedAt !== null

  if (achievement.isHidden && !isUnlocked) {
    return {
      id: achievement.id,
      code: achievement.code,
      name: 'Thành tựu ẩn',
      description: 'Tiếp tục khám phá và hoàn thành nhiệm vụ để mở khóa bí mật này',
      type: achievement.type,
      isHidden: true,
      rewardXp: achievement.rewardXp,
      rewardCoin: achievement.rewardCoin,
      isUnlocked: false,
      progress: Number(userAchievement?.progress || 0)
    }
  }

  return {
    ...achievement,
    isUnlocked,
    progress: Number(userAchievement?.progress || 0),
    unlockedAt: userAchievement?.unlockedAt || null
  }
}

// Lấy toàn bộ danh sách Huy hiệu kèm tiến trình của User hiện tại
const getMyAchievements = async (userId) => {
  const [achievements, userAchievements] = await Promise.all([
    achievementsRepository.findAllActiveAchievements(),
    achievementsRepository.findUserAchievements(userId)
  ])

  const userProgressMap = new Map(
    userAchievements.map((ua) => [ua.achievementId, ua])
  )

  return achievements.map((ach) => {
    const userAch = userProgressMap.get(ach.id)
    const isUnlocked = userAch?.unlockedAt !== null

    if (ach.isHidden && !isUnlocked) {
      return {
        id: ach.id,
        code: ach.code,
        name: 'Thành tựu ẩn',
        description: 'Tiếp tục khám phá và hoàn thành nhiệm vụ để mở khóa bí mật này',
        type: ach.type,
        isHidden: true,
        rewardXp: ach.rewardXp,
        rewardCoin: ach.rewardCoin,
        progress: Number(userAch?.progress || 0),
        isUnlocked: false,
        unlockedAt: null
      }
    }

    return {
      id: ach.id,
      code: ach.code,
      name: ach.name,
      description: ach.description,
      iconMedia: ach.iconMedia,
      type: ach.type,
      isHidden: ach.isHidden,
      rewardXp: ach.rewardXp,
      rewardCoin: ach.rewardCoin,
      progress: Number(userAch?.progress || 0),
      isUnlocked,
      unlockedAt: userAch?.unlockedAt || null
    }
  })
}

export const achievementsService = {
  getAchievements,
  getAchievementById,
  getMyAchievements
}
