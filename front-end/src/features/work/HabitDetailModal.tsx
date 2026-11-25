import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronRight, PawPrint, Send, X } from 'lucide-react'
import { FoxPawPinButton } from './FoxPawPinButton'
import { WEEK_DAYS, type HabitDayCellState, type PrototypeHabit } from './habitPrototypeData'
import styles from './WorkPage.module.css'

export interface HabitDetailModalProps {
  habit: PrototypeHabit | null
  pinned?: boolean
  onTogglePin?: () => void
  onClose: () => void
}

const CATEGORY_LABEL: Record<PrototypeHabit['category'], string> = {
  health: 'Sức khỏe',
  focus: 'Tập trung',
  mind: 'Học tập'
}

interface CalendarCell {
  key: string
  dayName: string
  shortDate: string
  fullLabel: string
  state: HabitDayCellState
}

function buildFourWeekCells(habit: PrototypeHabit, now = new Date()): CalendarCell[] {
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayDow = (todayMid.getDay() + 6) % 7 // 0 = T2 .. 6 = CN
  const startMonday = new Date(
    todayMid.getFullYear(),
    todayMid.getMonth(),
    todayMid.getDate() - todayDow - 21
  )

  return Array.from({ length: 28 }, (_, idx) => {
    const cellDate = new Date(
      startMonday.getFullYear(),
      startMonday.getMonth(),
      startMonday.getDate() + idx
    )
    const dayIdx = idx % 7
    const dayName = WEEK_DAYS[dayIdx]
    const shortDate = `${cellDate.getDate()}/${cellDate.getMonth() + 1}`

    let state: HabitDayCellState
    if (cellDate.getTime() === todayMid.getTime()) {
      state = 'today'
    } else if (cellDate.getTime() > todayMid.getTime()) {
      state = 'future'
    } else {
      const pattern = habit.previewFourWeeks[idx]
      state = pattern === 'missed' ? 'missed' : 'done'
    }

    const statusText =
      state === 'done'
        ? 'Đã check-in (mẫu)'
        : state === 'today'
          ? 'Hôm nay (chưa check-in)'
          : state === 'future'
            ? 'Chưa đến'
            : 'Chưa hoàn thành'

    return {
      key: `${cellDate.getFullYear()}-${cellDate.getMonth() + 1}-${cellDate.getDate()}`,
      dayName,
      shortDate,
      fullLabel: `${dayName}, ${shortDate}: ${statusText}`,
      state
    }
  })
}

/**
 * Floating Centered Modal for Habit Detail (opened directly on /work/habits without leaving the page).
 * - Matches the approved visual reference:
 *   Header badges + Send/Pin/Close actions -> Title & schedule subtitle ->
 *   3 pastel stat cards -> 4-week calendar grid showing BOTH weekday (T2..CN) and date (dd/mm) ->
 *   Linked Quest banner -> Primary Check-in CTA (honest PENDING API notice).
 */
