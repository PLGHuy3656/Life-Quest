import express from 'express'
import { authRoute } from '../modules/auth/authRoute.js'
import { usersRoute } from '../modules/users/usersRoute.js'
import { goalsRoute } from '../modules/goals/goalsRoute.js'
import { milestonesRoute } from '../modules/milestones/milestonesRoute.js'
import { questsRoute } from '../modules/quests/questsRoute.js'
import { schedulesRoute } from '../modules/schedules/schedulesRoute.js'
import { todayRoute } from '../modules/today/todayRoute.js'
import { executionsRoute } from '../modules/executions/executionsRoute.js'
import { focusRoute } from '../modules/focus/focusRoute.js'
import { proofsRoute, executionProofsRoute } from '../modules/proofs/proofsRoute.js'
import { gamificationRoute } from '../modules/gamification/gamificationRoute.js'
import { achievementsRoute, userAchievementsRoute } from '../modules/achievements/achievementsRoute.js'
import { rewardsRoute, inventoryRoute } from '../modules/rewards/rewardsRoute.js'

const Router = express.Router()

// Auth Module
Router.use('/auth', authRoute)

// Users Module
Router.use('/users', usersRoute)
Router.use('/users', userAchievementsRoute)

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

// Execution Module
Router.use('/executions', executionsRoute)

// Focus Module
Router.use('/executions', focusRoute)
Router.use('/focus-sessions', focusRoute)

// Proof Module
Router.use('/executions', executionProofsRoute)
Router.use('/proofs', proofsRoute)

// Gamification Module
Router.use('/gamification', gamificationRoute)

// Achievements Module
Router.use('/achievements', achievementsRoute)

// Rewards & Inventory Module
Router.use('/rewards', rewardsRoute)
Router.use('/inventory', inventoryRoute)

export const routes = Router
