import express from 'express'
import errorHandler from './common/errors/errorHandler.js'
import { routes } from './routes/index.js'
import { registerNotificationListeners } from './common/events/registerNotificationListeners.js'

const app = express()

registerNotificationListeners()

app.use(express.json())

app.use('/api/v1', routes)


// Xử lý lỗi tập trung
app.use(errorHandler)

export default app