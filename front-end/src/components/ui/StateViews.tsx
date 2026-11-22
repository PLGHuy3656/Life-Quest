import type { ReactNode } from 'react'
import { ApiClientError, type DataSourceMode } from '@/types/api'
import { Button } from './Button'
import { Chip } from './Chip'
import styles from './StateViews.module.css'

export function SourceBadge({ source, title }: { source: DataSourceMode; title?: string }) {
  const tone =
    source === 'LIVE' ? 'success' : source === 'MOCK' ? 'reward' : 'danger'
  const label =
    source === 'LIVE' ? 'LIVE API' : source === 'MOCK' ? 'MOCK PREVIEW' : 'UNAVAILABLE'

  return (
    <Chip tone={tone} className="lq-source-badge">
      <span title={title}>{label}</span>
    </Chip>
  )
}

export function LoadingSkeleton({ height = 72 }: { height?: number }) {
  return (
    <div
      className={styles.skeleton}
      style={{ height }}
      aria-busy="true"
      aria-label="Đang tải dữ liệu"
    />
  )
}

export function ErrorBanner({
  error,
  onRetry
}: {
  error: unknown
  onRetry?: () => void
}) {
  const code = error instanceof ApiClientError ? error.code : 'UNEXPECTED_ERROR'
  const message =
    error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định khi tải dữ liệu.'

  return (
    <div className={styles.errorBox} role="alert">
      <div className={styles.errorTitle}>Không thể tải dữ liệu ({code})</div>
      <p className={styles.errorDetail}>{message}</p>
      {onRetry && (
        <div>
          <Button variant="ghost" size="sm" onClick={onRetry}>
            Thử lại
          </Button>
        </div>
      )}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className={styles.emptyBox}>
      <div className={styles.emptyTitle}>{title}</div>
      <p className={styles.emptyDesc}>{description}</p>
      {action}
    </div>
  )
}
