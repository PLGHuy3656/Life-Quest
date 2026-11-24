import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronRight, Info, PawPrint } from 'lucide-react'
import { FoxPawPinButton } from './FoxPawPinButton'
import { HabitDetailModal } from './HabitDetailModal'
import { PROTOTYPE_HABITS, WEEK_DAYS, type PrototypeHabit } from './habitPrototypeData'
import { WorkHubSwitcher } from './WorkHubSwitcher'
import styles from './WorkPage.module.css'

const CATEGORY_META: Record<PrototypeHabit['category'], { label: string; className: string }> = {
  health: { label: 'Sức khỏe', className: styles.habitCatHealth },
  focus: { label: 'Tập trung', className: styles.habitCatFocus },
  mind: { label: 'Học tập', className: styles.habitCatMind }
}

interface CurrentWeekDay {
  dayLabel: string
  dateLabel: string
  isToday: boolean
}

function buildCurrentWeekDays(now = new Date()): CurrentWeekDay[] {
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayDow = (todayMid.getDay() + 6) % 7 // 0 = T2 .. 6 = CN
  const monday = new Date(
    todayMid.getFullYear(),
    todayMid.getMonth(),
    todayMid.getDate() - todayDow
  )

  return WEEK_DAYS.map((dayLabel, idx) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx)
    return {
      dayLabel,
      dateLabel: `${d.getDate()}/${d.getMonth() + 1}`,
      isToday: idx === todayDow
    }
  })
}

