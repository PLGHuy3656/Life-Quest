import express from 'express'
import { mascotController } from './mascotController.js'
import { mascotValidation } from './mascotValidation.js'
import validate from '../../common/middleware/validate.js'

const Router = express.Router()

// GET /api/v1/mascot/models
Router.get('/models', validate(mascotValidation.getMascotModels), mascotController.getModels)

// GET /api/v1/mascot/state?modelCode=FOX_V2&placement=DASHBOARD
Router.get('/state', validate(mascotValidation.getMascotState), mascotController.getMascotState)

// GET /api/v1/mascot/cosmetics?modelCode=FOX_V2
Router.get('/cosmetics', validate(mascotValidation.getCosmetics), mascotController.getCosmetics)

// POST /api/v1/mascot/cosmetics/:cosmeticCode/equip
Router.post('/cosmetics/:cosmeticCode/equip', validate(mascotValidation.cosmeticAction), mascotController.equipCosmetic)

// DELETE /api/v1/mascot/cosmetics/:cosmeticCode/equip
Router.delete('/cosmetics/:cosmeticCode/equip', validate(mascotValidation.cosmeticAction), mascotController.unequipCosmetic)

// POST /api/v1/mascot/actions/:actionCode/trigger
Router.post('/actions/:actionCode/trigger', validate(mascotValidation.triggerAction), mascotController.triggerAction)

export const mascotRoute = Router
