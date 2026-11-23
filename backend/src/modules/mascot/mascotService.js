import { mascotRepository } from './mascotRepository.js'
import { usersRepository } from '../users/usersRepository.js'
import { resolveEntitlement, assertTierAccess } from '../../common/utils/entitlement.js'
import ApiError from '../../common/errors/ApiError.js'
import streaksService from '../streaks/streaksService.js'

const getModels = async () => {
  return await mascotRepository.findAllModels()
}

const getMascotState = async (modelCode = 'FOX_V2', placement = 'DASHBOARD', userId = null) => {
  let entitlement = resolveEntitlement(null)
  if (userId) {
    const user = await usersRepository.findUserById(userId)
    if (user) {
      entitlement = resolveEntitlement(user)
    }
  }

  const model = await mascotRepository.findModelWithDetails(modelCode, placement)
  if (!model) {
    throw new ApiError(404, `Mascot model '${modelCode}' not found`, 'MASCOT_MODEL_NOT_FOUND')
  }

  // Lấy danh sách trang sức đang đeo (nếu có userId)
  const equippedCosmetics = await mascotRepository.findEquippedCosmetics(userId, model.id)

  // Map danh sách hành động (kèm cờ isLocked dựa theo effectiveTier)
  const actions = (model.actions || []).map((action) => ({
    id: action.id,
    code: action.code,
    name: action.name,
    description: action.description,
    clipName: action.clipName,
    mood: action.mood,
    requiredTier: action.requiredTier,
    cooldownSeconds: action.cooldownSeconds,
    isLocked: action.requiredTier === 'PREMIUM' && entitlement.effectiveTier !== 'PREMIUM'
  }))

  // Gom nhóm dialogues theo triggerType và lọc theo quyền hạn (tier)
  const dialogues = {}
  for (const d of model.dialogues || []) {
    // Nếu user ở tier FREE, không gửi thoại PREMIUM
    if (d.requiredTier === 'PREMIUM' && entitlement.effectiveTier !== 'PREMIUM') {
      continue
    }

    if (!dialogues[d.triggerType]) {
      dialogues[d.triggerType] = []
    }
    dialogues[d.triggerType].push({
      id: d.id,
      placement: d.placement,
      requiredTier: d.requiredTier,
      actionType: d.actionType,
      content: d.content,
      clipName: d.clipName,
      activity: d.activity,
      mood: d.mood
    })
  }

  // Cấu hình hành vi theo từng ngữ cảnh màn hình
  const behaviorConfig = placement === 'DASHBOARD'
    ? {
      enableIdleLoop: true,
      idleIntervalMs: 120000,
      enableSleepMode: true
    }
    : {
      enableIdleLoop: false,
      idleIntervalMs: null,
      enableSleepMode: false
    }

  // Lấy trạng thái streak để hiển thị hiệu ứng ngọn lửa visualState trên Fox V2
  let streakVisual = {
    active: false,
    days: 0,
    tier: null
  }
  if (userId) {
    try {
      const streak = await streaksService.getMyStreak(userId)
      if (streak) {
        streakVisual = {
          active: (streak.currentStreak || 0) > 0,
          days: streak.currentStreak || 0,
          tier: streak.flameTier || null
        }
      }
    } catch {
      // Fallback nếu không truy vấn được streak
    }
  }

  return {
    model: {
      id: model.id,
      code: model.code,
      name: model.name,
      assetPath: model.assetPath,
      requiredTier: model.requiredTier
    },
    placement,
    entitlement,
    visualState: {
      streak: streakVisual
    },
    behaviorConfig,
    sleepWindow: {
      startHour: model.sleepStartHour,
      endHour: model.sleepEndHour
    },
    equippedCosmetics,
    actions,
    dialogues
  }
}

const getCosmetics = async (modelCode = 'FOX_V2', userId = null) => {
  let entitlement = resolveEntitlement(null)
  if (userId) {
    const user = await usersRepository.findUserById(userId)
    if (user) {
      entitlement = resolveEntitlement(user)
    }
  }

  const model = await mascotRepository.findModelByCode(modelCode)
  if (!model) {
    throw new ApiError(404, `Mascot model '${modelCode}' not found`, 'MASCOT_MODEL_NOT_FOUND')
  }

  const cosmetics = await mascotRepository.findCosmeticsByModelCode(modelCode)
  const userCosmetics = await mascotRepository.findUserCosmetics(userId, model.id)

  return cosmetics.map((c) => {
    const userItem = userCosmetics.find((uc) => uc.cosmeticId === c.id)
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      slot: c.slot,
      assetKey: c.assetKey,
      coinPrice: c.coinPrice,
      requiredTier: c.requiredTier,
      isOwned: Boolean(userItem),
      isEquipped: Boolean(userItem?.isEquipped),
      isLocked: c.requiredTier === 'PREMIUM' && entitlement.effectiveTier !== 'PREMIUM'
    }
  })
}

const equipCosmetic = async (cosmeticCode, userId) => {
  const user = await usersRepository.findUserById(userId)
  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
  }

  const entitlement = resolveEntitlement(user)

  const cosmetic = await mascotRepository.findCosmeticByCode(cosmeticCode)
  if (!cosmetic) {
    throw new ApiError(404, `Cosmetic '${cosmeticCode}' not found`, 'COSMETIC_NOT_FOUND')
  }

  // Chặn 403 nếu vật phẩm yêu cầu PREMIUM mà user không có quyền
  assertTierAccess(entitlement, cosmetic.requiredTier)

  const equipped = await mascotRepository.equipCosmeticInSlot(userId, cosmetic)

  return {
    id: equipped.id,
    userId: equipped.userId,
    cosmeticId: equipped.cosmeticId,
    isEquipped: equipped.isEquipped,
    equippedAt: equipped.equippedAt,
    cosmetic: {
      code: cosmetic.code,
      name: cosmetic.name,
      slot: cosmetic.slot,
      assetKey: cosmetic.assetKey,
      requiredTier: cosmetic.requiredTier
    }
  }
}

const unequipCosmetic = async (cosmeticCode, userId) => {
  const user = await usersRepository.findUserById(userId)
  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
  }

  const cosmetic = await mascotRepository.findCosmeticByCode(cosmeticCode)
  if (!cosmetic) {
    throw new ApiError(404, `Cosmetic '${cosmeticCode}' not found`, 'COSMETIC_NOT_FOUND')
  }

  await mascotRepository.unequipCosmetic(userId, cosmetic.id)

  return {
    message: `Cosmetic '${cosmeticCode}' unequipped successfully`
  }
}

const triggerAction = async (actionCode, userId) => {
  const user = await usersRepository.findUserById(userId)
  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
  }

  const entitlement = resolveEntitlement(user)

  const action = await mascotRepository.findActionByCode(actionCode)
  if (!action) {
    throw new ApiError(404, `Mascot action '${actionCode}' not found`, 'ACTION_NOT_FOUND')
  }

  // Chặn 403 nếu hành động yêu cầu PREMIUM mà user không có quyền
  assertTierAccess(entitlement, action.requiredTier)

  return {
    id: action.id,
    code: action.code,
    name: action.name,
    clipName: action.clipName,
    mood: action.mood,
    requiredTier: action.requiredTier,
    cooldownSeconds: action.cooldownSeconds
  }
}

export const mascotService = {
  getModels,
  getMascotState,
  getCosmetics,
  equipCosmetic,
  unequipCosmetic,
  triggerAction
}
