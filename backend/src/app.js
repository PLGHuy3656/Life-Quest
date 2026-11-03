import express from 'express'
import errorHandler from './common/errors/errorHandler.js'
import { usersRoute } from './modules/users/usersRoute.js'
import { goalsRoute } from './modules/goals/goalsRoute.js'

const app = express()

app.use(express.json())


// API Users
app.use('/api/v1/users', usersRoute)

// API Goals
app.use('/api/v1/goals', goalsRoute)

// Xử lý lỗi tập trung
app.use(errorHandler)

export default app