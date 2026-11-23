import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import type { FoxPresentation } from '@/mascot/FoxLevelScale'
import styles from './FoxFallback.module.css'

const POSTER_URL = `${import.meta.env.BASE_URL}fox_poster.png`

export interface FoxFallbackProps {
  reason: 'webgl' | 'context-lost' | 'load'
  presentation: FoxPresentation
  error?: unknown
  onRetry?: () => void
}

export function FoxFallback({ reason, presentation, error, onRetry }: FoxFallbackProps) {
  const compact = presentation === 'mini'
  const isContractError =
    typeof error === 'object' && error !== null && (error as { kind?: string }).kind === 'contract'
  const message =
    reason === 'webgl'
      ? 'Trình duyệt không hỗ trợ 3D (WebGL), đang hiển thị ảnh tĩnh Fox V2.'
      : reason === 'context-lost'
        ? 'Ngữ cảnh đồ họa 3D tạm ngắt (WebGL context lost). Đang chờ khôi phục.'
        : isContractError
          ? 'Mô hình Fox V2 không khớp hợp đồng runtime.'
          : 'Không thể tải mô hình 3D Fox V2.'

  return (
    <div
      className={styles.fallback}
      data-testid="fox-fallback"
      data-reason={reason}
      role="img"
      aria-label={`Bạn đồng hành Cáo V2. ${message}`}
    >
      <img src={POSTER_URL} alt="" className={styles.poster} draggable={false} />
      <Chip tone="accent">Fox V2 • Fallback</Chip>
      {!compact && <p className={styles.message}>{message}</p>}
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Thử lại 3D
        </Button>
      )}
    </div>
  )
}
