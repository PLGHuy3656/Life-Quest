import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, RotateCcw, Zap } from 'lucide-react'
import { validateSafeRedirect } from '@/features/auth/authRedirect'
import { useOptionalCompanion } from '@/features/mascot/CompanionProvider'
import { FoxCompanionView } from '@/features/mascot/FoxCompanionView'
import styles from './LoadingPage.module.css'

export interface LoadingPageProps {
  /** Optional override destination when used as a transition screen */
  redirectTo?: string
  /** Optional duration in ms (defaults to 3600ms accelerating run) */
  durationMs?: number
}

function getLoadingStage(progress: number) {
  if (progress >= 100) {
    return {
      title: 'Sẵn sàng chinh phục hôm nay!',
      hint: 'Fox đã chuẩn bị xong bàn học và danh sách Quest cho bạn.',
      badge: 'Hoàn tất • 100%'
    }
  }
  if (progress >= 65) {
    return {
      title: 'Fox đang chạy nước rút hết tốc lực!',
      hint: 'Sắp tới đích rồi — đang hoàn tất đồng bộ không gian LifeQuest...',
      badge: 'Tăng tốc tối đa'
    }
  }
  if (progress >= 25) {
    return {
      title: 'Đang đồng bộ Quest & Thói quen...',
      hint: 'Fox đang tăng tốc gom các mục tiêu hôm nay lại cho bạn.',
      badge: 'Đang tăng tốc'
    }
  }
  return {
    title: 'Đang khởi động hành trình...',
    hint: 'Fox vừa buộc dây giày xong và bắt đầu chạy tới!',
    badge: 'Khởi động'
  }
}

