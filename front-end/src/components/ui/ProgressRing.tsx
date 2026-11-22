import styles from './ProgressRing.module.css'

export interface ProgressRingProps {
  percentage: number
  size?: number
  strokeWidth?: number
  label?: string
}

export function ProgressRing({
  percentage,
  size = 64,
  strokeWidth = 6,
  label
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - clamped / 100)

  return (
    <div
      className={styles.wrap}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg className={styles.svg} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className={styles.track}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className={styles.bar}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <span className={styles.label}>{label ?? `${clamped}%`}</span>
    </div>
  )
}
