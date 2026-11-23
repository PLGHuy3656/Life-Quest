import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { FoxDialogueEntry } from './foxDialogueCatalog'
import styles from './FoxSpeechBubble.module.css'

export interface FoxSpeechBubbleProps {
  dialogue: FoxDialogueEntry | null
  visible: boolean
  onDismiss: () => void
}

/**
 * Game-style overhead character speech bubble positioned above Fox V2's head
 * inside the FoxCompanionRail stage overlay (HTML/CSS only; zero WebGL changes).
 */
export function FoxSpeechBubble({ dialogue, visible, onDismiss }: FoxSpeechBubbleProps) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    setExiting(false)
  }, [dialogue?.id])

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

  const handleDismissClick = () => {
    setExiting(true)
    onDismiss()
  }

  return (
    <div
      key={dialogue.id}
      className={`${styles.anchor} ${exiting ? styles.exiting : ''}`.trim()}
      role="status"
      aria-live="polite"
      data-testid="fox-speech-bubble"
      data-trigger={dialogue.trigger}
    >
      <div className={styles.bubble}>
        <span className={styles.accentDot} aria-hidden="true" />
        <span className={styles.text}>{dialogue.text}</span>
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
      <span className={styles.tail} aria-hidden="true" />
    </div>
  )
}
