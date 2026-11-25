import app from './app.js'


const PORT = process.env.PORT || 3000


app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`LifeQuest API is running on port ${PORT}`)
})