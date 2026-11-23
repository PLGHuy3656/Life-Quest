import { MascotEventAdapter } from '@/features/mascot/MascotEventAdapter'
import {
  useGoalsWithMilestonesQuery,
  useQuestsQuery,
  useSocialPreviewQuery,
  useTodayQuery,
  useUserMeQuery
} from '@/hooks/useDashboardData'
import { useUiStore } from '@/stores/uiStore'
import { DashboardSheets } from './DashboardSheets'
import { GoalsProgressPanel } from './GoalsProgressPanel'
import { HeroSection } from './HeroSection'
import { MascotHeroPanel } from './MascotHeroPanel'
import { PinnedBoard } from './PinnedBoard'
import { SocialPreviewPanel } from './SocialPreviewPanel'
import { TodayFeed } from './TodayFeed'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const searchQuery = useUiStore((s) => s.searchQuery)
  const openSheet = useUiStore((s) => s.openSheet)

  const userQuery = useUserMeQuery()
  const todayQuery = useTodayQuery()
  const questsQuery = useQuestsQuery(searchQuery)
  const goalsQuery = useGoalsWithMilestonesQuery()
  const socialQuery = useSocialPreviewQuery()

  const quests = questsQuery.data?.data ?? []
  const authoritativeLevel =
    todayQuery.data?.source === 'LIVE' ? todayQuery.data.data.gamification.level : undefined

  return (
    <div className={styles.stack}>
      <MascotEventAdapter
        triggerGreetingOnMount
        authoritativeLevel={authoritativeLevel}
      />

      {/* Preserved untouched for Tablet & Mobile (< 1024px); hidden on Desktop */}
      <div className={styles.mobileHeroOnly}>
        <HeroSection
          user={userQuery.data?.data}
          today={todayQuery.data?.data}
          source={todayQuery.data?.source ?? userQuery.data?.source ?? 'MOCK'}
          isLoading={userQuery.isLoading || todayQuery.isLoading}
          error={userQuery.error || todayQuery.error}
          onRetry={() => {
            userQuery.refetch()
            todayQuery.refetch()
          }}
        />
      </div>

      {/* Desktop Main Showcase: Left = Bảng ghim + Social/Hành trình; Right = Mascot Greeting + Prompt */}
      <div className={styles.mainShowcase} data-testid="dashboard-main-showcase">
        <div className={styles.leftShowcase}>
          <PinnedBoard
            quests={quests}
            source={questsQuery.data?.source ?? 'MOCK'}
            isLoading={questsQuery.isLoading}
            error={questsQuery.error}
            onRetry={() => questsQuery.refetch()}
            onManagePins={() => openSheet('manage-pins')}
          />

          <SocialPreviewPanel
            items={socialQuery.data?.data ?? []}
            note={socialQuery.data?.note}
          />
        </div>

        <div className={styles.rightShowcase}>
          <MascotHeroPanel
            user={userQuery.data?.data}
            today={todayQuery.data?.data}
          />
        </div>
      </div>

      {/* Lower Dashboard sections remain cleanly accessible below */}
      <div className={styles.lowerGrid}>
        <TodayFeed
          quests={quests}
          schedules={todayQuery.data?.data.schedules ?? []}
          source={questsQuery.data?.source ?? 'MOCK'}
          isLoading={questsQuery.isLoading || todayQuery.isLoading}
          error={questsQuery.error || todayQuery.error}
          onRetry={() => {
            questsQuery.refetch()
            todayQuery.refetch()
          }}
          onQuickCreate={() => openSheet('quick-create')}
        />

        <GoalsProgressPanel
          items={goalsQuery.data?.data ?? []}
          source={goalsQuery.data?.source ?? 'MOCK'}
          isLoading={goalsQuery.isLoading}
          error={goalsQuery.error}
          onRetry={() => goalsQuery.refetch()}
        />
      </div>

      <DashboardSheets quests={quests} />
    </div>
  )
}
