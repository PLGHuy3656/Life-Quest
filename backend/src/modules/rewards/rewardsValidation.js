import Joi from 'joi'

// Danh sách phần thưởng trong cửa hàng
const getRewards = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    category: Joi.string().trim().max(50).optional()
  })
})

// Chi tiết phần thưởng
const getRewardById = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    rewardId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Mua phần thưởng
const purchaseReward = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    rewardId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Lấy danh sách túi đồ / kho đồ của người dùng
const getInventory = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    category: Joi.string().trim().max(50).optional(),
    isEquipped: Joi.boolean().optional()
  })
})

// Trang bị vật phẩm
const equipItem = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    itemId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Gỡ trang bị vật phẩm
const unequipItem = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    itemId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

export const rewardsValidation = {
  getRewards,
  getRewardById,
  purchaseReward,
  getInventory,
  equipItem,
  unequipItem
}