export function HabitsPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedHabit, setSelectedHabit] = useState<PrototypeHabit | null>(null)
  const [pinnedHabitIds, setPinnedHabitIds] = useState<Record<string, boolean>>({
    'hab-proto-1': true
  })
  const currentWeekDays = useMemo(() => buildCurrentWeekDays(), [])

  const toggleHabitPin = (habitId: string) => {
    setPinnedHabitIds((prev) => ({ ...prev, [habitId]: !prev[habitId] }))
  }

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={styles.stack} data-testid="work-habits-page">
      <WorkHubSwitcher />

      {/* Honest Prototype Notice */}
      <div className={styles.pendingNotice} role="status" data-testid="habit-pending-banner">
        <Info size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
        <strong>PROTOTYPE • PENDING API:</strong> Backend hiện chưa có bảng <code>Habit</code> hoặc
        API check-in / streak. Các nút check-in được khóa chủ động để không giả lập chuỗi ngày hay
        XP.
      </div>

      {/* Habit Cards (Clean single-row layout matching reference, minimal tags, Fox-paw streak) */}
      <div className={styles.taskList} data-testid="habit-list">
        {PROTOTYPE_HABITS.map((habit) => {
          const catMeta = CATEGORY_META[habit.category]
          const todayIdx = currentWeekDays.findIndex((d) => d.isToday)
          return (
            <article
              key={habit.id}
              className={`${styles.habitRowCard} ${styles.habitCardClickable}`}
              data-testid="habit-card"
              onClick={() => setSelectedHabit(habit)}
            >
              {/* Left Check Circle (honest disabled pending Habit API) */}
              <button
                type="button"
                className={styles.habitCheckCircle}
                disabled
                onClick={(e) => e.stopPropagation()}
                title="Check-in thói quen sẽ hoạt động khi Backend bổ sung Habit API"
                aria-label={`Check-in ${habit.title} (chờ Habit API)`}
              >
                <Check size={15} aria-hidden="true" />
              </button>

              {/* Title + minimal 1-tag + cadence line */}
              <div className={styles.habitRowInfo}>
                <span className={styles.taskTitle}>{habit.title}</span>
                <div className={styles.habitSubline}>
                  <span className={`${styles.habitCatPill} ${catMeta.className}`}>
                    {catMeta.label}
                  </span>
                  <span className={styles.habitCadenceText}>{habit.shortCadence}</span>
                </div>
              </div>

              {/* 7-Day Inline Weekly Dots (T2..CN) */}
              <div className={styles.habitDotsGroup} aria-label="Tiến độ trong tuần">
                {currentWeekDays.map((day, idx) => {
                  const planned = habit.plannedDays[idx]
                  const isToday = day.isToday
                  const isFuture = todayIdx >= 0 && idx > todayIdx
                  const dotClass = isToday
                    ? styles.habitDotToday
                    : isFuture
                      ? styles.habitDotFuture
                      : planned
                        ? styles.habitDotDone
                        : styles.habitDotOff

                  return (
                    <span
                      key={day.dayLabel}
                      className={styles.habitDotCol}
                      title={`${day.dayLabel} (${day.dateLabel})`}
                    >
                      <span className={`${styles.habitDot} ${dotClass}`} />
                      <span
                        className={`${styles.habitDotLabel} ${
                          isToday ? styles.habitDotLabelToday : ''
                        }`}
                      >
                        {day.dayLabel}
                      </span>
                    </span>
                  )
                })}
              </div>

              {/* Fox-Paw Streak Indicator */}
              <div
                className={styles.habitStreakCol}
                title="Chuỗi ngày liên tiếp (mẫu xem trước — chờ Habit API)"
                data-testid="habit-paw-streak"
              >
                <span className={styles.habitStreakTop}>
                  <PawPrint size={14} className={styles.habitPawIcon} aria-hidden="true" />
                  <strong className={styles.habitStreakNum}>{habit.previewCurrentStreak}</strong>
                </span>
                <span className={styles.habitStreakSub}>ngày liên tiếp</span>
              </div>

              {/* Synced Fox-Paw Pin Stamp + Chevron (identical to Task cards) */}
              <div className={styles.taskActions} onClick={(e) => e.stopPropagation()}>
                <FoxPawPinButton
                  pinned={Boolean(pinnedHabitIds[habit.id])}
                  taskTitle={habit.title}
                  onToggle={() => toggleHabitPin(habit.id)}
                />
                <button
                  type="button"
                  className={styles.iconActionBtn}
                  onClick={() => setSelectedHabit(habit)}
                  aria-label={`Xem chi tiết ${habit.title}`}
                  data-testid={`habit-open-${habit.id}`}
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {/* Sticky Glass Weekly Rhythm Dock (Bottom sticky like Task & Quest pages) */}
      <section
        className={`${styles.habitStickyRhythm} ${styles.stickyGlassToolbar} ${
          isScrolled ? styles.stickyGlassScrolled : ''
        }`.trim()}
        aria-label="Nhịp thói quen trong tuần"
        data-testid="habit-weekly-rhythm"
      >
        <div className={styles.weekHeader}>
          <h2 className={styles.sectionHeading}>Nhịp thói quen trong tuần</h2>
          <span className={styles.pendingPill}>LỊCH DỰ KIẾN</span>
        </div>

        <div className={styles.weekGrid} role="list" aria-label="Các ngày trong tuần">
          {currentWeekDays.map((day, i) => (
            <div
              key={day.dayLabel}
              className={`${styles.weekDayCell} ${day.isToday ? styles.weekDayCellToday : ''}`}
              role="listitem"
            >
              <span className={styles.weekDayLabel}>{day.dayLabel}</span>
              <span className={styles.weekDayCount}>{day.dateLabel}</span>
              <span className={styles.weekDayBar}>
                <span
                  className={styles.weekDayBarFill}
                  style={{
                    width: `${Math.round(
                      (PROTOTYPE_HABITS.filter((h) => h.plannedDays[i]).length /
                        PROTOTYPE_HABITS.length) *
                        100
                    )}%`
                  }}
                />
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Habit Detail Modal */}
      <HabitDetailModal
        habit={selectedHabit}
        pinned={selectedHabit ? Boolean(pinnedHabitIds[selectedHabit.id]) : false}
        onTogglePin={() => {
          if (selectedHabit) toggleHabitPin(selectedHabit.id)
        }}
        onClose={() => setSelectedHabit(null)}
      />
    </div>
  )
}
