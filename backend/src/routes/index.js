import express from 'express'
import { authRoute } from '../modules/auth/authRoute.js'
import { usersRoute } from '../modules/users/usersRoute.js'
import { goalsRoute } from '../modules/goals/goalsRoute.js'
import { milestonesRoute } from '../modules/milestones/milestonesRoute.js'
import { questsRoute } from '../modules/quests/questsRoute.js'
import { schedulesRoute } from '../modules/schedules/schedulesRoute.js'
import { todayRoute } from '../modules/today/todayRoute.js'
import { friendsRoute } from '../modules/friends/friendsRoute.js'
import { socialRoute } from '../modules/social/socialRoute.js'
import { mascotRoute } from '../modules/mascot/mascotRoute.js'
import streaksRoute from '../modules/streaks/streaksRoute.js'
import duosRoute from '../modules/duos/duosRoute.js'
import challengesRoute from '../modules/challenges/challengesRoute.js'

const Router = express.Router()

// Root API v1 Health Check & Discovery (Hỗ trợ cả /api/v1 và /api/v1/)
const discoveryHandler = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LifeQuest API v1 is running smoothly!',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      goals: '/api/v1/goals',
      milestones: '/api/v1/milestones',
      quests: '/api/v1/quests',
      schedules: '/api/v1/schedules',
      today: '/api/v1/today',
      friends: '/api/v1/friends',
      feed: '/api/v1/feed',
      mascotModels: '/api/v1/mascot/models',
      mascotState: '/api/v1/mascot/state?modelCode=FOX_V2',
      mascotCosmetics: '/api/v1/mascot/cosmetics?modelCode=FOX_V2',
      streaks: '/api/v1/streaks/me',
      duos: '/api/v1/duos/active',
      challenges: '/api/v1/challenges'
    }
  })
}

Router.get('/', discoveryHandler)
Router.get('', discoveryHandler)

// Auth Module
Router.use('/auth', authRoute)

// Users Module
Router.use('/users', usersRoute)

// Goals Module
Router.use('/goals', goalsRoute)

// Milestones Module
Router.use('/goals', milestonesRoute)
Router.use('/milestones', milestonesRoute)

// Quests Module
Router.use('/quests', questsRoute)

// Schedules Module
Router.use('/quests', schedulesRoute)
Router.use('/schedules', schedulesRoute)

// Today Module
Router.use('/today', todayRoute)

// Streaks Module
Router.use('/streaks', streaksRoute)

// Duos Module
Router.use('/duos', duosRoute)

// Challenges Module
Router.use('/challenges', challengesRoute)

// Friends Module (/friends, /friends/search, /friend-requests, etc.)
Router.use('/', friendsRoute)

// Social Module (/feed, /posts, /pokes, etc.)
Router.use('/', socialRoute)

// Mascot Module (/mascot/models, /mascot/state, /mascot/cosmetics, /mascot/actions)
Router.use('/mascot', mascotRoute)

export const routes = Router
