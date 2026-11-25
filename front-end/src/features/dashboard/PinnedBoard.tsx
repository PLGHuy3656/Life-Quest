import { Pin, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { QuestTypeBadge, RewardCoinBadge, RewardXpBadge } from '@/components/ui/QuestIcons'
import { QUEST_TYPE_META } from '@/components/ui/questIconMeta'
import { EmptyState, ErrorBanner, LoadingSkeleton, SourceBadge } from '@/components/ui/StateViews'
import type { DataSourceMode } from '@/types/api'
import type { Quest } from '@/types/domain'
import styles from './PinnedBoard.module.css'

export const MAX_PINNED_CARDS = 3

export interface PinnedBoardProps {
  quests: Quest[]
  source: DataSourceMode
  isLoading: boolean
  error?: unknown
  onRetry: () => void
  onManagePins: () => void
}

export function PinnedBoard({
  quests,
  source,
  isLoading,
  error,
  onRetry,
  onManagePins
}: PinnedBoardProps) {
  const pinnedQuests = quests.filter((q) => q.isPinned).slice(0, MAX_PINNED_CARDS)

  return (
    <Card compact data-testid="pinned-board-card">
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.sectionIcon} aria-hidden="true">
            <Pin size={16} />
          </span>
          <h2 className={styles.heading}>Bảng ghim</h2>
          <Chip tone="accent">
            {pinnedQuests.length}/{MAX_PINNED_CARDS}
          </Chip>
          <SourceBadge source={source} />
        </div>
        <Button variant="ghost" size="sm" onClick={onManagePins}>
          <SlidersHorizontal size={14} aria-hidden="true" />
          <span>Quản lý ghim</span>
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton height={110} />
      ) : error ? (
        <ErrorBanner error={error} onRetry={onRetry} />
      ) : pinnedQuests.length === 0 ? (
        <EmptyState
          title="Chưa có nhiệm vụ nào được ghim"
          description="Ghim tối đa 3 nhiệm vụ quan trọng nhất để giữ tập trung ngay đầu bảng điều khiển."
          action={
            <Button variant="subtle" size="sm" onClick={onManagePins}>
              Chọn nhiệm vụ để ghim
            </Button>
          }
        />
      ) : (
        <div className={styles.grid} data-testid="pinned-board-grid">
          {pinnedQuests.map((quest) => {
            const typeMeta = QUEST_TYPE_META[quest.type]
            const TypeIcon = typeMeta.Icon
            return (
              <article key={quest.id} className={styles.pinCard} data-testid="pinned-quest-card">
                <div className={styles.pinBody}>
                  <div className={styles.pinTopRow}>
                    <span
                      className={styles.pinTypeIcon}
                      style={{ background: typeMeta.softBg, color: typeMeta.color }}
                      aria-hidden="true"
                    >
                      <TypeIcon size={15} strokeWidth={2.2} />
                    </span>
                    <QuestTypeBadge type={quest.type} />
                  </div>
                  <h3 className={styles.pinTitle}>{quest.title}</h3>
                  {quest.description && <p className={styles.pinDesc}>{quest.description}</p>}
                </div>
                <div className={styles.pinMeta}>
                  <RewardXpBadge xp={quest.xpReward} />
                  <RewardCoinBadge coins={quest.coinReward} />
                </div>
              </article>
            )
          })}
        </div>
      )}
    </Card>
  )
}
