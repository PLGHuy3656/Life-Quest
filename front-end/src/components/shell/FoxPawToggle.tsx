import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './FoxPawToggle.module.css'

export interface FoxPawToggleProps {
  direction: 'left' | 'right'
  collapsed: boolean
  label: string
  onClick: () => void
}

/**
 * Approved LifeQuest Fox-paw collapse/expand affordance for shared Desktop side rails.
 */
export function FoxPawToggle({ direction, collapsed, label, onClick }: FoxPawToggleProps) {
  const pointLeft =
    (direction === 'left' && !collapsed) || (direction === 'right' && collapsed)

  return (
    <button
      type="button"
      className={`${styles.toggleBtn} ${collapsed ? styles.collapsed : ''}`.trim()}
      onClick={onClick}
      aria-label={label}
      title={label}
      data-testid={`fox-paw-toggle-${direction}`}
    >
      <svg
        className={styles.pawIcon}
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
      <span className={styles.chevronBadge} aria-hidden="true">
        {pointLeft ? (
          <ChevronLeft size={10} strokeWidth={2.8} />
        ) : (
          <ChevronRight size={10} strokeWidth={2.8} />
        )}
      </span>
    </button>
  )
}
