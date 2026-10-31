import express from 'express'
import errorHandler from './common/errors/errorHandler.js'
import { usersRoute } from './modules/users/usersRoute.js'

const app = express()

app.use(express.json())


// API Users
app.use('/api/v1/users', usersRoute)


app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'LifeQuest API is running'
    }
  })
})


// Xử lý lỗi tập trung
app.use(errorHandler)

export default app