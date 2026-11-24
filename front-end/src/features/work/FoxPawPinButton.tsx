import type { MouseEvent } from 'react'
import styles from './WorkPage.module.css'

export interface FoxPawPinButtonProps {
  pinned: boolean
  taskTitle: string
  disabled?: boolean
  showLabel?: boolean
  onToggle: (e: MouseEvent<HTMLButtonElement>) => void
}

/**
 * FE-04A.2 Fox-paw stamp indicator for Task pinned state.
 * Reuses the approved LifeQuest fox-paw artwork from FoxPawToggle
 * without affecting side-rail collapse toggles.
 */
export function FoxPawPinButton({
  pinned,
  taskTitle,
  disabled = false,
  showLabel = false,
  onToggle
}: FoxPawPinButtonProps) {
  const label = pinned ? `Bỏ ghim ${taskTitle}` : `Ghim ${taskTitle}`

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={pinned}
      aria-label={label}
      title={pinned ? 'Đã ghim dấu chân Fox — nhấn để bỏ ghim' : 'Ghim lên thanh Ghim nhanh'}
      data-testid="fox-paw-pin-btn"
      data-pinned={pinned ? 'true' : 'false'}
      className={`${styles.pawPinBtn} ${pinned ? styles.pawPinBtnActive : ''} ${
        showLabel ? styles.pawPinBtnWithLabel : ''
      }`.trim()}
      onClick={(e) => {
        e.stopPropagation()
        onToggle(e)
      }}
    >
      <svg
        className={styles.pawStampIcon}
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
        aria-hidden="true"
      >
        <ellipse cx="6.2" cy="10.2" rx="2" ry="2.6" transform="rotate(-18 6.2 10.2)" />
        <ellipse cx="10.1" cy="7.1" rx="2" ry="2.7" transform="rotate(-6 10.1 7.1)" />
        <ellipse cx="14.3" cy="7.1" rx="2" ry="2.7" transform="rotate(6 14.3 7.1)" />
        <ellipse cx="18" cy="10.2" rx="2" ry="2.6" transform="rotate(18 18 10.2)" />
        <path d="M12 11.4c-2.6 0-5 2.1-5 4.4 0 1.6 1.2 2.6 2.7 2.6 1 0 1.6-.4 2.3-.4s1.3.4 2.3.4c1.5 0 2.7-1 2.7-2.6 0-2.3-2.4-4.4-5-4.4Z" />
      </svg>
      {showLabel && <span>{pinned ? 'Bỏ ghim' : 'Ghim lên thanh trái'}</span>}
    </button>
  )
}
