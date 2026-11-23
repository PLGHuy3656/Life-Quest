import { ErrorBanner } from '@/components/ui/StateViews'
import {
  useGoalsWithMilestonesQuery,
  useQuestsQuery,
  useSocialPreviewQuery,
  useTodayQuery,
  useUserMeQuery
} from '@/hooks/useDashboardData'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { useUiStore } from '@/stores/uiStore'
import { GoalsProgressPanel } from './GoalsProgressPanel'
import { HeroSection } from './HeroSection'
import { MascotHeroPanel } from './MascotHeroPanel'
import { PinnedBoard } from './PinnedBoard'
import { SocialFeedSection } from './SocialFeedSection'
import { SocialPreviewPanel } from './SocialPreviewPanel'
import { TodayFeed } from './TodayFeed'
import styles from './DashboardPage.module.css'

/**
 * Production LifeQuest Home Dashboard (FE-03.5I).
 * - Desktop (>= 1024px): Social-First central feed inside the shared 3-region AppShell
 *   (LEFT: PinnedTaskRail, CENTER: SocialFeedSection, RIGHT: FoxCompanionRail).
 * - Tablet & Mobile (< 1024px): Preserves the existing responsive Dashboard untouched.
 */
export function DashboardPage() {
  const isDesktop = useIsDesktop()
  const searchQuery = useUiStore((s) => s.searchQuery)
  const openSheet = useUiStore((s) => s.openSheet)
  const pinnedRailCollapsed = useUiStore((s) => s.pinnedRailCollapsed)
  const foxRailCollapsed = useUiStore((s) => s.foxRailCollapsed)

  const userQuery = useUserMeQuery()
  const todayQuery = useTodayQuery()
  const questsQuery = useQuestsQuery(searchQuery)
  const goalsQuery = useGoalsWithMilestonesQuery()
  const socialQuery = useSocialPreviewQuery()

  const quests = questsQuery.data?.data ?? []
  const hasPinnedQuests = quests.some((q) => q.isPinned)
  const userName =
    userQuery.data?.data.profile?.displayName?.trim() ||
    userQuery.data?.data.username?.trim() ||
    'Bạn'
  const userInitial = userName.slice(0, 1).toUpperCase()

  if (isDesktop) {
    const bothSidePanelsMinimal = (!hasPinnedQuests || pinnedRailCollapsed) && foxRailCollapsed

    return (
      <div className={styles.stack} data-testid="dashboard-social-home">
        {questsQuery.error && (
          <div data-testid="dashboard-live-auth-error">
            <ErrorBanner error={questsQuery.error} onRetry={() => questsQuery.refetch()} />
          </div>
        )}

        <SocialFeedSection expandedWide={bothSidePanelsMinimal} userInitial={userInitial} />
      </div>
    )
  }

  /* Tablet & Mobile (< 1024px): preserved untouched */
  return (
    <div className={styles.stack}>
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

      <MascotHeroPanel user={userQuery.data?.data} today={todayQuery.data?.data} />

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
  )
}
