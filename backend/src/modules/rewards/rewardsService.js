import { rewardsRepository } from './rewardsRepository.js'
import { gamificationRepository } from '../gamification/gamificationRepository.js'
import ApiError from '../../common/errors/ApiError.js'

// Format serialize BigInt cho RewardItem
const formatRewardItem = (item) => {
  if (!item) return null
  return {
    ...item,
    priceCoin: item.priceCoin !== undefined ? Number(item.priceCoin) : 0
  }
}

// Format serialize cho UserInventory
const formatInventoryItem = (inv) => {
  if (!inv) return null
  return {
    id: inv.id,
    userId: inv.userId,
    rewardItemId: inv.rewardItemId,
    quantity: inv.quantity,
    purchasedAt: inv.purchasedAt,
    equippedAt: inv.equippedAt,
    isEquipped: inv.equippedAt !== null,
    rewardItem: formatRewardItem(inv.rewardItem)
  }
}

// Lấy danh mục phần thưởng có sẵn
const getRewards = async ({ category } = {}) => {
  const rewards = await rewardsRepository.findActiveRewards({ category })
  return rewards.map(formatRewardItem)
}

// Lấy thông tin chi tiết một phần thưởng
const getRewardById = async (rewardId) => {
  const reward = await rewardsRepository.findRewardById(rewardId)
  if (!reward || !reward.isActive) {
    throw new ApiError(404, 'Reward item not found', 'REWARD_NOT_FOUND')
  }

  return formatRewardItem(reward)
}

// Mua phần thưởng bằng Coin
const purchaseReward = async (userId, rewardId) => {
  const reward = await rewardsRepository.findRewardById(rewardId)
  if (!reward || !reward.isActive) {
    throw new ApiError(404, 'Reward item not found', 'REWARD_NOT_FOUND')
  }

  // Kiểm tra xem người dùng đã sở hữu vật phẩm này chưa
  const existingOwnership = await rewardsRepository.findUserInventoryByRewardId(userId, rewardId)
  if (existingOwnership) {
    throw new ApiError(409, 'You already own this reward item', 'ALREADY_OWNED')
  }

  // Lấy thông tin gamification của người dùng
  let gamification = await gamificationRepository.findUserGamification(userId)
  if (!gamification) {
    gamification = await gamificationRepository.createUserGamification(userId)
  }

  // Kiểm tra yêu cầu cấp độ (Level)
  if (gamification.level < reward.requiredLevel) {
    throw new ApiError(
      400,
      `Requires level ${reward.requiredLevel} to purchase this item`,
      'INSUFFICIENT_LEVEL'
    )
  }

  // Kiểm tra số dư Coin
  if (gamification.coinBalance < reward.priceCoin) {
    throw new ApiError(
      400,
      'Insufficient coin balance to purchase this item',
      'INSUFFICIENT_COINS'
    )
  }

  // Thực hiện giao dịch mua Atomic
  const { inventoryItem, newBalance } = await rewardsRepository.purchaseRewardAtomic(userId, reward)

  return {
    inventoryItem: formatInventoryItem(inventoryItem),
    newBalance: Number(newBalance)
  }
}

// Lấy danh sách túi đồ / kho đồ của người dùng
const getInventory = async (userId, filter = {}) => {
  const items = await rewardsRepository.findUserInventory(userId, filter)
  return items.map(formatInventoryItem)
}

// Trang bị vật phẩm
const equipItem = async (userId, itemId) => {
  const inventoryItem = await rewardsRepository.findInventoryItemById(userId, itemId)
  if (!inventoryItem) {
    throw new ApiError(404, 'Item not found in inventory', 'INVENTORY_ITEM_NOT_FOUND')
  }

  const updated = await rewardsRepository.equipItemAtomic(userId, inventoryItem)
  return formatInventoryItem(updated)
}

// Gỡ trang bị vật phẩm
const unequipItem = async (userId, itemId) => {
  const inventoryItem = await rewardsRepository.findInventoryItemById(userId, itemId)
  if (!inventoryItem) {
    throw new ApiError(404, 'Item not found in inventory', 'INVENTORY_ITEM_NOT_FOUND')
  }

  if (!inventoryItem.equippedAt) {
    throw new ApiError(400, 'Item is not currently equipped', 'ITEM_NOT_EQUIPPED')
  }

  const updated = await rewardsRepository.unequipItem(userId, itemId)
  return formatInventoryItem(updated)
}

export const rewardsService = {
  getRewards,
  getRewardById,
  purchaseReward,
  getInventory,
  equipItem,
  unequipItem
}
