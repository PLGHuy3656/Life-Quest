import express from 'express'
import { goalsRoute } from '../modules/goals/goalsRoute.js'
import { milestonesRoute } from '../modules/milestones/milestonesRoute.js'
import { questsRoute } from '../modules/quests/questsRoute.js'
import { friendsRoute } from '../modules/friends/friendsRoute.js'
import { socialRoute } from '../modules/social/socialRoute.js'
import { mascotRoute } from '../modules/mascot/mascotRoute.js'

const Router = express.Router()

// Root API v1 Health Check & Discovery (Hỗ trợ cả /api/v1 và /api/v1/)
const discoveryHandler = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LifeQuest API v1 is running smoothly!',
    endpoints: {
      mascotModels: '/api/v1/mascot/models',
      mascotState: '/api/v1/mascot/state?modelCode=FOX_V2',
      mascotCosmetics: '/api/v1/mascot/cosmetics?modelCode=FOX_V2',
      friends: '/api/v1/friends',
      feed: '/api/v1/feed',
      goals: '/api/v1/goals',
      quests: '/api/v1/quests'
    }
  })
}

Router.get('/', discoveryHandler)
Router.get('', discoveryHandler)

// Goals Module
Router.use('/goals', goalsRoute)

// Milestones Module
Router.use('/goals', milestonesRoute)
Router.use('/milestones', milestonesRoute)

// Quests Module
Router.use('/quests', questsRoute)

// Friends Module (/friends, /friends/search, /friend-requests, etc.)
Router.use('/', friendsRoute)

// Social Module (/feed, /posts, /pokes, etc.)
Router.use('/', socialRoute)

// Mascot Module (/mascot/models, /mascot/state, /mascot/cosmetics, /mascot/actions)
Router.use('/mascot', mascotRoute)

export const routes = Router
