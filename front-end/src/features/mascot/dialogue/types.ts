import type { FoxEventName } from '@/mascot/FoxEventMap'

export type DialogueCategory =
  | 'idle'
  | 'encouragement'
  | 'dashboard'
  | 'social'
  | 'task'
  | 'deadline'
  | 'system'
  | 'touch'
  | 'scene'

export type DialogueEmotion =
  | 'neutral'
  | 'happy'
  | 'curious'
  | 'encouraging'
  | 'playful'
  | 'alert'
  | 'panic'
  | 'calm'

export type DialogueTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'any'

export type DialogueEventType =
  | 'IDLE_CHATTER'
  | 'ENCOURAGEMENT'
  | 'TASK_SUGGESTION'
  | 'RAIL_TOGGLED'
  | 'ROUTE_SWITCHED'
  | 'DASHBOARD_ACTION'
  | 'SOCIAL_MEDIA_VIEWED'
  | 'PIN_UPDATED'
  | 'USER_RETURNED'
  | 'APP_GREETING'
  | 'EMPTY_TASKS'
  | 'TOUCH_SINGLE'
  | 'TOUCH_REPEAT'
  | 'TOUCH_SLEEP'
  | 'TOUCH_RETURN'
  | 'HOVER_BACKGROUND'
  | 'HOVER_COFFEE'
  | 'HOVER_BOOKS'
  | 'HOVER_WINDOW'
  | 'HOVER_CHAIR'
  | 'HOVER_PINBOARD'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_COMPLETED'
  | 'TASK_DETAIL_OPENED'
  | 'FOCUS_STARTED'
  | 'FOCUS_PAUSED'
  | 'EVIDENCE_SELECTED'
  | 'QUEST_OPENED'
  | 'QUEST_TASK_VIEWED'
  | 'QUEST_TASK_CREATED'
  | 'QUEST_INVITE_RECEIVED'
  | 'QUEST_MEMBER_JOINED'
  | 'QUEST_TASK_ASSIGNED'
  | 'QUEST_PROGRESS_UPDATED'
  | 'QUEST_DEADLINE_URGENT'
  | 'QUEST_COMPLETED'
  | 'BACKEND_ERROR'
  | 'DEADLINE_60M'
  | 'DEADLINE_15M'
  | 'DEADLINE_OVERDUE'
  | 'WARDROBE_OPENED'
  | 'COSMETIC_PREVIEWED'
  | 'COSMETIC_REMOVED'
  | 'OUTFIT_RESET'

export interface RawDialogueEntry {
  id: string
  event: DialogueEventType
  text: string
  emotion: DialogueEmotion
  weight?: number
  timeOfDay?: DialogueTimeOfDay
}

export interface DialogueCollectionFile {
  category: DialogueCategory
  version: string
  entries: RawDialogueEntry[]
}

export interface DialogueEventInput {
  event: DialogueEventType
  /** Optional deduplication key (e.g. deadline:questId:15m) */
  dedupeKey?: string
  /** Optional short task title interpolated into `{task}` */
  taskTitle?: string
  /** Optional route target for urgent deadline quick-open action */
  actionRoute?: string
  actionLabel?: string
  /** Override local hour for deterministic testing */
  hour?: number
}

export interface ActiveDialogueBubble {
  instanceId: string
  entryId: string
  event: DialogueEventType
  text: string
  emotion: DialogueEmotion
  priority: number
  durationMs: number
  createdAt: number
  actionRoute?: string
  actionLabel?: string
  /** Optional verified Gate I FoxEventName (never fabricated clips) */
  gateIEvent?: FoxEventName
}

export interface DialoguePauseReasons {
  typing: boolean
  modalOpen: boolean
  lightboxOpen: boolean
  foxCollapsed: boolean
  pageHidden: boolean
}

