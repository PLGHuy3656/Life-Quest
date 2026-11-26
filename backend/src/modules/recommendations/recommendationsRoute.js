import express from 'express'
import { recommendationsController } from './recommendationsController.js'
import { recommendationsValidation } from './recommendationsValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

const Router = express.Router()

// /api/v1/recommendations
Router.get('/', authenticate, validate(recommendationsValidation.getRecommendations), recommendationsController.getRecommendations)
Router.post('/:recommendationId/accept', authenticate, validate(recommendationsValidation.recommendationIdParam), recommendationsController.acceptRecommendation)
Router.post('/:recommendationId/reject', authenticate, validate(recommendationsValidation.recommendationIdParam), recommendationsController.rejectRecommendation)

export const recommendationsRoute = Router
