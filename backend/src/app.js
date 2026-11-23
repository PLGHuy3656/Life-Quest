import express from 'express'
import errorHandler from './common/errors/errorHandler.js'
import { routes } from './routes/index.js'
import registerAccountabilityListeners from './common/events/registerAccountabilityListeners.js'

const app = express()

// Register global domain event listeners
registerAccountabilityListeners()

app.use(express.json())

// Welcome & discovery on root
app.get('/', (req, res) => res.redirect('/api/v1'))

// Mount API v1 routes
app.use('/api/v1', routes)

// Xử lý lỗi tập trung
app.use(errorHandler)

export default app
