import app from './app.js'
import { startScheduledJobs } from './jobs/index.js'

const PORT = process.env.PORT || 3000

startScheduledJobs()

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`LifeQuest API is running on port ${PORT}`)
})