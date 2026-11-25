import type { ReactNode } from 'react'
import styles from './Chip.module.css'

export interface ChipProps {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'success' | 'reward' | 'danger'
  className?: string
}

export function Chip({ children, tone = 'neutral', className = '' }: ChipProps) {
  return <span className={`${styles.chip} ${styles[tone]} ${className}`.trim()}>{children}</span>
}
