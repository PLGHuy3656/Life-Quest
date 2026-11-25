import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.css'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'tinted'
  compact?: boolean
}

export function Card({
  children,
  variant = 'default',
  compact = false,
  className = '',
  ...rest
}: CardProps) {
  const classes = [
    styles.card,
    compact ? styles.compact : '',
    variant === 'elevated' ? styles.elevated : '',
    variant === 'tinted' ? styles.tinted : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}
