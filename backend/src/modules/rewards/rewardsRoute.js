import express from 'express'
import { rewardsController } from './rewardsController.js'
import { rewardsValidation } from './rewardsValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

// Router cho Rewards (/api/v1/rewards)
const rewardsRouter = express.Router()

// GET /api/v1/rewards
rewardsRouter.get('/', authenticate, validate(rewardsValidation.getRewards), rewardsController.getRewards)

// GET /api/v1/rewards/:rewardId
rewardsRouter.get('/:rewardId', authenticate, validate(rewardsValidation.getRewardById), rewardsController.getRewardById)

// POST /api/v1/rewards/:rewardId/purchase
rewardsRouter.post('/:rewardId/purchase', authenticate, validate(rewardsValidation.purchaseReward), rewardsController.purchaseReward)

// Router cho Inventory (/api/v1/inventory)
const inventoryRouter = express.Router()

// GET /api/v1/inventory
inventoryRouter.get('/', authenticate, validate(rewardsValidation.getInventory), rewardsController.getInventory)

// POST /api/v1/inventory/:itemId/equip
inventoryRouter.post('/:itemId/equip', authenticate, validate(rewardsValidation.equipItem), rewardsController.equipItem)

// POST /api/v1/inventory/:itemId/unequip
inventoryRouter.post('/:itemId/unequip', authenticate, validate(rewardsValidation.unequipItem), rewardsController.unequipItem)

export const rewardsRoute = rewardsRouter
export const inventoryRoute = inventoryRouter