export const EVENT_PRIORITY: Record<DialogueEventType, number> = {
  IDLE_CHATTER: 10,
  ENCOURAGEMENT: 15,
  TASK_SUGGESTION: 15,
  RAIL_TOGGLED: 20,
  ROUTE_SWITCHED: 20,
  TASK_DETAIL_OPENED: 22,
  QUEST_OPENED: 22,
  QUEST_TASK_VIEWED: 24,
  DASHBOARD_ACTION: 25,
  SOCIAL_MEDIA_VIEWED: 25,
  HOVER_BACKGROUND: 26,
  HOVER_COFFEE: 28,
  HOVER_BOOKS: 28,
  HOVER_WINDOW: 28,
  HOVER_CHAIR: 28,
  HOVER_PINBOARD: 28,
  PIN_UPDATED: 30,
  USER_RETURNED: 30,
  FOCUS_PAUSED: 32,
  EVIDENCE_SELECTED: 34,
  APP_GREETING: 35,
  EMPTY_TASKS: 35,
  TOUCH_SINGLE: 40,
  TOUCH_REPEAT: 40,
  TOUCH_SLEEP: 42,
  TOUCH_RETURN: 42,
  FOCUS_STARTED: 45,
  TASK_UPDATED: 46,
  TASK_CREATED: 50,
  QUEST_TASK_CREATED: 50,
  QUEST_TASK_ASSIGNED: 48,
  QUEST_MEMBER_JOINED: 48,
  QUEST_PROGRESS_UPDATED: 52,
  QUEST_INVITE_RECEIVED: 54,
  TASK_COMPLETED: 55,
  QUEST_COMPLETED: 58,
  BACKEND_ERROR: 60,
  DEADLINE_60M: 70,
  QUEST_DEADLINE_URGENT: 78,
  DEADLINE_15M: 85,
  DEADLINE_OVERDUE: 95,
  WARDROBE_OPENED: 32,
  COSMETIC_PREVIEWED: 38,
  COSMETIC_REMOVED: 36,
  OUTFIT_RESET: 38
}

export const EVENT_COOLDOWN_MS: Record<DialogueEventType, number> = {
  IDLE_CHATTER: 35_000,
  ENCOURAGEMENT: 30_000,
  TASK_SUGGESTION: 30_000,
  RAIL_TOGGLED: 12_000,
  ROUTE_SWITCHED: 15_000,
  TASK_DETAIL_OPENED: 12_000,
  QUEST_OPENED: 12_000,
  QUEST_TASK_VIEWED: 10_000,
  DASHBOARD_ACTION: 12_000,
  SOCIAL_MEDIA_VIEWED: 10_000,
  HOVER_BACKGROUND: 10_000,
  HOVER_COFFEE: 5_000,
  HOVER_BOOKS: 5_000,
  HOVER_WINDOW: 5_000,
  HOVER_CHAIR: 5_000,
  HOVER_PINBOARD: 5_000,
  PIN_UPDATED: 5_000,
  USER_RETURNED: 30_000,
  FOCUS_PAUSED: 3_000,
  EVIDENCE_SELECTED: 4_000,
  APP_GREETING: 60_000,
  EMPTY_TASKS: 60_000,
  TOUCH_SINGLE: 1_200,
  TOUCH_REPEAT: 1_200,
  TOUCH_SLEEP: 2_000,
  TOUCH_RETURN: 5_000,
  FOCUS_STARTED: 3_000,
  TASK_UPDATED: 3_000,
  TASK_CREATED: 2_000,
  QUEST_TASK_CREATED: 2_000,
  QUEST_TASK_ASSIGNED: 3_000,
  QUEST_MEMBER_JOINED: 3_000,
  QUEST_PROGRESS_UPDATED: 3_000,
  QUEST_INVITE_RECEIVED: 3_000,
  TASK_COMPLETED: 2_000,
  QUEST_COMPLETED: 2_000,
  BACKEND_ERROR: 8_000,
  DEADLINE_60M: 2_000,
  QUEST_DEADLINE_URGENT: 2_000,
  DEADLINE_15M: 2_000,
  DEADLINE_OVERDUE: 2_000,
  WARDROBE_OPENED: 4_000,
  COSMETIC_PREVIEWED: 1_200,
  COSMETIC_REMOVED: 1_200,
  OUTFIT_RESET: 1_500
}

/** Verified Gate I event mappings only (from src/mascot/FoxEventMap.ts) */
export const VERIFIED_GATE_I_MAP: Partial<Record<DialogueEventType, FoxEventName>> = {
  IDLE_CHATTER: 'USER_IDLE',
  SOCIAL_MEDIA_VIEWED: 'PHOTO_REACTION',
  TOUCH_SINGLE: 'FRIEND_GREETING',
  TOUCH_REPEAT: 'FRIEND_CHEER',
  TOUCH_SLEEP: 'SLEEP_ENDED',
  TOUCH_RETURN: 'USER_RETURNED',
  TASK_CREATED: 'TASK_CREATED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  DEADLINE_60M: 'QUEST_DEADLINE_URGENT',
  DEADLINE_15M: 'QUEST_DEADLINE_URGENT',
  DEADLINE_OVERDUE: 'QUEST_EXPIRED'
}

/**
 * Future Backend Notification Service boundary (Phase 8).
 * In-app deadline alerts are active now; push/remote notifications remain UNAVAILABLE
 * until Backend implements a Notification module.
 */
export interface NotificationServiceAdapter {
  readonly status: 'IN_APP_ONLY' | 'BACKEND_CONNECTED'
  scheduleInAppReminder: (input: { questId: string; threshold: '60m' | '15m' | 'overdue'; title: string }) => void
}
