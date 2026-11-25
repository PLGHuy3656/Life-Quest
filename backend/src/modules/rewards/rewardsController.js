import { StatusCodes } from 'http-status-codes'
import { rewardsService } from './rewardsService.js'

// Lấy danh sách phần thưởng trong cửa hàng
const getRewards = async (req, res, next) => {
  try {
    const rewards = await rewardsService.getRewards(req.query)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: rewards
    })
  } catch (error) {
    next(error)
  }
}

// Lấy chi tiết một phần thưởng
const getRewardById = async (req, res, next) => {
  try {
    const { rewardId } = req.params
    const reward = await rewardsService.getRewardById(rewardId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: reward
    })
  } catch (error) {
    next(error)
  }
}

// Mua phần thưởng
const purchaseReward = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { rewardId } = req.params
    const result = await rewardsService.purchaseReward(userId, rewardId)
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Lấy kho đồ của người dùng
const getInventory = async (req, res, next) => {
  try {
    const userId = req.user.id
    const inventory = await rewardsService.getInventory(userId, req.query)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: inventory
    })
  } catch (error) {
    next(error)
  }
}

// Trang bị vật phẩm
const equipItem = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { itemId } = req.params
    const item = await rewardsService.equipItem(userId, itemId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: item
    })
  } catch (error) {
    next(error)
  }
}

// Gỡ trang bị vật phẩm
const unequipItem = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { itemId } = req.params
    const item = await rewardsService.unequipItem(userId, itemId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: item
    })
  } catch (error) {
    next(error)
  }
}

export const rewardsController = {
  getRewards,
  getRewardById,
  purchaseReward,
  getInventory,
  equipItem,
  unequipItem
}
