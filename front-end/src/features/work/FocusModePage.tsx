import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pause, Play, RotateCcw, Square } from 'lucide-react'
import { useCompanion } from '@/features/mascot/CompanionProvider'
import { FoxCompanionView } from '@/features/mascot/FoxCompanionView'
import { foxDialogueBus } from '@/features/mascot/dialogue/dialogueBus'
import { useWorkQuestByIdQuery } from '@/hooks/useWorkData'
import {
  computeRemainingMs,
  FOCUS_PRESETS,
  formatTimerMMSS,
  useFocusSessionStore,
  type FocusPresetMinutes
} from '@/stores/focusSessionStore'
import styles from './FocusModePage.module.css'

/**
 * Full-screen Immersive Dark Focus Mode (/work/tasks/:taskId/focus).
 * - Mounted OUTSIDE AppShell so the entire viewport dims into a distraction-free
 *   dark focus room showing ONLY the countdown timer and Fox V2 study animation
 *   (strictly preserving the single-WebGL-canvas invariant).
 * - Backed by the shared timestamp-anchored Zustand useFocusSessionStore.
 * - Local-only: does not fabricate XP, coins, or task completion.
 */
export function FocusModePage() {
  const { taskId = '' } = useParams<{ taskId: string }>()
  const questQuery = useWorkQuestByIdQuery(taskId)
  const taskTitle = questQuery.data?.title ?? 'Phiên tập trung'
  const { publish } = useCompanion()

  const activeTaskId = useFocusSessionStore((s) => s.taskId)
  const activeTaskTitle = useFocusSessionStore((s) => s.taskTitle)
  const status = useFocusSessionStore((s) => s.status)
  const presetMinutes = useFocusSessionStore((s) => s.presetMinutes)
  const totalMs = useFocusSessionStore((s) => s.totalMs)
  const remainingAtAnchorMs = useFocusSessionStore((s) => s.remainingAtAnchorMs)
  const startedAtMs = useFocusSessionStore((s) => s.startedAtMs)
  const start = useFocusSessionStore((s) => s.start)
  const pause = useFocusSessionStore((s) => s.pause)
  const resume = useFocusSessionStore((s) => s.resume)
  const reset = useFocusSessionStore((s) => s.reset)
  const end = useFocusSessionStore((s) => s.end)
  const setPreset = useFocusSessionStore((s) => s.setPreset)
  const syncTick = useFocusSessionStore((s) => s.syncTick)

  const [nowMs, setNowMs] = useState(() => Date.now())
  const [pendingAction, setPendingAction] = useState<'reset' | 'end' | 'switch' | null>(null)

  const isThisTask = activeTaskId === taskId
  const isOtherTaskActive =
    activeTaskId !== null && activeTaskId !== taskId && (status === 'running' || status === 'paused')

  const effectiveStatus = isThisTask ? status : 'idle'

  useEffect(() => {
    if (status !== 'running') return
    const sync = () => {
      const now = Date.now()
      setNowMs(now)
      syncTick(now)
    }
    sync()
    const id = window.setInterval(sync, 1000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') sync()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [status, syncTick])

  // Drive Fox V2 Gate G2 study animation in sync with focus timer state
  useEffect(() => {
    if (effectiveStatus === 'running') {
      publish('STUDY_STARTED', { taskId })
    } else if (effectiveStatus === 'ended') {
      publish('STUDY_COMPLETED', { taskId, minutes: presetMinutes })
    }
  }, [effectiveStatus, presetMinutes, publish, taskId])

  const remainingMs = isThisTask
    ? computeRemainingMs(
        { status, remainingAtAnchorMs, startedAtMs },
        status === 'running' ? nowMs : Date.now()
      )
    : presetMinutes * 60 * 1000

  const progressPct =
    isThisTask && totalMs > 0
      ? Math.min(100, Math.max(0, Math.round(((totalMs - remainingMs) / totalMs) * 100)))
      : 0

  const handleStart = () => {
    if (isOtherTaskActive) {
      setPendingAction('switch')
      return
    }
    start(taskId, taskTitle, presetMinutes)
    setNowMs(Date.now())
    setPendingAction(null)
    foxDialogueBus.emit({ event: 'FOCUS_STARTED' })
  }

  const handlePause = () => {
    pause()
    setNowMs(Date.now())
    foxDialogueBus.emit({ event: 'FOCUS_PAUSED' })
  }

  const handleResume = () => {
    resume()
    setNowMs(Date.now())
    foxDialogueBus.emit({ event: 'FOCUS_STARTED' })
  }

  const handleConfirmPending = () => {
    if (pendingAction === 'switch') {
      start(taskId, taskTitle, presetMinutes)
      setNowMs(Date.now())
      foxDialogueBus.emit({ event: 'FOCUS_STARTED' })
    } else if (pendingAction === 'reset') {
      reset(presetMinutes)
    } else if (pendingAction === 'end') {
      end()
    }
    setPendingAction(null)
  }

  const handlePresetClick = (min: FocusPresetMinutes) => {
    if (isThisTask && (status === 'running' || status === 'paused')) return
    setPreset(min)
  }

  return (
    <main
      className={styles.page}
      data-testid="focus-mode-page"
      data-status={effectiveStatus}
      aria-label="Chế độ tập trung"
    >
      <header className={styles.topBar}>
        <Link
          to={taskId ? `/work/tasks/${taskId}` : '/work/tasks'}
          className={styles.backBtn}
          data-testid="focus-exit-btn"
        >
          <ArrowLeft size={15} aria-hidden="true" /> Quay lại chi tiết
        </Link>

        <div className={styles.topTitleWrap}>
          <span className={styles.taskName} title={taskTitle}>
            {taskTitle}
          </span>
          <span className={styles.localPill}>Cục bộ</span>
        </div>
      </header>

      <section className={styles.centerStage}>
        {/* Fox 3D Study Animation Stage (single WebGL canvas while on Focus Mode route) */}
        <div className={styles.foxStageWrap}>
          <div
            className={`${styles.foxHalo} ${effectiveStatus === 'running' ? styles.foxHaloRunning : ''}`}
            aria-hidden="true"
          />
          <FoxCompanionView
            presentation="full"
            label="Fox đồng hành trong phiên tập trung"
            className={styles.foxCanvas}
          />
        </div>

        {/* Countdown Clock & Progress */}
        <div className={styles.timerBlock}>
          <span
            className={styles.clock}
            role="timer"
            aria-live="off"
            data-testid="focus-timer-display"
          >
            {formatTimerMMSS(remainingMs)}
          </span>
          <span className={styles.statusLabel}>
            {effectiveStatus === 'running'
              ? 'Fox đang tập trung cùng bạn...'
              : effectiveStatus === 'paused'
                ? 'Đang tạm dừng phiên tập trung'
                : effectiveStatus === 'ended'
                  ? 'Hoàn thành phiên tập trung cục bộ!'
                  : 'Chọn thời lượng và bấm Bắt đầu để tập trung'}
          </span>

          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct}
            aria-label="Tiến độ phiên tập trung"
          >
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Duration Presets */}
        <div className={styles.presetRow} role="group" aria-label="Chọn thời lượng tập trung">
          {FOCUS_PRESETS.map((min) => (
            <button
              key={min}
              type="button"
              className={`${styles.presetBtn} ${presetMinutes === min ? styles.presetBtnActive : ''}`}
              aria-pressed={presetMinutes === min}
              disabled={isThisTask && (status === 'running' || status === 'paused')}
              onClick={() => handlePresetClick(min)}
              data-testid={`focus-preset-${min}`}
            >
              {min}p
            </button>
          ))}
        </div>

        {/* Active-Session Guard or Confirmation */}
        {isOtherTaskActive && pendingAction !== 'switch' && (
          <div className={styles.confirmBox} role="status">
            <span>
              Đang có phiên tập trung hoạt động cho{' '}
              <strong>{activeTaskTitle ?? 'nhiệm vụ khác'}</strong>.
            </span>
          </div>
        )}

        {pendingAction && (
          <div className={styles.confirmBox} role="alertdialog" aria-label="Xác nhận phiên tập trung">
            <span>
              {pendingAction === 'switch'
                ? `Hủy phiên đang chạy của "${activeTaskTitle ?? 'nhiệm vụ khác'}" để tập trung vào nhiệm vụ này?`
                : pendingAction === 'reset'
                  ? 'Đặt lại đồng hồ về ban đầu? Thời gian đã đếm của phiên này sẽ bị hủy.'
                  : 'Kết thúc sớm phiên tập trung hiện tại?'}
            </span>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => setPendingAction(null)}
              >
                Giữ lại
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleConfirmPending}
                data-testid="focus-confirm-action"
              >
                Xác nhận
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className={styles.controlsRow}>
          {effectiveStatus === 'idle' || effectiveStatus === 'ended' ? (
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleStart}
              data-testid="focus-primary-btn"
            >
              <Play size={16} aria-hidden="true" />{' '}
              {effectiveStatus === 'ended' ? 'Bắt đầu phiên mới' : 'Bắt đầu tập trung'}
            </button>
          ) : effectiveStatus === 'running' ? (
            <>
              <button
                type="button"
                className={styles.pauseBtn}
                onClick={handlePause}
                data-testid="focus-primary-btn"
              >
                <Pause size={16} aria-hidden="true" /> Tạm dừng
              </button>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => setPendingAction('reset')}
              >
                <RotateCcw size={14} aria-hidden="true" /> Đặt lại
              </button>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => setPendingAction('end')}
              >
                <Square size={14} aria-hidden="true" /> Kết thúc
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleResume}
                data-testid="focus-primary-btn"
              >
                <Play size={16} aria-hidden="true" /> Tiếp tục
              </button>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => setPendingAction('reset')}
              >
                <RotateCcw size={14} aria-hidden="true" /> Đặt lại
              </button>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => setPendingAction('end')}
              >
                <Square size={14} aria-hidden="true" /> Kết thúc
              </button>
            </>
          )}
        </div>
      </section>

      <p className={styles.footerNote}>
        Phiên tập trung cục bộ — không tự động hoàn thành nhiệm vụ, cộng XP hay gửi thông báo khi
        đóng trình duyệt.
      </p>
    </main>
  )
}
