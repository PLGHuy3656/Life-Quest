import type { Quest } from '@/types/domain'
import { MOCK_QUESTS } from './fixtures'

/**
 * Shared in-memory preview state used ONLY in unauthenticated dev preview mode.
 * Ensures Pin/Unpin toggles in Work Hub and PinnedTaskRail stay synchronized
 * without faking LIVE API responses when authenticated.
 */
let previewQuests: Quest[] = MOCK_QUESTS.map((q) => ({ ...q }))

export function getPreviewQuests(): Quest[] {
  return previewQuests
}

export function setPreviewQuestPinned(questId: string, isPinned: boolean): Quest | null {
  let updated: Quest | null = null
  previewQuests = previewQuests.map((q) => {
    if (q.id !== questId) return q
    updated = { ...q, isPinned, updatedAt: new Date().toISOString() }
    return updated
  })
  return updated
}

export function resetPreviewQuestsForTests(): void {
  previewQuests = MOCK_QUESTS.map((q) => ({ ...q }))
}
