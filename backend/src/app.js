import express from 'express'

const app = express()


app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'LifeQuest API is running'
    }
  })
})

export default app