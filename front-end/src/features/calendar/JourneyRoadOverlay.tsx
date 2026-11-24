import { useEffect, useRef } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Clock,
  Compass,
  Flag,
  X
} from 'lucide-react'
import { parseLocalDate } from '@/utils/date'
import type { CalendarJourneyRoad } from './calendarRoadUtils'
import styles from './JourneyRoadOverlay.module.css'

interface JourneyRoadOverlayProps {
  road: CalendarJourneyRoad | null
  onClose: () => void
  onNavigate: (route: string) => void
}

function formatViDate(ymd: string | null): string {
  if (!ymd) return 'Chưa đặt lịch'
  const d = parseLocalDate(ymd)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}/${d.getFullYear()}`
}

/**
 * FE-05B Interactive Journey Road Overlay.
 * - Opens in-place without navigating away from Calendar or altering the selected date.
 * - Clearly separates Time Progress (elapsed / duration) from Work Progress (verified completed / total Tasks).
 * - Displays real Epic checkpoints for Quests, and a clean start-to-finish timeline for long Tasks (no fake Epics).
 */
export function JourneyRoadOverlay({ road, onClose, onNavigate }: JourneyRoadOverlayProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!road) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    closeBtnRef.current?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      previousFocusRef.current?.focus?.()
    }
  }, [road, onClose])

  if (!road) return null

  const statusLabel =
    road.status === 'completed'
      ? 'Đã hoàn thành'
      : road.status === 'overdue'
        ? 'Quá hạn'
        : road.status === 'unscheduled'
          ? 'Chưa đặt hạn chót'
          : 'Đang thực hiện'

  const statusClass =
    road.status === 'completed'
      ? styles.statusCompleted
      : road.status === 'overdue'
        ? styles.statusOverdue
        : road.status === 'unscheduled'
          ? styles.statusUnscheduled
          : styles.statusActive

  const remainingText =
    road.remainingDays === null
      ? 'Không có hạn chót'
      : road.remainingDays < 0
        ? `Quá hạn ${Math.abs(road.remainingDays)} ngày`
        : road.remainingDays === 0
          ? 'Đến hạn hôm nay'
          : `Còn ${road.remainingDays} ngày`

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="journey-road-title"
      data-testid="journey-road-overlay"
      onClick={onClose}
    >
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <div className={styles.badgeRow}>
              <span
                className={`${styles.kindPill} ${
                  road.kind === 'quest' ? styles.kindQuest : styles.kindTask
                }`}
              >
                {road.kind === 'quest' ? (
                  <>
                    <Compass size={12} aria-hidden="true" />
                    Hành trình (Quest)
                  </>
                ) : (
                  <>
                    <CheckSquare size={12} aria-hidden="true" />
                    Nhiệm vụ dài hạn
                  </>
                )}
              </span>
              <span className={`${styles.statusPill} ${statusClass}`}>
                {road.status === 'overdue' && <AlertTriangle size={11} aria-hidden="true" />}
                {road.status === 'completed' && <CheckCircle2 size={11} aria-hidden="true" />}
                {statusLabel}
              </span>
            </div>
            <h2 id="journey-road-title" className={styles.title}>
              {road.title}
            </h2>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Đóng lộ trình"
            data-testid="journey-road-close"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          {/* Key Dates & Duration */}
          <div className={styles.metaGrid}>
            <div className={styles.metaBox}>
              <span className={styles.metaLabel}>Bắt đầu</span>
              <span className={styles.metaValue}>{formatViDate(road.startYmd)}</span>
            </div>
            <div className={styles.metaBox}>
              <span className={styles.metaLabel}>Đích đến (Hạn chót)</span>
              <span className={styles.metaValue}>{formatViDate(road.endYmd)}</span>
            </div>
            <div className={styles.metaBox}>
              <span className={styles.metaLabel}>Thời gian còn lại</span>
              <span
                className={`${styles.metaValue} ${
                  road.remainingDays !== null && road.remainingDays < 0 ? styles.metaDanger : ''
                }`}
              >
                {remainingText}
              </span>
            </div>
          </div>

          {/* Separated Time Progress vs Work Progress */}
          <section className={styles.progressSection} aria-label="Tiến độ thời gian và công việc">
            <div className={styles.progressBlock} data-testid="road-time-progress">
              <div className={styles.progressHead}>
                <span>
                  <Clock size={12} style={{ verticalAlign: '-1px', marginRight: 5 }} aria-hidden="true" />
                  Tiến độ thời gian
                </span>
                <span className={styles.progressMeta}>
                  {road.durationDays !== null && road.elapsedDays !== null
                    ? `${road.elapsedDays}/${road.durationDays} ngày (${road.timeProgressPct}%)`
                    : 'Chưa đủ mốc thời gian'}
                </span>
              </div>
              <div className={styles.track} aria-hidden="true">
                <div
                  className={styles.fillTime}
                  style={{ width: `${road.timeProgressPct ?? 0}%` }}
                />
              </div>
              <div className={styles.roadEndpoints}>
                <span>{formatViDate(road.startYmd)}</span>
                {road.endYmd && (
                  <span className={styles.flagEndpoint}>
                    <Flag size={11} aria-hidden="true" />
                    Đích {formatViDate(road.endYmd)}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.progressBlock} data-testid="road-work-progress">
              <div className={styles.progressHead}>
                <span>
                  <CheckCircle2
                    size={12}
                    style={{ verticalAlign: '-1px', marginRight: 5, color: '#168c78' }}
                    aria-hidden="true"
                  />
                  Tiến độ công việc (xác thực)
                </span>
                <span className={styles.progressMeta}>
                  {road.workProgressPct !== null
                    ? `${road.completedTaskCount}/${road.totalTaskCount} Task (${road.workProgressPct}%)`
                    : 'Chưa có Task liên kết'}
                </span>
              </div>
              <div className={styles.track} aria-hidden="true">
                <div
                  className={styles.fillWork}
                  style={{ width: `${road.workProgressPct ?? 0}%` }}
                />
              </div>
            </div>
          </section>

          {/* Quest Epic Checkpoints (NEVER fabricated for atomic Tasks) */}
          {road.kind === 'quest' && (
            <section className={styles.checkpointsSection} aria-label="Các chặng Epic">
              <h3 className={styles.sectionHeading}>
                Các chặng hành trình (Epic · {road.checkpoints.length})
              </h3>
              {road.checkpoints.length === 0 ? (
                <p className={styles.emptyNote} data-testid="road-zero-epics">
                  Hành trình này chưa có chặng (Epic) nào. Mở trang chi tiết Quest để thêm chặng mới.
                </p>
              ) : (
                <ol className={styles.checkpointList} data-testid="road-epic-list">
                  {road.checkpoints.map((cp) => (
                    <li
                      key={cp.id}
                      className={`${styles.checkpointItem} ${
                        cp.status === 'completed'
                          ? styles.cpCompleted
                          : cp.status === 'active'
                            ? styles.cpActive
                            : ''
                      }`}
                    >
                      <span
                        className={`${styles.cpNode} ${
                          cp.status === 'completed'
                            ? styles.cpNodeCompleted
                            : cp.status === 'active'
                              ? styles.cpNodeActive
                              : styles.cpNodeFuture
                        }`}
                        aria-hidden="true"
                      >
                        {cp.status === 'completed' ? <CheckCircle2 size={14} /> : cp.position}
                      </span>
                      <div className={styles.cpMain}>
                        <span className={styles.cpTitle}>{cp.title}</span>
                        <span className={styles.cpMeta}>
                          {cp.status === 'completed'
                            ? 'Hoàn thành'
                            : cp.status === 'active'
                              ? 'Đang thực hiện'
                              : 'Chặng sắp tới'}{' '}
                          · {cp.completedTasks}/{cp.totalTasks} Task
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}

          {/* Next Actionable Task */}
          {road.nextActionableTask && (
            <section className={styles.checkpointsSection} aria-label="Nhiệm vụ cần làm tiếp theo">
              <h3 className={styles.sectionHeading}>Nhiệm vụ tiếp theo</h3>
              <button
                type="button"
                className={styles.nextTaskBtn}
                onClick={() => {
                  onClose()
                  onNavigate(road.nextActionableTask!.route)
                }}
              >
                <div className={styles.cpMain}>
                  <span className={styles.cpTitle}>{road.nextActionableTask.title}</span>
                  <span className={styles.cpMeta}>
                    {road.nextActionableTask.dueLabel
                      ? `Hạn ${road.nextActionableTask.dueLabel}`
                      : 'Nhấn để mở chi tiết Task'}
                  </span>
                </div>
                <ArrowRight size={15} style={{ color: '#c94c1d', flexShrink: 0 }} aria-hidden="true" />
              </button>
            </section>
          )}
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.secondaryBtn} onClick={onClose}>
            Đóng
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => {
              onClose()
              onNavigate(road.route)
            }}
            data-testid="journey-road-open-detail"
          >
            <span>{road.kind === 'quest' ? 'Mở trang Hành trình' : 'Mở chi tiết Task'}</span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </footer>
      </div>
    </div>
  )
}
