import { useEffect, useState } from 'react'
import { Pause, Play, RotateCcw, Square, Timer } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { foxDialogueBus } from '@/features/mascot/dialogue/dialogueBus'
import {
  computeRemainingMs,
  FOCUS_PRESETS,
  formatTimerMMSS,
  useFocusSessionStore,
  type FocusPresetMinutes
} from '@/stores/focusSessionStore'
import styles from './WorkPage.module.css'

export interface FocusSessionCardProps {
  taskId: string
  taskTitle: string
}

/**
 * FE-04B.1 Compact Focus Session V1 widget for Task Detail.
 * - Timestamp-based drift-free countdown + visibilitychange resync.
 * - Single active session across all routes (shared focusSessionStore).
 * - Confirms before discarding/switching an active session.
 * - Local productivity tool only (no fake XP, coins, streak, or completion).
 */
export function FocusSessionCard({ taskId, taskTitle }: FocusSessionCardProps) {
  const sessionTaskId = useFocusSessionStore((s) => s.taskId)
  const sessionTaskTitle = useFocusSessionStore((s) => s.taskTitle)
  const presetMinutes = useFocusSessionStore((s) => s.presetMinutes)
  const totalMs = useFocusSessionStore((s) => s.totalMs)
  const remainingAtAnchorMs = useFocusSessionStore((s) => s.remainingAtAnchorMs)
  const startedAtMs = useFocusSessionStore((s) => s.startedAtMs)
  const status = useFocusSessionStore((s) => s.status)

  const startSession = useFocusSessionStore((s) => s.start)
  const pauseSession = useFocusSessionStore((s) => s.pause)
  const resumeSession = useFocusSessionStore((s) => s.resume)
  const resetSession = useFocusSessionStore((s) => s.reset)
  const endSession = useFocusSessionStore((s) => s.end)
  const setPreset = useFocusSessionStore((s) => s.setPreset)
  const syncTick = useFocusSessionStore((s) => s.syncTick)

  const [displayMs, setDisplayMs] = useState<number>(() =>
    computeRemainingMs({ status, remainingAtAnchorMs, startedAtMs })
  )
  const [confirmAction, setConfirmAction] = useState<'reset' | 'end' | 'switch' | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<FocusPresetMinutes>(presetMinutes)

  const isThisTaskSession = sessionTaskId === taskId && (status === 'running' || status === 'paused')
  const isOtherTaskActive =
    Boolean(sessionTaskId) &&
    sessionTaskId !== taskId &&
    (status === 'running' || status === 'paused')
  const isEndedThisTask = sessionTaskId === taskId && status === 'ended'

  // Drift-free timer loop + tab visibility resync
  useEffect(() => {
    const updateNow = () => {
      const rem = syncTick(Date.now())
      setDisplayMs(rem)
    }

    updateNow()

    if (status !== 'running') return

    const id = window.setInterval(updateNow, 500)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        updateNow()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [status, remainingAtAnchorMs, startedAtMs, syncTick])

  const shownMs = isThisTaskSession ? displayMs : selectedPreset * 60 * 1000
  const effectiveTotalMs = isThisTaskSession ? totalMs : selectedPreset * 60 * 1000
  const progressPct =
    effectiveTotalMs > 0
      ? Math.min(100, Math.max(0, Math.round(((effectiveTotalMs - shownMs) / effectiveTotalMs) * 100)))
      : 0

  const handlePresetPick = (mins: FocusPresetMinutes) => {
    if (isThisTaskSession) return
    setSelectedPreset(mins)
    if (!isOtherTaskActive) {
      setPreset(mins)
    }
  }

  const handlePrimaryAction = () => {
    setConfirmAction(null)
    if (isOtherTaskActive) {
      setConfirmAction('switch')
      return
    }
    if (isThisTaskSession && status === 'running') {
      pauseSession()
      foxDialogueBus.emit({ event: 'FOCUS_PAUSED' })
      return
    }
    if (isThisTaskSession && status === 'paused') {
      resumeSession()
      foxDialogueBus.emit({ event: 'FOCUS_STARTED' })
      return
    }
    startSession(taskId, taskTitle, selectedPreset)
    foxDialogueBus.emit({ event: 'FOCUS_STARTED' })
  }

  const executeConfirmed = () => {
    if (confirmAction === 'switch') {
      startSession(taskId, taskTitle, selectedPreset)
      foxDialogueBus.emit({ event: 'FOCUS_STARTED' })
    } else if (confirmAction === 'reset') {
      resetSession(selectedPreset)
    } else if (confirmAction === 'end') {
      endSession()
      foxDialogueBus.emit({ event: 'FOCUS_PAUSED' })
    }
    setConfirmAction(null)
  }

  return (
    <section
      className={styles.focusCard}
      aria-label="Phiên tập trung"
      data-testid="focus-session-card"
      data-status={isThisTaskSession ? status : 'idle'}
    >
      <div className={styles.focusTopRow}>
        <div className={styles.focusHeadingGroup}>
          <Timer size={15} className={styles.focusIcon} aria-hidden="true" />
          <h2 className={styles.sectionHeading}>Phiên tập trung</h2>
          <span className={styles.focusLocalTag}>Cục bộ</span>
        </div>

        <div className={styles.presetGroup} role="group" aria-label="Chọn thời lượng tập trung">
          {FOCUS_PRESETS.map((mins) => {
            const active = (isThisTaskSession ? presetMinutes : selectedPreset) === mins
            return (
              <button
                key={mins}
                type="button"
                disabled={isThisTaskSession}
                aria-pressed={active}
                data-testid={`focus-preset-${mins}`}
                className={`${styles.presetBtn} ${active ? styles.presetBtnActive : ''}`.trim()}
                onClick={() => handlePresetPick(mins)}
              >
                {mins}p
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.focusMainRow}>
        <div className={styles.focusClockBlock}>
          <span
            className={styles.focusClock}
            role="timer"
            aria-live="off"
            data-testid="focus-timer-display"
          >
            {formatTimerMMSS(shownMs)}
          </span>
          <span className={styles.focusStatusText}>
            {isThisTaskSession && status === 'running'
              ? 'Đang tập trung — phiên được giữ khi chuyển trang'
              : isThisTaskSession && status === 'paused'
                ? 'Đang tạm dừng'
                : isEndedThisTask
                  ? 'Đã kết thúc phiên tập trung'
                  : 'Sẵn sàng bắt đầu phiên tập trung'}
          </span>
        </div>

        <div className={styles.focusControls}>
          <Button
            variant={isThisTaskSession && status === 'running' ? 'primary' : 'accent'}
            size="sm"
            onClick={handlePrimaryAction}
            data-testid="focus-primary-btn"
          >
            {isThisTaskSession && status === 'running' ? (
              <>
                <Pause size={14} aria-hidden="true" /> Tạm dừng
              </>
            ) : isThisTaskSession && status === 'paused' ? (
              <>
                <Play size={14} aria-hidden="true" /> Tiếp tục
              </>
            ) : (
              <>
                <Play size={14} aria-hidden="true" /> Bắt đầu
              </>
            )}
          </Button>

          {isThisTaskSession && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmAction('reset')}
                aria-label="Đặt lại đồng hồ tập trung"
                data-testid="focus-reset-btn"
              >
                <RotateCcw size={13} aria-hidden="true" /> Đặt lại
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmAction('end')}
                aria-label="Kết thúc phiên tập trung"
                data-testid="focus-end-btn"
              >
                <Square size={12} aria-hidden="true" /> Kết thúc
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Subtle progress bar */}
      <div
        className={styles.focusProgressTrack}
        role="progressbar"
        aria-label="Tiến độ phiên tập trung"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPct}
      >
        <div className={styles.focusProgressFill} style={{ width: `${progressPct}%` }} />
      </div>

      {isOtherTaskActive && !confirmAction && (
        <div className={styles.focusNotice} role="status">
          Đang có phiên tập trung hoạt động cho <strong>{sessionTaskTitle}</strong>. Nhấn Bắt đầu để
          chuyển phiên sang nhiệm vụ này.
        </div>
      )}

      {confirmAction && (
        <div className={styles.focusConfirmBar} role="alertdialog" aria-label="Xác nhận phiên tập trung">
          <span>
            {confirmAction === 'switch'
              ? `Hủy phiên đang chạy của "${sessionTaskTitle}" và bắt đầu phiên mới?`
              : confirmAction === 'reset'
                ? 'Đặt lại đồng hồ tập trung đang chạy?'
                : 'Kết thúc phiên tập trung hiện tại?'}
          </span>
          <div className={styles.btnGroup}>
            <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" onClick={executeConfirmed} data-testid="focus-confirm-btn">
              Xác nhận
            </Button>
          </div>
        </div>
      )}

      <p className={styles.focusDisclaimer}>
        Công cụ tập trung cục bộ — không tự động hoàn thành nhiệm vụ, cộng XP hay gửi thông báo khi
        đóng trình duyệt.
      </p>
    </section>
  )
}
