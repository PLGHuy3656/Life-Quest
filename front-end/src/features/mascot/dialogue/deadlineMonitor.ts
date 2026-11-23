import type { Quest } from '@/types/domain'
import type { DialogueEventType } from './types'

export type DeadlineThreshold = '60m' | '15m' | 'overdue'

export interface DeadlineAlertCandidate {
  questId: string
  questTitle: string
  threshold: DeadlineThreshold
  event: Extract<DialogueEventType, 'DEADLINE_60M' | 'DEADLINE_15M' | 'DEADLINE_OVERDUE'>
  remainingMs: number
  dedupeKey: string
}

export interface DeadlineMonitorConfig {
  warning60mMs?: number
  urgent15mMs?: number
  /** Ignore overdue tasks older than this window so stale historical quests don't spam */
  maxOverdueAgeMs?: number
}

const DEFAULT_60M = 60 * 60 * 1000
const DEFAULT_15M = 15 * 60 * 1000
const DEFAULT_MAX_OVERDUE = 24 * 60 * 60 * 1000

function isQuestActiveForDeadline(quest: Quest): boolean {
  if (quest.status !== 'ACTIVE') return false
  if (quest.completedAt !== null) return false
  if (quest.archivedAt !== null) return false
  if (quest.deletedAt !== null) return false
  return Boolean(quest.dueAt)
}

/**
 * Timezone-safe deadline evaluator operating on real ISO `quest.dueAt` timestamps.
 * Returns candidates sorted by urgency (overdue -> 15m -> 60m).
 */
export function evaluateQuestDeadlines(
  quests: Quest[],
  nowMs: number = Date.now(),
  config: DeadlineMonitorConfig = {}
): DeadlineAlertCandidate[] {
  const warn60 = config.warning60mMs ?? DEFAULT_60M
  const urgent15 = config.urgent15mMs ?? DEFAULT_15M
  const maxOverdue = config.maxOverdueAgeMs ?? DEFAULT_MAX_OVERDUE

  const alerts: DeadlineAlertCandidate[] = []

  for (const quest of quests) {
    if (!isQuestActiveForDeadline(quest) || !quest.dueAt) continue
    const dueMs = Date.parse(quest.dueAt)
    if (Number.isNaN(dueMs)) continue

    const remainingMs = dueMs - nowMs

    if (remainingMs <= 0 && Math.abs(remainingMs) <= maxOverdue) {
      alerts.push({
        questId: quest.id,
        questTitle: quest.title,
        threshold: 'overdue',
        event: 'DEADLINE_OVERDUE',
        remainingMs,
        dedupeKey: `deadline:${quest.id}:overdue`
      })
    } else if (remainingMs > 0 && remainingMs <= urgent15) {
      alerts.push({
        questId: quest.id,
        questTitle: quest.title,
        threshold: '15m',
        event: 'DEADLINE_15M',
        remainingMs,
        dedupeKey: `deadline:${quest.id}:15m`
      })
    } else if (remainingMs > urgent15 && remainingMs <= warn60) {
      alerts.push({
        questId: quest.id,
        questTitle: quest.title,
        threshold: '60m',
        event: 'DEADLINE_60M',
        remainingMs,
        dedupeKey: `deadline:${quest.id}:60m`
      })
    }
  }

  const order: Record<DeadlineThreshold, number> = { overdue: 0, '15m': 1, '60m': 2 }
  alerts.sort((a, b) => order[a.threshold] - order[b.threshold] || a.remainingMs - b.remainingMs)
  return alerts
}
