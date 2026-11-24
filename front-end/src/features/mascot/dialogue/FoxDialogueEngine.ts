import { getEntriesForEvent } from './catalogLoader'
import {
  EVENT_COOLDOWN_MS,
  EVENT_PRIORITY,
  VERIFIED_GATE_I_MAP,
  type ActiveDialogueBubble,
  type DialogueEventInput,
  type DialogueEventType,
  type DialoguePauseReasons,
  type RawDialogueEntry
} from './types'

export interface FoxDialogueEngineOptions {
  globalCooldownMs?: number
  maxRecentPerEvent?: number
  maxQueueSize?: number
  now?: () => number
  random?: () => number
}

const DEFAULT_PAUSE: DialoguePauseReasons = {
  typing: false,
  modalOpen: false,
  lightboxOpen: false,
  foxCollapsed: false,
  pageHidden: false
}

function interpolateText(template: string, taskTitle?: string): string {
  const cleanTitle = taskTitle?.trim()
  const shortTitle =
    cleanTitle && cleanTitle.length > 28 ? `${cleanTitle.slice(0, 27)}…` : cleanTitle || 'nhiệm vụ'
  return template.replace(/\{task\}/g, shortTitle)
}

function durationForPriority(priority: number): number {
  if (priority >= 85) return 9000
  if (priority >= 70) return 8000
  if (priority >= 50) return 6800
  return 6200
}

/**
 * Pure, deterministic contextual dialogue engine for Fox V2:
 * - One active bubble at a time
 * - Priority interruption (high interrupts idle; idle never interrupts higher)
 * - Weighted selection with repeat avoidance
 * - Per-event & global cooldowns + deduplication + bounded queue
 * - Pause/resume awareness for typing, modals, lightbox, collapse, pageHidden
 */
export class FoxDialogueEngine {
  private readonly globalCooldownMs: number
  private readonly maxRecentPerEvent: number
  private readonly maxQueueSize: number
  private readonly now: () => number
  private readonly random: () => number

  private active: ActiveDialogueBubble | null = null
  private queue: DialogueEventInput[] = []
  private lastGlobalSpokeAt = -Infinity
  private lastEventSpokeAt = new Map<DialogueEventType, number>()
  private recentIdsByEvent = new Map<DialogueEventType, string[]>()
  private seenDedupeKeys = new Set<string>()
  private pauseReasons: DialoguePauseReasons = { ...DEFAULT_PAUSE }
  private seq = 0

  constructor(options: FoxDialogueEngineOptions = {}) {
    this.globalCooldownMs = options.globalCooldownMs ?? 4_000
    this.maxRecentPerEvent = options.maxRecentPerEvent ?? 6
    this.maxQueueSize = options.maxQueueSize ?? 3
    this.now = options.now ?? (() => Date.now())
    this.random = options.random ?? (() => Math.random())
  }

  getActive(): ActiveDialogueBubble | null {
    return this.active
  }

  getQueueLength(): number {
    return this.queue.length
  }

  getPauseReasons(): DialoguePauseReasons {
    return { ...this.pauseReasons }
  }

  isIdlePaused(): boolean {
    const p = this.pauseReasons
    return p.typing || p.modalOpen || p.lightboxOpen || p.foxCollapsed || p.pageHidden
  }

  setPauseReason(patch: Partial<DialoguePauseReasons>): ActiveDialogueBubble | null {
    this.pauseReasons = { ...this.pauseReasons, ...patch }
    return this.active
  }

