import { FoxDialogueEngine } from './FoxDialogueEngine'
import type {
  ActiveDialogueBubble,
  DialogueEventInput,
  DialoguePauseReasons
} from './types'

type Listener = (active: ActiveDialogueBubble | null) => void

/**
 * Centralized, typed dialogue bus backing the single overhead FoxSpeechBubble.
 * Decouples producers (Social lightbox, Dashboard sheets, pin mutations, route changes,
 * deadline monitor, idle timer) from React render cycles.
 */
class FoxDialogueBus {
  private readonly engine = new FoxDialogueEngine()
  private readonly listeners = new Set<Listener>()
  private expireTimer: number | null = null

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    listener(this.engine.getActive())
    return () => {
      this.listeners.delete(listener)
    }
  }

  getActive(): ActiveDialogueBubble | null {
    return this.engine.getActive()
  }

  isIdlePaused(): boolean {
    return this.engine.isIdlePaused()
  }

  setPauseReason(patch: Partial<DialoguePauseReasons>): void {
    const prev = this.engine.getActive()
    const next = this.engine.setPauseReason(patch)
    if (prev !== next) {
      this.scheduleAutoExpire(next)
      this.notify(next)
    }
  }

  emit(input: DialogueEventInput): ActiveDialogueBubble | null {
    const prev = this.engine.getActive()
    const res = this.engine.emit(input)
    if (res.active !== prev) {
      this.scheduleAutoExpire(res.active)
      this.notify(res.active)
    }
    return res.active
  }

  dismiss(): void {
    this.clearTimer()
    const next = this.engine.dismiss()
    this.scheduleAutoExpire(next)
    this.notify(next)
  }

  resetForTests(): void {
    this.clearTimer()
    this.engine.reset()
    this.notify(null)
  }

  private scheduleAutoExpire(bubble: ActiveDialogueBubble | null): void {
    this.clearTimer()
    if (!bubble || typeof window === 'undefined') return
    this.expireTimer = window.setTimeout(() => {
      this.expireTimer = null
      const next = this.engine.expire(bubble.instanceId)
      this.scheduleAutoExpire(next)
      this.notify(next)
    }, bubble.durationMs)
  }

  private clearTimer(): void {
    if (this.expireTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.expireTimer)
      this.expireTimer = null
    }
  }

  private notify(active: ActiveDialogueBubble | null): void {
    for (const listener of this.listeners) {
      listener(active)
    }
  }
}

export const foxDialogueBus = new FoxDialogueBus()
