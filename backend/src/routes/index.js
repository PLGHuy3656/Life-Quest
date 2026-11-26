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
import { streakRulesRoute, streaksRoute } from '../modules/streaks/streaksRoute.js'
import { friendsRoute, friendRequestsRoute, pokesRoute } from '../modules/friends/friendsRoute.js'
import { feedRoute, postsRoute, commentsRoute } from '../modules/social/socialRoute.js'
import { duosRoute } from '../modules/duos/duosRoute.js'
import { challengesRoute } from '../modules/challenges/challengesRoute.js'
import { notificationsRoute, devicesRoute } from '../modules/notifications/notificationsRoute.js'
import { analyticsRoute } from '../modules/analytics/analyticsRoute.js'
import { recommendationsRoute } from '../modules/recommendations/recommendationsRoute.js'
import { aiPlansRoute } from '../modules/ai-plans/aiPlansRoute.js'
import { reportsRoute, adminRoute } from '../modules/admin/adminRoute.js'

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

// Streaks Module
Router.use('/streak-rules', streakRulesRoute)
Router.use('/streaks', streaksRoute)

// Friends & Pokes Module
Router.use('/friends', friendsRoute)
Router.use('/friend-requests', friendRequestsRoute)
Router.use('/pokes', pokesRoute)

// Social Module
Router.use('/feed', feedRoute)
Router.use('/posts', postsRoute)
Router.use('/comments', commentsRoute)

// Duos Module
Router.use('/duos', duosRoute)

// Challenges Module
Router.use('/challenges', challengesRoute)

// Notifications & Devices Module
Router.use('/notifications', notificationsRoute)
Router.use('/devices', devicesRoute)

// Analytics Module
Router.use('/analytics', analyticsRoute)

// Recommendations Module
Router.use('/recommendations', recommendationsRoute)

// AI Plans Module
Router.use('/ai-plans', aiPlansRoute)

// Reports & Admin Module
Router.use('/reports', reportsRoute)
Router.use('/admin', adminRoute)

export const routes = Router
