import eventBus from './eventBus.js'
import { EVENT_TYPES } from './eventTypes.js'
import streaksService from '../../modules/streaks/streaksService.js'
import duosService from '../../modules/duos/duosService.js'
import challengesService from '../../modules/challenges/challengesService.js'

let isRegistered = false

export const registerAccountabilityListeners = () => {
  if (isRegistered) return
  isRegistered = true

  eventBus.on(EVENT_TYPES.QUEST_COMPLETED, async (data) => {
    try {
      const { userId, completedAt } = data || {}
      if (!userId) return

      const timestamp = completedAt ? new Date(completedAt) : new Date()

      // 1. Update streak
      try {
        await streaksService.onQuestCompleted(userId, timestamp)
      } catch (streakErr) {
        console.error('[AccountabilityListener] Error updating streak:', streakErr)
      }

      // 2. Update active duo partnerships
      try {
        await duosService.onQuestCompleted(userId)
      } catch (duoErr) {
        console.error('[AccountabilityListener] Error updating duos:', duoErr)
      }

      // 3. Update joined challenges
      try {
        await challengesService.onQuestCompleted(userId)
      } catch (challengeErr) {
        console.error('[AccountabilityListener] Error updating challenges:', challengeErr)
      }
    } catch (err) {
      console.error('[AccountabilityListener] Unexpected error in QUEST_COMPLETED listener:', err)
    }
  })
}

export default registerAccountabilityListeners