  emit(input: DialogueEventInput): {
    accepted: boolean
    reason?: string
    active: ActiveDialogueBubble | null
  } {
    const t = this.now()
    const priority = EVENT_PRIORITY[input.event]
    const isUrgent = priority >= 70
    const isTouch = input.event.startsWith('TOUCH_')
    const isHover = input.event.startsWith('HOVER_')
    const isIdle = input.event === 'IDLE_CHATTER' || input.event === 'ENCOURAGEMENT' || input.event === 'TASK_SUGGESTION'

    // 1. Deduplication check
    if (input.dedupeKey && this.seenDedupeKeys.has(input.dedupeKey)) {
      return { accepted: false, reason: 'deduplicated', active: this.active }
    }

    // 2. Pause gates
    if (this.pauseReasons.foxCollapsed || this.pauseReasons.pageHidden) {
      return { accepted: false, reason: 'paused', active: this.active }
    }
    if (isIdle && this.isIdlePaused()) {
      return { accepted: false, reason: 'idle_paused', active: this.active }
    }

    // 3. Per-event cooldown check (urgent deadline alerts with unique dedupeKey bypass)
    const lastForEvent = this.lastEventSpokeAt.get(input.event) ?? -Infinity
    const eventCd = EVENT_COOLDOWN_MS[input.event]
    if (!isUrgent && t - lastForEvent < eventCd) {
      return { accepted: false, reason: 'event_cooldown', active: this.active }
    }

    // 4. Global cooldown check (urgent alerts, critical errors, direct touches, and prop hovers bypass)
    if (!isUrgent && !isTouch && !isHover && priority < 60 && t - this.lastGlobalSpokeAt < this.globalCooldownMs) {
      return { accepted: false, reason: 'global_cooldown', active: this.active }
    }

    // 5. Priority arbitration vs currently active bubble
    if (this.active) {
      if (priority > this.active.priority) {
        // High-priority interrupts lower-priority / idle immediately
        return { accepted: true, active: this.activate(input, t) }
      }
      if ((isTouch || isHover) && this.active.priority <= priority) {
        // Direct touch or prop hover updates an equal/lower bubble cleanly without interrupting deadlines
        return { accepted: true, active: this.activate(input, t) }
      }
      if (isIdle || isHover) {
        // Idle chatter and prop hovers NEVER interrupt or queue behind higher-priority speech
        return { accepted: false, reason: 'lower_priority_than_active', active: this.active }
      }
      if (isTouch && this.active.priority >= 70) {
        // Touch dialogue must NEVER interrupt urgent deadline alerts
        return { accepted: false, reason: 'blocked_by_urgent_alert', active: this.active }
      }
      // Queue medium/equal priority events up to bounded size
      if (this.queue.length < this.maxQueueSize) {
        this.queue.push(input)
        this.queue.sort((a, b) => EVENT_PRIORITY[b.event] - EVENT_PRIORITY[a.event])
        return { accepted: true, reason: 'queued', active: this.active }
      }
      return { accepted: false, reason: 'queue_full', active: this.active }
    }

    return { accepted: true, active: this.activate(input, t) }
  }

  dismiss(): ActiveDialogueBubble | null {
    this.active = null
    return this.drainNext()
  }

  expire(instanceId: string): ActiveDialogueBubble | null {
    if (!this.active || this.active.instanceId !== instanceId) {
      return this.active
    }
    this.active = null
    return this.drainNext()
  }

  reset(): void {
    this.active = null
    this.queue = []
    this.lastGlobalSpokeAt = -Infinity
    this.lastEventSpokeAt.clear()
    this.recentIdsByEvent.clear()
    this.seenDedupeKeys.clear()
    this.pauseReasons = { ...DEFAULT_PAUSE }
  }

  private drainNext(): ActiveDialogueBubble | null {
    if (this.pauseReasons.foxCollapsed || this.pauseReasons.pageHidden) {
      return null
    }
    while (this.queue.length > 0) {
      const next = this.queue.shift()!
      if (next.dedupeKey && this.seenDedupeKeys.has(next.dedupeKey)) {
        continue
      }
      return this.activate(next, this.now())
    }
    return null
  }

  private activate(input: DialogueEventInput, nowMs: number): ActiveDialogueBubble | null {
    const candidates = getEntriesForEvent(input.event, input.hour)
    if (candidates.length === 0) return this.active

    const picked = this.pickWeightedWithoutRepeat(input.event, candidates)
    const priority = EVENT_PRIORITY[input.event]

    if (input.dedupeKey) {
      this.seenDedupeKeys.add(input.dedupeKey)
    }
    this.lastGlobalSpokeAt = nowMs
    this.lastEventSpokeAt.set(input.event, nowMs)

    const recent = this.recentIdsByEvent.get(input.event) ?? []
    recent.push(picked.id)
    const cap = Math.min(this.maxRecentPerEvent, Math.max(1, candidates.length - 1))
    while (recent.length > cap) {
      recent.shift()
    }
    this.recentIdsByEvent.set(input.event, recent)

    const bubble: ActiveDialogueBubble = {
      instanceId: `dlg-${++this.seq}-${nowMs}`,
      entryId: picked.id,
      event: input.event,
      text: interpolateText(picked.text, input.taskTitle),
      emotion: picked.emotion,
      priority,
      durationMs: durationForPriority(priority),
      createdAt: nowMs,
      actionRoute: input.actionRoute,
      actionLabel: input.actionLabel,
      gateIEvent: VERIFIED_GATE_I_MAP[input.event]
    }
    this.active = bubble
    return bubble
  }

  private pickWeightedWithoutRepeat(
    event: DialogueEventType,
    candidates: RawDialogueEntry[]
  ): RawDialogueEntry {
    const recent = new Set(this.recentIdsByEvent.get(event) ?? [])
    const fresh = candidates.filter((c) => !recent.has(c.id))
    const pool = fresh.length > 0 ? fresh : candidates

    const totalWeight = pool.reduce((acc, item) => acc + (item.weight ?? 1), 0)
    let target = this.random() * totalWeight
    for (const item of pool) {
      target -= item.weight ?? 1
      if (target <= 0) return item
    }
    return pool[pool.length - 1]
  }
}
