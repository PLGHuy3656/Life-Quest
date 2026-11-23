import { Clock, Coins, Pin, SlidersHorizontal, Sparkles } from 'lucide-react'
import { QUEST_TYPE_META } from '@/components/ui/questIconMeta'
import { MAX_PINNED_CARDS } from '@/features/dashboard/PinnedBoard'
import { useQuestsQuery, useTodayQuery } from '@/hooks/useDashboardData'
import { useUiStore } from '@/stores/uiStore'
import { FoxPawToggle } from './FoxPawToggle'
import styles from './PinnedTaskRail.module.css'

/**
 * Shared Desktop LEFT PinnedTaskRail promoted into AppShell (FE-03.5I).
 * - Reads pinned quests from verified Backend APIs (or explicit hybrid dev preview).
 * - Automatically hides when 0 pinned tasks exist.
 * - Persists collapse/expand state across routes via uiStore.
 */
export function PinnedTaskRail() {
  const collapsed = useUiStore((s) => s.pinnedRailCollapsed)
  const toggleCollapsed = useUiStore((s) => s.togglePinnedRail)
  const openSheet = useUiStore((s) => s.openSheet)

  const questsQuery = useQuestsQuery()
  const todayQuery = useTodayQuery()

  const quests = questsQuery.data?.data ?? []
  const schedules = todayQuery.data?.data.schedules ?? []
  const pinnedQuests = quests.filter((q) => q.isPinned).slice(0, MAX_PINNED_CARDS)

  // Auto-hide completely when no pinned tasks exist
  if (pinnedQuests.length === 0) {
    return null
  }

  if (collapsed) {
    return (
      <div
        className={styles.railCollapsed}
        role="region"
        data-testid="shared-pinned-rail"
        data-state="collapsed"
        aria-label="Bảng ghim đang thu gọn"
      >
        <FoxPawToggle
          direction="left"
          collapsed
          label="Mở rộng Bảng ghim"
          onClick={toggleCollapsed}
        />

        <span className={styles.countBadge} title={`${pinnedQuests.length} nhiệm vụ đang ghim`}>
          <Pin size={10} aria-hidden="true" />
          <span>{pinnedQuests.length}</span>
        </span>

        <div className={styles.collapsedDots}>
          {pinnedQuests.map((quest) => {
            const meta = QUEST_TYPE_META[quest.type]
            const Icon = meta.Icon
            return (
              <button
                key={quest.id}
                type="button"
                className={styles.collapsedIconBtn}
                style={{ background: meta.softBg, color: meta.color }}
                onClick={toggleCollapsed}
                title={quest.title}
                aria-label={`Xem nhiệm vụ đã ghim: ${quest.title}`}
              >
                <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div
      className={styles.railExpanded}
      role="region"
      data-testid="shared-pinned-rail"
      data-state="expanded"
      aria-label="Bảng ghim nhiệm vụ"
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <Pin size={14} className={styles.headerPin} aria-hidden="true" />
          <h2 className={styles.heading}>Ghim nhanh</h2>
          <span className={styles.countPill}>
            {pinnedQuests.length}/{MAX_PINNED_CARDS}
          </span>
        </div>

        <FoxPawToggle
          direction="left"
          collapsed={false}
          label="Thu gọn Bảng ghim"
          onClick={toggleCollapsed}
        />
      </div>

      <div className={styles.list}>
        {pinnedQuests.map((quest, idx) => {
          const meta = QUEST_TYPE_META[quest.type]
          const Icon = meta.Icon
          const sched = schedules.find((s) => s.questId === quest.id)

          return (
            <article
              key={quest.id}
              data-testid="rail-pinned-snippet"
              className={`${styles.snippet} ${
                idx === 1 ? styles.snippetMint : idx === 2 ? styles.snippetGold : styles.snippetPeach
              }`}
            >
              <span
                className={styles.typeIcon}
                style={{ background: meta.softBg, color: meta.color }}
                aria-hidden="true"
              >
                <Icon size={14} strokeWidth={2.25} />
              </span>

              <div className={styles.snippetBody}>
                <div className={styles.snippetTop}>
                  <span className={styles.typeTag} style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  {sched?.timeOfDay && (
                    <span className={styles.timeTag}>
                      <Clock size={10} aria-hidden="true" />
                      <span>{sched.timeOfDay}</span>
                    </span>
                  )}
                </div>

                <h3 className={styles.snippetTitle}>{quest.title}</h3>

                <div className={styles.snippetMeta}>
                  <span className={styles.xpTag}>
                    <Sparkles size={10} aria-hidden="true" />
                    <span>+{quest.xpReward} XP</span>
                  </span>
                  {quest.coinReward > 0 && (
                    <span className={styles.coinTag}>
                      <Coins size={10} aria-hidden="true" />
                      <span>+{quest.coinReward}</span>
                    </span>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <button
        type="button"
        className={styles.manageBtn}
        onClick={() => openSheet('manage-pins')}
      >
        <SlidersHorizontal size={12} aria-hidden="true" />
        <span>Quản lý ghim</span>
      </button>
    </div>
  )
}
