import { Flame, Coins, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { ErrorBanner, LoadingSkeleton, SourceBadge } from '@/components/ui/StateViews'
import { FoxCompanionView } from '@/features/mascot/FoxCompanionView'
import type { DataSourceMode } from '@/types/api'
import type { TodayData, UserMe } from '@/types/domain'
import styles from './HeroSection.module.css'

function getVietnameseGreeting(hour: number): string {
  if (hour < 12) return 'Chào buổi sáng'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

export interface HeroSectionProps {
  user?: UserMe
  today?: TodayData
  source: DataSourceMode
  isLoading: boolean
  error?: unknown
  onRetry: () => void
}

export function HeroSection({
  user,
  today,
  source,
  isLoading,
  error,
  onRetry
}: HeroSectionProps) {
  if (isLoading) {
    return (
      <Card variant="tinted">
        <LoadingSkeleton height={210} />
      </Card>
    )
  }

  if (error) {
    return (
      <Card variant="tinted">
        <div className={styles.heroGrid}>
          <div className={styles.left}>
            <ErrorBanner error={error} onRetry={onRetry} />
          </div>
          <FoxCompanionView presentation="widget" label="Bạn đồng hành Cáo V2" />
        </div>
      </Card>
    )
  }

  // Neutral fallback — never hardcodes any personal name
  const displayName = user?.profile?.displayName?.trim() || user?.username?.trim() || 'Bạn'
  const greetingPrefix = getVietnameseGreeting(new Date().getHours())

  const level = today?.gamification.level ?? 1
  const totalXp = today?.gamification.totalXp ?? 0
  const xpInLevel = totalXp % 500
  const xpPercent = Math.round((xpInLevel / 500) * 100)
  const coinBalance = today?.gamification.coinBalance ?? 0
  const streakCount = today?.streak.currentCount ?? 0
  const focusMinutes = Math.round((today?.summary.totalFocusDurationSeconds ?? 0) / 60)

  return (
    <Card variant="tinted">
      <div className={styles.heroGrid}>
        <div className={styles.left}>
          <div>
            <div className={styles.topRow}>
              <Chip tone="neutral">
                <Sparkles size={13} aria-hidden="true" />
                <span>{user?.profile?.title || 'Hành trình hôm nay'}</span>
              </Chip>
              <SourceBadge source={source} />
            </div>

            <h1 className={styles.greeting}>
              {greetingPrefix}, {displayName}!
            </h1>
            <p className={styles.subtitle}>
              {today
                ? `Hôm nay (${today.date}) • Hoàn thành ${today.summary.completedTasks}/${today.summary.totalTasks} nhiệm vụ.`
                : 'Bắt đầu ngày mới với những bước tiến nhỏ nhưng đều đặn.'}
            </p>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statTile}>
              <span className={styles.statLabel}>Chuỗi ngày (Streak)</span>
              <span className={styles.statValue}>
                <Flame size={16} style={{ display: 'inline', verticalAlign: '-2px', color: '#F26B3A' }} />{' '}
                {streakCount} ngày
              </span>
              <span className={styles.statHint}>
                {today?.streak.isQualifiedToday ? 'Đã giữ chuỗi hôm nay' : 'API streak đang ở mức 0'}
              </span>
            </div>

            <div className={styles.statTile}>
              <span className={styles.statLabel}>Xu thưởng (Coin)</span>
              <span className={styles.statValue}>
                <Coins size={16} style={{ display: 'inline', verticalAlign: '-2px', color: '#D49A00' }} />{' '}
                {coinBalance.toLocaleString('vi-VN')}
              </span>
              <span className={styles.statHint}>Đồng bộ UserGamification</span>
            </div>

            <div className={styles.statTile}>
              <span className={styles.statLabel}>Tập trung hôm nay</span>
              <span className={styles.statValue}>{focusMinutes} phút</span>
              <span className={styles.statHint}>Từ GET /api/v1/today</span>
            </div>
          </div>

          <div className={styles.progressStrip}>
            <div className={styles.xpMeta}>
              <div className={styles.xpHead}>
                <span>Cấp độ {level}</span>
                <span>{totalXp.toLocaleString('vi-VN')} XP</span>
              </div>
              <div className={styles.xpBarTrack} aria-hidden="true">
                <div className={styles.xpBarFill} style={{ width: `${xpPercent}%` }} />
              </div>
            </div>
            <ProgressRing
              percentage={today?.summary.completionRatePercentage ?? 0}
              size={58}
              strokeWidth={5}
            />
          </div>
        </div>

        <FoxCompanionView presentation="widget" label="Bạn đồng hành Cáo V2" />
      </div>
    </Card>
  )
}
