import { useState } from 'react'
import { CheckCircle2, Clock, Coins, Compass, Pin, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { QuestTypeBadge } from '@/components/ui/QuestIcons'
import { QUEST_TYPE_META } from '@/components/ui/questIconMeta'
import { EmptyState, ErrorBanner, LoadingSkeleton, SourceBadge } from '@/components/ui/StateViews'
import { dashboardRepository } from '@/services/repositories/dashboardRepository'
import type { DataSourceMode } from '@/types/api'
import type { Quest, TodayScheduleItem } from '@/types/domain'
import styles from './TodayFeed.module.css'

export interface TodayFeedProps {
  quests: Quest[]
  schedules: TodayScheduleItem[]
  source: DataSourceMode
  isLoading: boolean
  error?: unknown
  onRetry: () => void
  onQuickCreate: () => void
}

export function TodayFeed({
  quests,
  schedules,
  source,
  isLoading,
  error,
  onRetry,
  onQuickCreate
}: TodayFeedProps) {
  const [unavailableMsg, setUnavailableMsg] = useState<string | null>(null)

  const handleCompleteClick = async () => {
    try {
      await dashboardRepository.completeQuestExecution()
    } catch (err) {
      setUnavailableMsg(
        err instanceof Error
          ? err.message
          : 'Chức năng ghi nhận hoàn thành Quest chưa khả dụng trên Backend.'
      )
    }
  }

  return (
    <Card>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.sectionIcon} aria-hidden="true">
            <Compass size={16} />
          </span>
          <h2 className={styles.heading}>Nhiệm vụ hôm nay</h2>
          <SourceBadge source={source} />
        </div>
        <Button variant="subtle" size="sm" onClick={onQuickCreate}>
          + Thêm nhiệm vụ
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton height={160} />
      ) : error ? (
        <ErrorBanner error={error} onRetry={onRetry} />
      ) : quests.length === 0 ? (
        <EmptyState
          title="Chưa có nhiệm vụ đang hoạt động"
          description="Tạo nhiệm vụ đầu tiên để bắt đầu theo dõi tiến độ hôm nay."
          action={
            <Button variant="accent" size="sm" onClick={onQuickCreate}>
              Tạo nhiệm vụ mới
            </Button>
          }
        />
      ) : (
        <div className={styles.list}>
          {quests.slice(0, 5).map((quest) => {
            const sched = schedules.find((s) => s.questId === quest.id)
            const typeMeta = QUEST_TYPE_META[quest.type]
            const TypeIcon = typeMeta.Icon
            return (
              <div key={quest.id} className={styles.item}>
                <div className={styles.itemLead}>
                  <span
                    className={styles.typeTile}
                    style={{ background: typeMeta.softBg, color: typeMeta.color }}
                    aria-hidden="true"
                  >
                    <TypeIcon size={16} strokeWidth={2.2} />
                  </span>
                  <div className={styles.itemMain}>
                    <span className={styles.itemTitle}>{quest.title}</span>
                    <div className={styles.itemMetaRow}>
                      <QuestTypeBadge type={quest.type} />
                      {sched && (
                        <span className={styles.metaChip}>
                          <Clock size={12} aria-hidden="true" />
                          <span>{sched.timeOfDay}</span>
                        </span>
                      )}
                      <span className={styles.metaChip}>
                        <Sparkles size={12} color="#B88200" aria-hidden="true" />
                        <span>+{quest.xpReward} XP</span>
                      </span>
                      {quest.coinReward > 0 && (
                        <span className={styles.metaChip}>
                          <Coins size={12} color="#B88200" aria-hidden="true" />
                          <span>+{quest.coinReward}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.itemActions}>
                  {quest.isPinned && (
                    <Chip tone="accent">
                      <Pin size={11} aria-hidden="true" />
                      <span>Đã ghim</span>
                    </Chip>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCompleteClick}
                    aria-label={`Hoàn thành ${quest.title}`}
                  >
                    <CheckCircle2 size={15} aria-hidden="true" />
                    <span>Hoàn thành</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {unavailableMsg && (
        <div className={styles.notice} role="status">
          <strong>UNAVAILABLE:</strong> {unavailableMsg}
        </div>
      )}
    </Card>
  )
}
