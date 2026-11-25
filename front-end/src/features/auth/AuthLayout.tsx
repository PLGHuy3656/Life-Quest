import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { useOptionalCompanion } from '@/features/mascot/CompanionProvider'
import { FoxCompanionView } from '@/features/mascot/FoxCompanionView'
import type { FoxOneShotClip } from '@/mascot/foxContract'
import styles from './AuthPages.module.css'

export type AuthFoxReaction =
  | 'LOGIN_IDLE'
  | 'EMAIL_FOCUS'
  | 'PASSWORD_FOCUS'
  | 'PASSWORD_PEEK'
  | 'LOGIN_LOADING'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_ERROR'
  | 'REGISTER_SUCCESS'
  | 'RECOVERY_PENDING'

const FOX_REACTION_LABEL: Record<AuthFoxReaction, string> = {
  LOGIN_IDLE: 'Cùng Fox tiếp tục hành trình nhé',
  EMAIL_FOCUS: 'Nhập email LifeQuest của bạn vào đây nha',
  PASSWORD_FOCUS: 'Fox che mắt quay đi rồi nè — yên tâm nhập mật khẩu nha!',
  PASSWORD_PEEK: 'Ơ, bật hiện mật khẩu rồi — Fox hé nhẹ một mắt nhắc bạn nhìn quanh nhé!',
  LOGIN_LOADING: 'Đang xác thực với máy chủ...',
  LOGIN_SUCCESS: 'Chào mừng trở lại! Lên đường thôi!',
  LOGIN_ERROR: 'Hic, kiểm tra lại thông tin một chút nhé',
  REGISTER_SUCCESS: 'Tạo tài khoản thành công!',
  RECOVERY_PENDING: 'Khôi phục mật khẩu đang chờ Backend'
}

const TOUCH_INTERACTIONS: { clip: FoxOneShotClip; text: string }[] = [
  { clip: 'streak_cheer', text: 'Hehe! Cố lên nào, đăng nhập rồi mình cùng giữ lửa Streak!' },
  { clip: 'wave', text: 'Xin chào! Chạm vào mình nữa là mình biểu diễn cho xem đó!' },
  { clip: 'duo_celebrate', text: 'Đập tay cái nè! Hôm nay mình sẽ hoàn thành thật nhiều Quest!' },
  { clip: 'head_pet', text: 'Hihi, xoa đầu thích quá đi mất~' },
  { clip: 'happy', text: 'Sẵn sàng mở khóa mục tiêu hôm nay chưa nè?' }
]

export interface AuthLayoutProps {
  foxReaction: AuthFoxReaction
  topActionLabel?: string
  topActionTo?: string
  /** Kept optional for compatibility with auth pages */
  headline?: string
  tagline?: string
  children: ReactNode
}

export function AuthLayout({
  foxReaction,
  topActionLabel = 'ĐĂNG KÝ',
  topActionTo = '/register',
  children
}: AuthLayoutProps) {
  const companion = useOptionalCompanion()
  const companionRef = useRef(companion)
  companionRef.current = companion

  const [touchCaption, setTouchCaption] = useState<string | null>(null)
  const touchIdxRef = useRef(0)
  const touchTimerRef = useRef<number | null>(null)
  const greetedRef = useRef(false)

  // Trigger initial welcome wave once when Fox is mounted
  useEffect(() => {
    if (!companionRef.current || greetedRef.current) return
    greetedRef.current = true
    const id = window.setTimeout(() => {
      companionRef.current?.playClip('wave')
    }, 350)
    return () => {
      window.clearTimeout(id)
      companionRef.current?.setPoseMode('none')
      companionRef.current?.update({ lookAt: true })
    }
  }, [])

  // Map auth states to real Gate I 3D animations + procedural cover-eyes / peek / curious poses
  useEffect(() => {
    const c = companionRef.current
    if (!c) return
    setTouchCaption(null)

    if (foxReaction === 'PASSWORD_FOCUS') {
      c.update({ lookAt: false, mood: 'neutral' })
      c.setPoseMode('cover_eyes')
      return
    }

    if (foxReaction === 'PASSWORD_PEEK') {
      c.update({ lookAt: false, mood: 'surprised' })
      c.setPoseMode('peek')
      return
    }

    c.update({ lookAt: true })

    if (foxReaction === 'EMAIL_FOCUS') {
      c.setPoseMode('curious')
      c.playClip('friend_greet')
    } else if (foxReaction === 'LOGIN_LOADING') {
      c.setPoseMode('none')
      c.playClip('study_start')
    } else if (foxReaction === 'LOGIN_SUCCESS' || foxReaction === 'REGISTER_SUCCESS') {
      c.setPoseMode('none')
      c.playClip('quest_complete')
    } else if (foxReaction === 'LOGIN_ERROR') {
      c.setPoseMode('none')
      c.playClip('challenge_lose')
    } else {
      c.setPoseMode('none')
    }
  }, [foxReaction])

  useEffect(() => {
    return () => {
      if (touchTimerRef.current) window.clearTimeout(touchTimerRef.current)
    }
  }, [])

  const handleFoxAction = () => {
    const next = TOUCH_INTERACTIONS[touchIdxRef.current % TOUCH_INTERACTIONS.length]
    touchIdxRef.current += 1
    companionRef.current?.setPoseMode('none')
    companionRef.current?.playClip(next.clip)
    setTouchCaption(next.text)
    if (touchTimerRef.current) window.clearTimeout(touchTimerRef.current)
    touchTimerRef.current = window.setTimeout(() => {
      setTouchCaption(null)
    }, 3400)
  }

  const reactionText = touchCaption ?? FOX_REACTION_LABEL[foxReaction]

  return (
    <div className={styles.pageShell} data-testid="auth-layout">
      {/* Minimalist Top Bar (Duolingo-inspired): Close left, Primary switch right */}
      <header className={styles.topBar}>
        <Link
          to="/"
          className={styles.closeBtn}
          aria-label="Quay lại Trang chủ"
          title="Quay lại Trang chủ"
          data-testid="auth-close-link"
        >
          <X size={24} strokeWidth={2.4} aria-hidden="true" />
        </Link>

        <Link
          to={topActionTo}
          className={styles.topActionBtn}
          data-testid="auth-top-action-link"
        >
          {topActionLabel}
        </Link>
      </header>

      {/* Centered Minimalist Auth Column */}
      <main className={styles.centerMain}>
        <div className={styles.centerColumn}>
          {/* Live Interactive Gate I 3D Fox V2 (Transparent, no background box, single WebGL canvas) */}
          <div
            className={styles.foxMinimalStage}
            data-testid="auth-fox-stage"
            data-fox-reaction={foxReaction}
          >
            <div
              className={`${styles.foxInteractiveWrap} ${styles[`foxState_${foxReaction}`] || ''}`.trim()}
              onClick={handleFoxAction}
              role="button"
              tabIndex={0}
              aria-label="Tương tác với Cáo đồng hành LifeQuest V2"
              title="Chạm vào Fox để tương tác"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleFoxAction()
                }
              }}
            >
              <FoxCompanionView
                presentation="mini"
                label="auth-fox-companion"
                className={styles.authFoxCanvas}
              />
            </div>
            <p
              className={styles.foxCaption}
              role="status"
              aria-live="polite"
              data-testid="auth-fox-message"
            >
              {reactionText}
            </p>
          </div>

          {children}
        </div>
      </main>
    </div>
  )
}
