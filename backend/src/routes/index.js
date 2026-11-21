import express from 'express'
import { authRoute } from '../modules/auth/authRoute.js'
import { usersRoute } from '../modules/users/usersRoute.js'
import { goalsRoute } from '../modules/goals/goalsRoute.js'
import { milestonesRoute } from '../modules/milestones/milestonesRoute.js'
import { questsRoute } from '../modules/quests/questsRoute.js'
import { schedulesRoute } from '../modules/schedules/schedulesRoute.js'
import { todayRoute } from '../modules/today/todayRoute.js'

const Router = express.Router()

// Auth Module
Router.use('/auth', authRoute)

// Users Module
Router.use('/users', usersRoute)

// Goals Module
Router.use('/goals', goalsRoute)

// Milestones Module
Router.use('/goals', milestonesRoute)
Router.use('/milestones', milestonesRoute)

// Quest Module
Router.use('/quests', questsRoute)

// Schedule Module
Router.use('/quests', schedulesRoute)
Router.use('/schedules', schedulesRoute)

// Today Module
Router.use('/today', todayRoute)

export const routes = Router
