import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import type { ActiveDialogueBubble } from './dialogue/types'
import styles from './FoxSpeechBubble.module.css'

export interface FoxSpeechBubbleProps {
  dialogue: ActiveDialogueBubble | null
  visible: boolean
  onDismiss: () => void
}

/**
 * Game-style overhead character speech bubble positioned directly above Fox V2's head
 * inside the FoxCompanionRail stage overlay (HTML/CSS only; zero WebGL changes).
 * Supports subtle emotion-specific visual variants (neutral/happy/alert/panic)
 * and optional concise action link for urgent deadline alerts.
 */
export function FoxSpeechBubble({ dialogue, visible, onDismiss }: FoxSpeechBubbleProps) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    setExiting(false)
  }, [dialogue?.instanceId])

  useEffect(() => {
    if (!dialogue || !visible) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dialogue, visible, onDismiss])

  if (!dialogue || !visible) {
    return null
  }

  const emotionClass =
    dialogue.emotion === 'panic'
      ? styles.emotionPanic
      : dialogue.emotion === 'alert'
        ? styles.emotionAlert
        : dialogue.emotion === 'happy' || dialogue.emotion === 'encouraging'
          ? styles.emotionWarm
          : ''

  const handleDismissClick = () => {
    setExiting(true)
    onDismiss()
  }

  return (
    <div
      key={dialogue.instanceId}
      className={`${styles.anchor} ${exiting ? styles.exiting : ''}`.trim()}
      role="status"
      aria-live={dialogue.emotion === 'panic' ? 'assertive' : 'polite'}
      data-testid="fox-speech-bubble"
      data-trigger={dialogue.event}
      data-emotion={dialogue.emotion}
    >
      <div className={`${styles.bubble} ${emotionClass}`.trim()}>
        <span className={styles.accentDot} aria-hidden="true" />
        <div className={styles.body}>
          <span className={styles.text}>{dialogue.text}</span>
          {dialogue.actionRoute && dialogue.actionLabel && (
            <Link
              to={dialogue.actionRoute}
              className={styles.actionLink}
              onClick={onDismiss}
            >
              {dialogue.actionLabel} →
            </Link>
          )}
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={handleDismissClick}
          aria-label="Đóng lời thoại của Fox"
          title="Đóng (Esc)"
        >
          <X size={11} aria-hidden="true" />
        </button>
      </div>
      <span className={`${styles.tail} ${emotionClass}`.trim()} aria-hidden="true" />
    </div>
  )
}
