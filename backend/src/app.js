import express from 'express'
import errorHandler from './common/errors/errorHandler.js'
import { routes } from './routes/index.js'

const app = express()

app.use(express.json())

app.use('/api/v1', routes)


// Xử lý lỗi tập trung
app.use(errorHandler)

export default app