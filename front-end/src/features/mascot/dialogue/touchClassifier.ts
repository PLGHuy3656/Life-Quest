import type { DialogueEventType } from './types'

export type TouchDialogueEvent = Extract<
  DialogueEventType,
  'TOUCH_SINGLE' | 'TOUCH_REPEAT' | 'TOUCH_SLEEP' | 'TOUCH_RETURN'
>

export interface FoxTouchClassifierOptions {
  /** Minimum gap between distinct touches to prevent pointer+click double firing */
  debounceMs?: number
  /** Window within which consecutive touches count as playful repeated taps */
  repeatWindowMs?: number
  /** Verified inactivity gap since last touch that triggers a welcome-back reaction */
  returnGapMs?: number
  now?: () => number
}

/**
 * Classifies verified user touches on Fox V2 into TOUCH_SINGLE, TOUCH_REPEAT,
 * TOUCH_SLEEP (only when sleep is actually active — never inferred from clock),
 * or TOUCH_RETURN (after a verified interaction gap).
 */
export class FoxTouchClassifier {
  private readonly debounceMs: number
  private readonly repeatWindowMs: number
  private readonly returnGapMs: number
  private readonly now: () => number

  private lastTouchAt: number | null = null

  constructor(options: FoxTouchClassifierOptions = {}) {
    this.debounceMs = options.debounceMs ?? 250
    this.repeatWindowMs = options.repeatWindowMs ?? 4_000
    this.returnGapMs = options.returnGapMs ?? 10 * 60 * 1000
    this.now = options.now ?? (() => Date.now())
  }

  classify(context: { isSleeping: boolean }): TouchDialogueEvent | null {
    const t = this.now()
    if (this.lastTouchAt !== null && t - this.lastTouchAt < this.debounceMs) {
      return null
    }

    const prev = this.lastTouchAt
    this.lastTouchAt = t

    if (context.isSleeping) {
      return 'TOUCH_SLEEP'
    }

    if (prev !== null && t - prev >= this.returnGapMs) {
      return 'TOUCH_RETURN'
    }

    if (prev !== null && t - prev <= this.repeatWindowMs) {
      return 'TOUCH_REPEAT'
    }

    return 'TOUCH_SINGLE'
  }

  reset(): void {
    this.lastTouchAt = null
  }
}