export function LoadingPage({ redirectTo, durationMs = 3600 }: LoadingPageProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const companion = useOptionalCompanion()
  const companionRef = useRef(companion)
  companionRef.current = companion

  const rawTo = redirectTo ?? searchParams.get('to')
  const safeTarget = rawTo ? validateSafeRedirect(rawTo, '/') : null

  const [progress, setProgress] = useState(0)
  const [runCycle, setRunCycle] = useState(0)
  const celebratedRef = useRef(false)
  const lastActivityRef = useRef<'walk' | 'run' | 'idle' | null>(null)

  // Smooth accelerating progress curve (0 -> 100)
  useEffect(() => {
    celebratedRef.current = false
    lastActivityRef.current = null
    setProgress(0)

    const start = performance.now()
    let rafId = 0

    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / durationMs)
      // Ease-in-out slightly accelerating feel
      const pct = Math.min(100, Math.round(t * 100))
      setProgress(pct)
      if (t < 1) {
        rafId = window.requestAnimationFrame(tick)
      }
    }

    rafId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(rafId)
  }, [durationMs, runCycle])

  // Drive real Gate I 3D Fox V2 locomotion: walk -> run -> faster & faster sprint -> celebrate
  const speedMultiplier =
    progress >= 100 ? 1 : Number((1 + (progress / 100) * 1.45).toFixed(2))

  useEffect(() => {
    const c = companionRef.current
    if (!c) return

    if (progress >= 100) {
      if (!celebratedRef.current) {
        celebratedRef.current = true
        lastActivityRef.current = 'idle'
        c.setActivityTempo(1)
        c.update({ activity: 'idle', mood: 'happy', lookAt: true })
        c.playClip('quest_complete')
      }
      return
    }

    const desiredActivity: 'walk' | 'run' = progress < 22 ? 'walk' : 'run'
    if (lastActivityRef.current !== desiredActivity) {
      lastActivityRef.current = desiredActivity
      c.update({
        activity: desiredActivity,
        mood: desiredActivity === 'run' ? 'excited' : 'smile',
        lookAt: false
      })
    }
    // Continuously accelerate playback speed as loading progresses
    c.setActivityTempo(speedMultiplier)
  }, [progress, speedMultiplier])

  // Restore clean Fox defaults on unmount
  useEffect(() => {
    return () => {
      companionRef.current?.setActivityTempo(1)
      companionRef.current?.update({ activity: 'idle', mood: 'neutral', lookAt: true })
    }
  }, [])

  // Auto-redirect after brief celebration if a destination `?to=` was supplied
  useEffect(() => {
    if (progress < 100 || !safeTarget) return
    const timer = window.setTimeout(() => {
      navigate(safeTarget, { replace: true })
    }, 850)
    return () => window.clearTimeout(timer)
  }, [progress, safeTarget, navigate])

  const stage = getLoadingStage(progress)
  const isDone = progress >= 100
  const streakDurMs = Math.max(240, Math.round(920 / speedMultiplier))
  const trackDurMs = Math.max(260, Math.round(1150 / speedMultiplier))
  const speedOpacity = isDone ? 0 : Math.min(0.95, 0.2 + (progress / 100) * 0.75)

  return (
    <div
      className={styles.pageShell}
      data-testid="loading-page"
      data-progress={progress}
      data-speed={speedMultiplier}
    >
      {/* Top LifeQuest Brand Mark */}
      <Link to="/" className={styles.brandTop} aria-label="LifeQuest – Trang chủ">
        <svg viewBox="0 0 48 40" width="30" height="25" aria-hidden="true">
          <path d="M6 6L16 17L7 24L6 6Z" fill="#F26B3A" />
          <path d="M42 6L32 17L41 24L42 6Z" fill="#F26B3A" />
          <ellipse cx="24" cy="23" rx="15" ry="13" fill="#F26B3A" />
          <path d="M12 25C16 21 32 21 36 25C34 32 29 36 24 36C19 36 14 32 12 25Z" fill="#FFF4E8" />
          <circle cx="19" cy="22" r="2.2" fill="#16324A" />
          <circle cx="29" cy="22" r="2.2" fill="#16324A" />
          <path d="M22 27L24 29L26 27" stroke="#16324A" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
        <span className={styles.brandWordmark}>
          Life<span className={styles.brandAccent}>Quest</span>
        </span>
      </Link>

      <main className={styles.centerStack}>
        {/* Accelerating 3D Fox V2 Running Stage */}
        <div
          className={styles.runStage}
          style={
            {
              '--streak-dur': `${streakDurMs}ms`,
              '--track-dur': `${trackDurMs}ms`,
              '--speed-opacity': speedOpacity
            } as CSSProperties
          }
        >
          {!isDone && (
            <div className={styles.speedLines} aria-hidden="true">
              <span className={`${styles.speedLine} ${styles.speedLine1}`} />
              <span className={`${styles.speedLine} ${styles.speedLine2}`} />
              <span className={`${styles.speedLine} ${styles.speedLine3}`} />
              <span className={`${styles.speedLine} ${styles.speedLine4}`} />
            </div>
          )}

          <div
            className={`${styles.foxRunnerWrap} ${!isDone && progress >= 55 ? styles.foxSprinting : ''}`.trim()}
          >
            <FoxCompanionView
              presentation="mini"
              label="loading-fox-runner"
              className={styles.foxCanvasClean}
            />
          </div>

          <div className={styles.groundTrack} aria-hidden="true">
            {!isDone && <div className={styles.groundDashes} />}
          </div>
        </div>

        <span className={styles.speedPill} data-testid="loading-speed-pill">
          <Zap size={13} aria-hidden="true" />
          <span>
            {isDone ? stage.badge : `${stage.badge} • ${speedMultiplier.toFixed(1)}x`}
          </span>
        </span>

        <h1 className={styles.statusTitle}>{stage.title}</h1>
        <p className={styles.statusHint} role="status" aria-live="polite">
          {stage.hint}
        </p>

        {/* Thick Duolingo-style Warm Progress Bar */}
        <div className={styles.progressWrap}>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Tiến trình tải LifeQuest"
          >
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.progressMeta}>
            <span>{isDone ? 'Đã đồng bộ xong' : 'Đang chuẩn bị dữ liệu...'}</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Standalone preview controls once 100% completes */}
        {isDone && !safeTarget && (
          <div className={styles.completeActions}>
            <Link to="/" className={styles.primaryBtn}>
              <span>Vào LifeQuest</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => setRunCycle((c) => c + 1)}
              data-testid="loading-replay-btn"
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Chạy lại</span>
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