export function HabitDetailModal({
  habit,
  pinned = false,
  onTogglePin,
  onClose
}: HabitDetailModalProps) {
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    setNotice(null)
  }, [habit?.id])

  useEffect(() => {
    if (!habit) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [habit, onClose])

  if (!habit) return null

  const cells = buildFourWeekCells(habit)

  return (
    <div
      className={styles.habitModalBackdrop}
      role="presentation"
      onClick={onClose}
      data-testid="habit-detail-backdrop"
    >
      <div
        className={styles.habitModalDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="habit-modal-title"
        data-testid="habit-detail-modal"
        data-habit-id={habit.id}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar: Category pills on left, Send / Pin / Close on right */}
        <div className={styles.habitModalTopRow}>
          <div className={styles.habitModalBadges}>
            <span className={styles.habitTypeBadge}>Habit</span>
            <span className={styles.habitCategoryBadge}>{CATEGORY_LABEL[habit.category]}</span>
            <span className={styles.pendingPill}>MẪU GIAO DIỆN</span>
          </div>

          <div className={styles.habitModalTopActions}>
            <button
              type="button"
              className={styles.habitModalActionChip}
              onClick={() =>
                setNotice('Gửi thói quen cho bạn bè đang chờ Backend Social / Habit API.')
              }
            >
              <Send size={13} aria-hidden="true" /> Gửi cho bạn bè
            </button>
            <FoxPawPinButton
              pinned={pinned}
              taskTitle={habit.title}
              onToggle={() => {
                onTogglePin?.()
                setNotice(
                  !pinned
                    ? 'Đã đánh dấu ghim xem trước — lưu ghim thói quen lên Bảng ghim chờ Backend Habit API.'
                    : 'Đã bỏ đánh dấu ghim xem trước.'
                )
              }}
            />
            <button
              type="button"
              className={styles.habitModalCloseBtn}
              onClick={onClose}
              aria-label="Đóng chi tiết thói quen"
              data-testid="habit-modal-close"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Title & Reminder Subtitle */}
        <div className={styles.habitDetailHeader}>
          <h2 id="habit-modal-title" className={styles.habitModalTitle}>
            {habit.title}
          </h2>
          <p className={styles.habitDetailSubtitle}>{habit.reminderText}</p>
        </div>

        {/* 3 Pastel Stat Cards */}
        <div className={styles.habitStatGrid} data-testid="habit-stat-grid">
          <div className={`${styles.habitStatCard} ${styles.habitStatStreak}`}>
            <span className={styles.habitStatLabelStreak}>
              <PawPrint size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} aria-hidden="true" />
              Chuỗi hiện tại
            </span>
            <div className={styles.habitStatValueRow}>
              <strong className={styles.habitStatNumber}>{habit.previewCurrentStreak}</strong>
              <span className={styles.habitStatUnit}>ngày</span>
            </div>
          </div>

          <div className={`${styles.habitStatCard} ${styles.habitStatRecord}`}>
            <span className={styles.habitStatLabelRecord}>Kỷ lục</span>
            <div className={styles.habitStatValueRow}>
              <strong className={styles.habitStatNumber}>{habit.previewBestStreak}</strong>
              <span className={styles.habitStatUnit}>ngày</span>
            </div>
          </div>

          <div className={`${styles.habitStatCard} ${styles.habitStatWeek}`}>
            <span className={styles.habitStatLabelWeek}>Tuần này</span>
            <div className={styles.habitStatValueRow}>
              <strong className={styles.habitStatNumber}>
                {habit.previewWeekDone}/{habit.previewWeekTarget}
              </strong>
            </div>
          </div>
        </div>

        {/* 4-Week Calendar Heatmap showing BOTH weekday header (T2..CN) and date (dd/mm) */}
        <section className={styles.habitHeatmapSection} aria-label="4 tuần gần đây">
          <h3 className={styles.sectionHeading} style={{ marginBottom: 8 }}>
            4 tuần gần đây
          </h3>

          <div className={styles.habitHeatmapWeekdays} aria-hidden="true">
            {WEEK_DAYS.map((day) => (
              <span key={day} className={styles.habitHeatmapWeekdayLabel}>
                {day}
              </span>
            ))}
          </div>

          <div className={styles.habitHeatmapGrid} data-testid="habit-heatmap-grid" role="grid">
            {cells.map((cell) => (
              <span
                key={cell.key}
                role="gridcell"
                aria-label={cell.fullLabel}
                title={cell.fullLabel}
                data-state={cell.state}
                className={`${styles.habitHeatmapCell} ${
                  cell.state === 'done'
                    ? styles.heatmapDone
                    : cell.state === 'today'
                      ? styles.heatmapToday
                      : cell.state === 'future'
                        ? styles.heatmapFuture
                        : styles.heatmapMissed
                }`}
              >
                <span className={styles.heatmapCellDate}>{cell.shortDate}</span>
              </span>
            ))}
          </div>

          <p className={styles.habitHeatmapCaption}>
            Ô cam viền là hôm nay · không có hạn chót, bỏ lỡ một ngày chỉ làm chuỗi về 0.
          </p>
        </section>

        {/* Linked Quest Banner */}
        <Link
          to="/work/quests"
          className={styles.habitQuestBanner}
          onClick={onClose}
          data-testid="habit-linked-quest-banner"
        >
          <span>Góp vào Quest “{habit.linkedQuest}”</span>
          <ChevronRight size={16} aria-hidden="true" />
        </Link>

        {/* Primary Check-in CTA */}
        <button
          type="button"
          className={styles.habitCheckinBtn}
          onClick={() =>
            setNotice(
              `Check-in thói quen & cộng +${habit.previewXp} XP đang chờ Backend Habit Execution API — chưa ghi nhận chuỗi ngày lên máy chủ.`
            )
          }
          data-testid="habit-checkin-btn"
        >
          <Check size={16} aria-hidden="true" /> Check-in hôm nay · +{habit.previewXp} XP
        </button>

        {notice && (
          <div
            className={styles.evidenceActionNotice}
            role="status"
            style={{ marginTop: 10 }}
            data-testid="habit-modal-notice"
          >
            {notice}
          </div>
        )}
      </div>
    </div>
  )
}
