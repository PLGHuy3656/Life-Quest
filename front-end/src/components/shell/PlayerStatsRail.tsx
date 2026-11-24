import { useState } from 'react'
import { Award, Coins, Flame } from 'lucide-react'
import { useTodayQuery } from '@/hooks/useDashboardData'
import { useAuthStore } from '@/stores/authStore'
import styles from './PlayerStatsRail.module.css'

type StatId = 'streak' | 'coin' | 'level'

interface StatRow {
  id: StatId
  label: string
  value: string
  detail: string
  tone: 'streak' | 'coin' | 'level'
}

/**
 * FE-04A.3 Compact Left Player Stats Rail (Streak, Coin, Level).
 * - Same width (52px) as the collapsed PinnedTaskRail, stacked directly beneath it.
 * - Reads ONLY verified LIVE data from GET /api/v1/today when authenticated.
 * - Displays neutral "—" placeholders when unauthenticated, loading, or unavailable
 *   (never fabricates or hardcodes demo stats).
 */
export function PlayerStatsRail() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken.trim()))
  const todayQuery = useTodayQuery()
  const [openStat, setOpenStat] = useState<StatId | null>(null)

  const liveToday =
    isAuthenticated && todayQuery.data?.source === 'LIVE' ? todayQuery.data.data : null

  const streakVal = liveToday ? String(liveToday.streak.currentCount) : '—'
  const coinVal = liveToday ? String(liveToday.gamification.coinBalance) : '—'
  const levelVal = liveToday ? `L${liveToday.gamification.level}` : '—'

  const rows: StatRow[] = [
    {
      id: 'streak',
      label: 'Chuỗi ngày',
      value: streakVal,
      detail: liveToday
        ? `${liveToday.streak.currentCount} ngày liên tiếp (kỷ lục: ${liveToday.streak.longestCount})`
        : 'Đăng nhập để đồng bộ chuỗi ngày từ máy chủ',
      tone: 'streak'
    },
    {
      id: 'coin',
      label: 'Xu hiện có',
      value: coinVal,
      detail: liveToday
        ? `${liveToday.gamification.coinBalance} xu thưởng hiện có`
        : 'Đăng nhập để đồng bộ số xu từ máy chủ',
      tone: 'coin'
    },
    {
      id: 'level',
      label: 'Cấp độ hiện tại',
      value: levelVal,
      detail: liveToday
        ? `Cấp ${liveToday.gamification.level} • ${liveToday.gamification.totalXp} XP`
        : 'Đăng nhập để đồng bộ cấp độ từ máy chủ',
      tone: 'level'
    }
  ]

  return (
    <section
      className={styles.rail}
      aria-label="Chỉ số người chơi"
      data-testid="player-stats-rail"
      data-source={liveToday ? 'LIVE' : 'UNAVAILABLE'}
      onMouseLeave={() => setOpenStat(null)}
    >
      {rows.map((row) => {
        const isOpen = openStat === row.id
        const Icon = row.id === 'streak' ? Flame : row.id === 'coin' ? Coins : Award
        return (
          <div key={row.id} className={styles.itemWrap}>
            <button
              type="button"
              className={`${styles.statBtn} ${styles[`tone_${row.tone}`]}`}
              data-testid={`player-stat-${row.id}`}
              aria-label={`${row.label}: ${row.value} — ${row.detail}`}
              aria-describedby={isOpen ? `player-stat-tip-${row.id}` : undefined}
              onMouseEnter={() => setOpenStat(row.id)}
              onFocus={() => setOpenStat(row.id)}
              onBlur={() => setOpenStat((cur) => (cur === row.id ? null : cur))}
              onClick={() => setOpenStat((cur) => (cur === row.id ? null : row.id))}
            >
              <span className={styles.iconCircle} aria-hidden="true">
                <Icon size={14} strokeWidth={2.25} />
              </span>
              <span className={styles.valueText}>{row.value}</span>
            </button>

            {isOpen && (
              <div
                id={`player-stat-tip-${row.id}`}
                role="tooltip"
                className={styles.tooltip}
                data-testid={`player-stat-tooltip-${row.id}`}
              >
                <span className={styles.tipTitle}>{row.label}</span>
                <span className={styles.tipDetail}>{row.detail}</span>
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}
