import { Target } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { EmptyState, ErrorBanner, LoadingSkeleton, SourceBadge } from '@/components/ui/StateViews'
import type { GoalWithMilestones } from '@/services/repositories/dashboardRepository'
import type { DataSourceMode } from '@/types/api'
import styles from './GoalsProgressPanel.module.css'

export interface GoalsProgressPanelProps {
  items: GoalWithMilestones[]
  source: DataSourceMode
  isLoading: boolean
  error?: unknown
  onRetry: () => void
}

export function GoalsProgressPanel({
  items,
  source,
  isLoading,
  error,
  onRetry
}: GoalsProgressPanelProps) {
  return (
    <Card>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Target size={18} color="#16324A" aria-hidden="true" />
          <h2 className={styles.heading}>Mục tiêu & Cột mốc</h2>
          <SourceBadge source={source} />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton height={140} />
      ) : error ? (
        <ErrorBanner error={error} onRetry={onRetry} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Chưa có mục tiêu đang chạy"
          description="Tạo mục tiêu và cột mốc để theo dõi tiến trình dài hạn từ Goals & Milestones API."
        />
      ) : (
        <div className={styles.list}>
          {items.map(({ goal, milestones }) => {
            const total = milestones.length
            const done = milestones.filter((m) => m.status === 'COMPLETED').length
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <div key={goal.id} className={styles.goalCard}>
                <div className={styles.goalHead}>
                  <span className={styles.goalTitle}>{goal.title}</span>
                  <Chip tone={pct === 100 ? 'success' : 'neutral'}>{pct}%</Chip>
                </div>
                <div className={styles.barTrack} aria-hidden="true">
                  <div className={styles.barFill} style={{ width: `${pct}%` }} />
                </div>
                <span className={styles.meta}>
                  {done}/{total} cột mốc hoàn thành • Hạn {goal.dueDate.slice(0, 10)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
