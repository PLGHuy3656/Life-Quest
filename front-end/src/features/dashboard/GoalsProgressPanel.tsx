import { Calendar, Flag, Target } from 'lucide-react'
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
          <span className={styles.sectionIcon} aria-hidden="true">
            <Target size={16} />
          </span>
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
                  <div className={styles.goalTitleRow}>
                    <span className={styles.milestoneIcon} aria-hidden="true">
                      <Flag size={13} />
                    </span>
                    <span className={styles.goalTitle}>{goal.title}</span>
                  </div>
                  <Chip tone={pct === 100 ? 'success' : 'accent'}>{pct}%</Chip>
                </div>
                <div className={styles.barTrack} aria-hidden="true">
                  <div className={styles.barFill} style={{ width: `${pct}%` }} />
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.meta}>
                    <Flag size={12} aria-hidden="true" />
                    <span>
                      {done}/{total} cột mốc hoàn thành
                    </span>
                  </span>
                  <span className={styles.meta}>
                    <Calendar size={12} aria-hidden="true" />
                    <span>Hạn {goal.dueDate.slice(0, 10)}</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
