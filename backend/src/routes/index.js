import express from 'express'
import { goalsRoute } from '../modules/goals/goalsRoute.js'
import { milestonesRoute } from '../modules/milestones/milestonesRoute.js'

const Router = express.Router()

// Goals Module
Router.use('/goals', goalsRoute)

// Milestones Module
Router.use('/', milestonesRoute)

export const routes = Router