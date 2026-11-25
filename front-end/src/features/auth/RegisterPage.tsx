import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Heart,
  Loader2,
  Search,
  Sparkles,
  Target,
  Trophy,
  Users,
  WifiOff,
  Youtube
} from 'lucide-react'
import { useOptionalCompanion } from '@/features/mascot/CompanionProvider'
import { FoxCompanionView } from '@/features/mascot/FoxCompanionView'
import type { FoxOneShotClip } from '@/mascot/foxContract'
import { authApi } from '@/services/api/authApi'
import { ApiClientError } from '@/types/api'
import styles from './RegisterWizard.module.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type WizardStepId = 'intro' | 'source' | 'goal' | 'pace' | 'preview' | 'res1' | 'res2'

const STEPS: WizardStepId[] = ['intro', 'source', 'goal', 'pace', 'preview', 'res1', 'res2']

const SOURCE_OPTIONS: {
  id: string
  label: string
  icon: typeof Users
  clip: FoxOneShotClip
  foxDialog: string
}[] = [
  {
    id: 'friends',
    label: 'Bạn bè / Gia đình',
    icon: Users,
    clip: 'friend_greet',
    foxDialog: 'Bạn bè giới thiệu là uy tín nhất luôn! Chào mừng bạn gia nhập hội cùng Fox nha!'
  },
  {
    id: 'social',
    label: 'Facebook / Instagram',
    icon: Globe,
    clip: 'photo_reaction',
    foxDialog: 'Hihi, Fox trên mạng xã hội có dễ thương bằng gặp trực tiếp ở đây không nè?'
  },
  {
    id: 'video',
    label: 'YouTube / TikTok',
    icon: Youtube,
    clip: 'receive_like',
    foxDialog: 'Bắt gặp nhau qua video là có duyên lắm đó — thả tim chào bạn liền!'
  },
  {
    id: 'search',
    label: 'Tìm kiếm Google',
    icon: Search,
    clip: 'task_suggestion',
    foxDialog: 'Chủ động tìm kiếm luôn — tinh thần chinh phục mục tiêu của bạn đỉnh quá!'
  },
  {
    id: 'study',
    label: 'Cộng đồng học tập',
    icon: BookOpen,
    clip: 'study_start',
    foxDialog: 'Dân cày bài chính hiệu đây rồi! Fox sẵn sàng ngồi học chung với bạn mỗi ngày!'
  },
  {
    id: 'other',
    label: 'Nguồn khác',
    icon: Sparkles,
    clip: 'happy',
    foxDialog: 'Dù gặp nhau theo cách nào thì từ hôm nay tụi mình đã là đồng đội rồi nha!'
  }
]

const GOAL_OPTIONS: {
  id: string
  label: string
  icon: typeof BookOpen
  clip: FoxOneShotClip
  foxDialog: string
}[] = [
  {
    id: 'study',
    label: 'Học tập & Ôn thi',
    icon: BookOpen,
    clip: 'study_start',
    foxDialog: 'Tuyệt vời! Fox sẽ chia bài học thành từng Quest gọn gàng để bạn ôn thi nhẹ đầu hơn!'
  },
  {
    id: 'habit',
    label: 'Xây thói quen bền bỉ',
    icon: Flame,
    clip: 'streak_cheer',
    foxDialog: 'Mỗi ngày một chút thôi là thành chuỗi Streak rực lửa liền — Fox sẽ giữ lửa cùng bạn!'
  },
  {
    id: 'work',
    label: 'Quản lý công việc',
    icon: Briefcase,
    clip: 'task_notebook_open',
    foxDialog: 'Lên sổ tay đầu việc rõ ràng, giải quyết từng bước một — tạm biệt cảm giác quá tải!'
  },
  {
    id: 'health',
    label: 'Rèn luyện sức khỏe',
    icon: Heart,
    clip: 'sports_start',
    foxDialog: 'Vận động khỏe khoắn! Fox khởi động sẵn sàng chạy bộ và uống đủ nước cùng bạn rồi!'
  },
  {
    id: 'growth',
    label: 'Phát triển bản thân',
    icon: Target,
    clip: 'level_up',
    foxDialog: 'Mỗi ngày tiến bộ 1% — cuối tháng nhìn lại bạn sẽ bất ngờ với level mới của chính mình!'
  },
  {
    id: 'balance',
    label: 'Cân bằng cuộc sống',
    icon: Compass,
    clip: 'head_pet',
    foxDialog: 'Làm hết mình, nghỉ ngơi trọn vẹn — Fox sẽ nhắc bạn thư giãn đúng lúc nha!'
  }
]

const PACE_OPTIONS: {
  id: string
  label: string
  tag: string
  clip: FoxOneShotClip
  foxDialog: string
}[] = [
  {
    id: '5m',
    label: '5 phút / ngày',
    tag: 'Nhẹ nhàng',
    clip: 'receive_like',
    foxDialog: 'Khởi đầu êm ái — chỉ 5 phút mỗi ngày cũng đủ tạo đà cho 3 thói quen đầu tiên!'
  },
  {
    id: '15m',
    label: '15 phút / ngày',
    tag: 'Đều đặn',
    clip: 'streak_cheer',
    foxDialog: '15 phút đều đặn là nhịp độ vàng để giữ chuỗi Streak siêu bền bỉ cùng Fox!'
  },
  {
    id: '30m',
    label: '30 phút / ngày',
    tag: 'Nghiêm túc',
    clip: 'quest_start',
    foxDialog: 'Nghiêm túc quá ta! Tốc độ này bạn sẽ lên cấp và mở khóa nhiều quà lắm luôn!'
  },
  {
    id: '60m',
    label: '60+ phút / ngày',
    tag: 'Bứt phá',
    clip: 'duo_celebrate',
    foxDialog: 'Đỉnh cao bứt phá! Fox bật chế độ đồng hành toàn lực chinh phục cột mốc lớn cùng bạn!'
  }
]

const FOX_TAP_CLIPS: { clip: FoxOneShotClip; text: string }[] = [
  { clip: 'happy', text: 'Hihi! Chạm vào Fox lấy thêm năng lượng tích cực nè!' },
  { clip: 'wave', text: 'Xin chào đồng đội mới! Mình đi tiếp bước kế nhé!' },
  { clip: 'duo_celebrate', text: 'Đập tay cái nè! Hành trình LifeQuest sắp bắt đầu rồi!' },
  { clip: 'head_pet', text: 'Êm quá đi mất~ Fox thích được bạn xoa đầu lắm!' }
]

interface RegisterErrors {
  email?: string
  username?: string
  password?: string
  confirmPassword?: string
}

export function RegisterPage() {
  const navigate = useNavigate()
  const companion = useOptionalCompanion()
  const companionRef = useRef(companion)
  companionRef.current = companion

  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]

  // Onboarding survey selections (stored locally as non-sensitive UI preferences)
  const [source, setSource] = useState<string | null>(null)
  const [goal, setGoal] = useState<string | null>(null)
  const [pace, setPace] = useState<string | null>(null)

  // Account fields — strictly 2 inputs per step (res1: email+username, res2: password+confirm)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [activeField, setActiveField] = useState<'none' | 'email' | 'username' | 'password' | 'confirm'>('none')
  const [tapCaption, setTapCaption] = useState<string | null>(null)
  const tapIdxRef = useRef(0)
  const tapTimerRef = useRef<number | null>(null)

  const [fieldErrors, setFieldErrors] = useState<RegisterErrors>({})
  const [submitError, setSubmitError] = useState<{ message: string; isNetwork?: boolean } | null>(
    null
  )
  const [submitting, setSubmitting] = useState(false)

  const submitLockRef = useRef(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  // Cleanup pose & lookAt on unmount
  useEffect(() => {
    return () => {
      if (tapTimerRef.current) window.clearTimeout(tapTimerRef.current)
      companionRef.current?.setPoseMode('none')
      companionRef.current?.update({ lookAt: true })
    }
  }, [])

  // Trigger real Gate I 3D Fox animations on step transitions
  useEffect(() => {
    const c = companionRef.current
    setTapCaption(null)
    setActiveField('none')
    if (!c) return
    c.setPoseMode('none')
    c.update({ lookAt: true })

    if (step === 'intro') {
      c.playClip('wave')
    } else if (step === 'preview') {
      c.playClip('achievement_unlock')
    } else if (step === 'res1') {
      c.playClip('friend_greet')
    } else if (step === 'res2') {
      c.playClip('task_suggestion')
    }
  }, [step])

  // Procedural 3D pose reactions (cover_eyes / peek / curious / nod) on res1 & res2 fields
  const isPasswordFieldActive = activeField === 'password' || activeField === 'confirm'
  const isPeekingPassword =
    (activeField === 'password' && showPassword) || (activeField === 'confirm' && showConfirm)

  useEffect(() => {
    const c = companionRef.current
    if (!c) return

    if (isPasswordFieldActive) {
      c.update({ lookAt: false, mood: isPeekingPassword ? 'surprised' : 'neutral' })
      c.setPoseMode(isPeekingPassword ? 'peek' : 'cover_eyes')
      return
    }

    c.update({ lookAt: true })
    if (activeField === 'email') {
      c.setPoseMode('curious')
    } else if (activeField === 'username') {
      c.setPoseMode('nod')
    } else {
      c.setPoseMode('none')
    }
  }, [activeField, isPasswordFieldActive, isPeekingPassword])

  const progressPct = Math.round(((stepIndex + 1) / STEPS.length) * 100)

  const validateRes1 = () => {
    const next: RegisterErrors = {}
    if (!email.trim()) {
      next.email = 'Vui lòng nhập email.'
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = 'Định dạng email không hợp lệ.'
    }
    const trimmedUser = username.trim()
    if (trimmedUser.length < 3 || trimmedUser.length > 50) {
      next.username = 'Tên đăng nhập phải từ 3 đến 50 ký tự.'
    }
    setFieldErrors(next)
    if (next.email) emailRef.current?.focus()
    else if (next.username) usernameRef.current?.focus()
    return Object.keys(next).length === 0
  }

  const validateRes2 = () => {
    const next: RegisterErrors = {}
    if (password.length < 8 || password.length > 72) {
      next.password = 'Mật khẩu phải từ 8 đến 72 ký tự.'
    }
    if (confirmPassword !== password) {
      next.confirmPassword = 'Mật khẩu xác nhận không khớp.'
    }
    setFieldErrors(next)
    if (next.password) passwordRef.current?.focus()
    else if (next.confirmPassword) confirmRef.current?.focus()
    return Object.keys(next).length === 0
  }

  const submitRegistration = async () => {
    if (submitLockRef.current) return
    setSubmitError(null)
    if (!validateRes2()) {
      companionRef.current?.setPoseMode('none')
      companionRef.current?.playClip('challenge_lose')
      return
    }

    submitLockRef.current = true
    setSubmitting(true)
    companionRef.current?.setPoseMode('none')
    companionRef.current?.playClip('study_start')
    try {
      await authApi.register({
        email: email.trim().toLowerCase(),
        username: username.trim(),
        password
      })
      try {
        window.localStorage.setItem(
          'lq:onboarding_prefs',
          JSON.stringify({ source, goal, pace })
        )
      } catch {
        // Ignore storage quota errors
      }
      companionRef.current?.playClip('level_up')
      navigate('/login', {
        replace: true,
        state: {
          registeredMessage: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.'
        }
      })
    } catch (err) {
      companionRef.current?.playClip('challenge_lose')
      if (err instanceof ApiClientError && (err.isNetworkError || err.status === 0)) {
        setSubmitError({
          message: 'Không thể kết nối máy chủ LifeQuest Backend. Vui lòng thử lại sau.',
          isNetwork: true
        })
      } else {
        setSubmitError({
          message: err instanceof Error ? err.message : 'Đăng ký thất bại.'
        })
      }
    } finally {
      submitLockRef.current = false
      setSubmitting(false)
    }
  }

  const canContinue = () => {
    if (step === 'source') return Boolean(source)
    if (step === 'goal') return Boolean(goal)
    if (step === 'pace') return Boolean(pace)
    if (step === 'res2') return !submitting
    return true
  }

  const handleBack = () => {
    setFieldErrors({})
    setSubmitError(null)
    if (stepIndex === 0) {
      navigate('/login')
      return
    }
    setStepIndex((i) => Math.max(0, i - 1))
  }

  const handleContinue = () => {
    setSubmitError(null)
    if (step === 'res1') {
      if (!validateRes1()) {
        companionRef.current?.playClip('challenge_lose')
        return
      }
      setFieldErrors({})
      setStepIndex(STEPS.indexOf('res2'))
      return
    }
    if (step === 'res2') {
      void submitRegistration()
      return
    }
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))
  }

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    handleContinue()
  }

  const handleFoxTap = () => {
    const next = FOX_TAP_CLIPS[tapIdxRef.current % FOX_TAP_CLIPS.length]
    tapIdxRef.current += 1
    companionRef.current?.setPoseMode('none')
    companionRef.current?.playClip(next.clip)
    setTapCaption(next.text)
    if (tapTimerRef.current) window.clearTimeout(tapTimerRef.current)
    tapTimerRef.current = window.setTimeout(() => {
      setTapCaption(null)
    }, 3200)
  }

  const selectedSourceMeta = SOURCE_OPTIONS.find((s) => s.id === source)
  const selectedGoalMeta = GOAL_OPTIONS.find((g) => g.id === goal)
  const selectedPaceMeta = PACE_OPTIONS.find((p) => p.id === pace)

  const getRes1Dialog = () => {
    if (tapCaption) return tapCaption
    if (activeField === 'email') {
      return 'Nhập Gmail/Email của bạn để Fox lưu giữ toàn bộ tiến trình nha!'
    }
    if (activeField === 'username') {
      const cleanName = username.trim()
      if (cleanName.length >= 3) {
        return `Tên @${cleanName} nghe chất quá chừng! Fox nhớ tên bạn rồi đó!`
      }
      return 'Chọn một tên đăng nhập thật ấn tượng cho hồ sơ LifeQuest của bạn nhé!'
    }
    return 'Tuyệt vời! Giờ tạo hồ sơ của bạn nhé — chỉ cần Email và tên hiển thị thôi.'
  }

  const getRes2Dialog = () => {
    if (tapCaption) return tapCaption
    if (submitting) return 'Đang tạo hồ sơ LifeQuest mới cho bạn...'
    if (isPeekingPassword) {
      return 'Ơ, bạn bật hiện mật khẩu rồi — Fox hé nhẹ một mắt nhắc bạn kiểm tra kỹ nhé!'
    }
    if (isPasswordFieldActive) {
      return 'Fox che mắt quay đi rồi nha — bạn cứ yên tâm đặt mật khẩu bí mật!'
    }
    return 'Bước cuối rồi! Đặt mật khẩu thật an toàn cho tài khoản nhé.'
  }

  const renderFox = (large = false) => (
    <div
      className={`${styles.foxInteractiveWrap} ${large ? styles.foxInteractiveLarge : ''} ${isPasswordFieldActive && !isPeekingPassword ? styles.foxPrivacyTurn : ''}`.trim()}
      onClick={handleFoxTap}
      role="button"
      tabIndex={0}
      aria-label="Tương tác với Cáo đồng hành LifeQuest V2"
      title="Chạm vào Fox để tương tác"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleFoxTap()
        }
      }}
    >
      <FoxCompanionView
        presentation="mini"
        label="register-fox-companion"
        className={styles.foxCanvasClean}
      />
    </div>
  )

  return (
    <div className={styles.wizardShell} data-testid="register-wizard" data-step={step}>
      {/* Top Progress Bar Header */}
      <header className={styles.topHeader}>
        <button
          type="button"
          className={styles.backIconBtn}
          onClick={handleBack}
          aria-label={stepIndex === 0 ? 'Quay lại Đăng nhập' : 'Quay lại bước trước'}
          data-testid="register-back-btn"
        >
          <ArrowLeft size={22} strokeWidth={2.4} aria-hidden="true" />
        </button>

        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Tiến trình đăng ký LifeQuest"
        >
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>

        <div className={styles.headerRightActions}>
          {stepIndex < STEPS.indexOf('res1') && (
            <button
              type="button"
              className={styles.skipBtn}
              onClick={() => setStepIndex(STEPS.indexOf('res1'))}
              data-testid="register-skip-survey-btn"
            >
              Bỏ qua khảo sát
            </button>
          )}
          <Link to="/login" className={styles.loginSwitchLink} data-testid="auth-top-action-link">
            ĐĂNG NHẬP
          </Link>
        </div>
      </header>

      {/* Center Interactive Step Content */}
      <main className={styles.stageMain} data-testid="auth-fox-stage">
        {step === 'intro' && (
          <div className={styles.introBlock}>
            <div className={styles.speechBubbleTop} role="status" data-testid="register-fox-dialog">
              {tapCaption ?? 'Chào bạn! Mình là Fox — cùng bắt đầu hành trình LifeQuest nhé!'}
            </div>
            {renderFox(true)}
            <p className={styles.introSubtext}>
              Chỉ mất 30 giây khảo sát nhanh để Fox cá nhân hóa mục tiêu và nhịp độ phù hợp nhất với
              bạn.
            </p>
          </div>
        )}

        {step === 'source' && (
          <>
            <div className={styles.foxPromptRow}>
              {renderFox()}
              <div className={styles.speechBubbleSide} role="status" data-testid="register-fox-dialog">
                {tapCaption ?? selectedSourceMeta?.foxDialog ?? 'Bạn biết đến LifeQuest qua đâu?'}
              </div>
            </div>
            <div className={styles.optionGridTwo} role="radiogroup" aria-label="Nguồn biết đến LifeQuest">
              {SOURCE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const selected = source === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`${styles.optionCard} ${selected ? styles.optionCardSelected : ''}`.trim()}
                    onClick={() => {
                      setTapCaption(null)
                      setSource(opt.id)
                      companionRef.current?.setPoseMode('nod')
                      companionRef.current?.playClip(opt.clip)
                    }}
                    data-testid={`survey-source-${opt.id}`}
                  >
                    <span className={styles.optionLeft}>
                      <span className={styles.optionIconBadge}>
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span>{opt.label}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 'goal' && (
          <>
            <div className={styles.foxPromptRow}>
              {renderFox()}
              <div className={styles.speechBubbleSide} role="status" data-testid="register-fox-dialog">
                {tapCaption ??
                  selectedGoalMeta?.foxDialog ??
                  'Bạn muốn cùng Fox chinh phục mục tiêu nào nhất?'}
              </div>
            </div>
            <div className={styles.optionGridTwo} role="radiogroup" aria-label="Mục tiêu chính">
              {GOAL_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const selected = goal === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`${styles.optionCard} ${selected ? styles.optionCardSelected : ''}`.trim()}
                    onClick={() => {
                      setTapCaption(null)
                      setGoal(opt.id)
                      companionRef.current?.setPoseMode('nod')
                      companionRef.current?.playClip(opt.clip)
                    }}
                    data-testid={`survey-goal-${opt.id}`}
                  >
                    <span className={styles.optionLeft}>
                      <span className={styles.optionIconBadge}>
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span>{opt.label}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 'pace' && (
          <>
            <div className={styles.foxPromptRow}>
              {renderFox()}
              <div className={styles.speechBubbleSide} role="status" data-testid="register-fox-dialog">
                {tapCaption ??
                  selectedPaceMeta?.foxDialog ??
                  'Mục tiêu tập trung mỗi ngày của bạn là bao nhiêu?'}
              </div>
            </div>
            <div className={styles.optionListSingle} role="radiogroup" aria-label="Nhịp độ mỗi ngày">
              {PACE_OPTIONS.map((opt) => {
                const selected = pace === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`${styles.optionCard} ${selected ? styles.optionCardSelected : ''}`.trim()}
                    onClick={() => {
                      setTapCaption(null)
                      setPace(opt.id)
                      companionRef.current?.setPoseMode('nod')
                      companionRef.current?.playClip(opt.clip)
                    }}
                    data-testid={`survey-pace-${opt.id}`}
                  >
                    <span>{opt.label}</span>
                    <span className={styles.optionMetaRight}>{opt.tag}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <div className={styles.foxPromptRow}>
              {renderFox()}
              <div className={styles.speechBubbleSide} role="status" data-testid="register-fox-dialog">
                {tapCaption ?? 'Và đây là những thành quả bạn sẽ đạt được cùng LifeQuest!'}
              </div>
            </div>
            <div className={styles.benefitList}>
              <div className={styles.benefitItem}>
                <span className={styles.benefitIcon} style={{ background: '#FFF1E6', color: '#F26733' }}>
                  <CheckCircle2 size={22} aria-hidden="true" />
                </span>
                <div>
                  <h2 className={styles.benefitTitle}>Biến việc hằng ngày thành Quest</h2>
                  <p className={styles.benefitDesc}>
                    Chia nhỏ mục tiêu thành nhiệm vụ rõ ràng, nhận XP &amp; Xu mỗi khi hoàn thành.
                  </p>
                </div>
              </div>
              <div className={styles.benefitItem}>
                <span className={styles.benefitIcon} style={{ background: '#E6F5F1', color: '#168C78' }}>
                  <Flame size={22} aria-hidden="true" />
                </span>
                <div>
                  <h2 className={styles.benefitTitle}>Giữ chuỗi thói quen không áp lực</h2>
                  <p className={styles.benefitDesc}>
                    Duy trì Streak nhẹ nhàng với lịch trực quan và lời nhắc đúng nhịp độ bạn chọn.
                  </p>
                </div>
              </div>
              <div className={styles.benefitItem}>
                <span className={styles.benefitIcon} style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                  <Trophy size={22} aria-hidden="true" />
                </span>
                <div>
                  <h2 className={styles.benefitTitle}>Đồng hành &amp; Lên cấp cùng Fox V2</h2>
                  <p className={styles.benefitDesc}>
                    Mở khóa trang phục, thử thách nhóm và ăn mừng mọi cột mốc quan trọng.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 'res1' && (
          <>
            <div className={`${styles.foxPromptRow} ${styles.foxPromptRowCompact}`}>
              {renderFox()}
              <div className={styles.speechBubbleSide} role="status" data-testid="register-fox-dialog">
                {getRes1Dialog()}
              </div>
            </div>
            <form
              id="register-step-form"
              className={styles.stepFormWrap}
              onSubmit={handleFormSubmit}
              noValidate
            >
              <div className={styles.stepFormHeader}>
                <h1 className={styles.stepTitle}>Tạo tài khoản LifeQuest</h1>
                <p className={styles.stepSubtitle}>Bước 1/2 · Thông tin định danh</p>
              </div>

              <div className={styles.field}>
                <label htmlFor="reg-email" className={styles.fieldLabel}>
                  Email
                </label>
                <div className={styles.inputWrap}>
                  <input
                    ref={emailRef}
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    className={`${styles.input} ${fieldErrors.email ? styles.inputInvalid : ''}`.trim()}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }))
                    }}
                    onFocus={() => setActiveField('email')}
                    onBlur={() => setActiveField((prev) => (prev === 'email' ? 'none' : prev))}
                    aria-invalid={Boolean(fieldErrors.email)}
                    placeholder="name@gmail.com"
                  />
                </div>
                {fieldErrors.email && (
                  <span className={styles.fieldError} role="alert">
                    <AlertCircle size={13} aria-hidden="true" />
                    <span>{fieldErrors.email}</span>
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="reg-username" className={styles.fieldLabel}>
                  Tên đăng nhập
                </label>
                <div className={styles.inputWrap}>
                  <input
                    ref={usernameRef}
                    id="reg-username"
                    type="text"
                    autoComplete="username"
                    className={`${styles.input} ${fieldErrors.username ? styles.inputInvalid : ''}`.trim()}
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      if (fieldErrors.username) {
                        setFieldErrors((p) => ({ ...p, username: undefined }))
                      }
                    }}
                    onFocus={() => setActiveField('username')}
                    onBlur={() => setActiveField((prev) => (prev === 'username' ? 'none' : prev))}
                    aria-invalid={Boolean(fieldErrors.username)}
                    placeholder="vd: fox_explorer"
                  />
                </div>
                <span className={styles.fieldHint}>Từ 3 đến 50 ký tự.</span>
                {fieldErrors.username && (
                  <span className={styles.fieldError} role="alert">
                    <AlertCircle size={13} aria-hidden="true" />
                    <span>{fieldErrors.username}</span>
                  </span>
                )}
              </div>
            </form>
          </>
        )}

        {step === 'res2' && (
          <>
            <div className={`${styles.foxPromptRow} ${styles.foxPromptRowCompact}`}>
              {renderFox()}
              <div className={styles.speechBubbleSide} role="status" data-testid="register-fox-dialog">
                {getRes2Dialog()}
              </div>
            </div>
            <form
              id="register-step-form"
              className={styles.stepFormWrap}
              onSubmit={handleFormSubmit}
              noValidate
            >
              <div className={styles.stepFormHeader}>
                <h1 className={styles.stepTitle}>Bảo mật tài khoản</h1>
                <p className={styles.stepSubtitle}>Bước 2/2 · Thiết lập mật khẩu</p>
              </div>

              {submitError && (
                <div
                  className={styles.alertError}
                  role="alert"
                  data-testid={
                    submitError.isNetwork ? 'register-network-error' : 'register-submit-error'
                  }
                >
                  {submitError.isNetwork ? (
                    <WifiOff size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                  ) : (
                    <AlertCircle size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                  )}
                  <div>
                    <span>{submitError.message}</span>
                    {!submitError.isNetwork && (
                      <button
                        type="button"
                        className={styles.editPrevBtn}
                        onClick={() => {
                          setSubmitError(null)
                          setStepIndex(STEPS.indexOf('res1'))
                        }}
                      >
                        ← Quay lại sửa Email / Tên đăng nhập
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.field}>
                <label htmlFor="reg-password" className={styles.fieldLabel}>
                  Mật khẩu
                </label>
                <div className={styles.inputWrap}>
                  <input
                    ref={passwordRef}
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`${styles.input} ${styles.inputWithToggle} ${fieldErrors.password ? styles.inputInvalid : ''}`.trim()}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (fieldErrors.password) {
                        setFieldErrors((p) => ({ ...p, password: undefined }))
                      }
                    }}
                    onFocus={() => setActiveField('password')}
                    onBlur={() => setActiveField((prev) => (prev === 'password' ? 'none' : prev))}
                    aria-invalid={Boolean(fieldErrors.password)}
                    placeholder="Ít nhất 8 ký tự"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleBtn}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ẩn ký tự bí mật' : 'Hiện ký tự bí mật'}
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-pressed={showPassword}
                    data-testid="register-toggle-password"
                  >
                    {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                  </button>
                </div>
                <span className={styles.fieldHint}>Từ 8 đến 72 ký tự.</span>
                {fieldErrors.password && (
                  <span className={styles.fieldError} role="alert">
                    <AlertCircle size={13} aria-hidden="true" />
                    <span>{fieldErrors.password}</span>
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="reg-confirm" className={styles.fieldLabel}>
                  Xác nhận mật khẩu
                </label>
                <div className={styles.inputWrap}>
                  <input
                    ref={confirmRef}
                    id="reg-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`${styles.input} ${styles.inputWithToggle} ${fieldErrors.confirmPassword ? styles.inputInvalid : ''}`.trim()}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((p) => ({ ...p, confirmPassword: undefined }))
                      }
                    }}
                    onFocus={() => setActiveField('confirm')}
                    onBlur={() => setActiveField((prev) => (prev === 'confirm' ? 'none' : prev))}
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    placeholder="Nhập lại mật khẩu"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleBtn}
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? 'Ẩn ký tự xác nhận' : 'Hiện ký tự xác nhận'}
                    title={showConfirm ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                    aria-pressed={showConfirm}
                    data-testid="register-toggle-confirm"
                  >
                    {showConfirm ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <span className={styles.fieldError} role="alert">
                    <AlertCircle size={13} aria-hidden="true" />
                    <span>{fieldErrors.confirmPassword}</span>
                  </span>
                )}
              </div>
            </form>
          </>
        )}
      </main>

      {/* Fixed-feel Duolingo Bottom Action Bar */}
      <footer className={styles.bottomBar}>
        <div className={styles.bottomBarInner}>
          <span className={styles.stepCounter}>
            Bước {stepIndex + 1} / {STEPS.length}
          </span>
          <button
            type={step === 'res1' || step === 'res2' ? 'submit' : 'button'}
            form={step === 'res1' || step === 'res2' ? 'register-step-form' : undefined}
            className={styles.continueBtn}
            onClick={step === 'res1' || step === 'res2' ? undefined : handleContinue}
            disabled={!canContinue()}
            data-testid={step === 'res2' ? 'register-submit-btn' : 'register-continue-btn'}
          >
            {submitting && <Loader2 size={17} className={styles.spinIcon} aria-hidden="true" />}
            <span>
              {step === 'res2'
                ? submitting
                  ? 'Đang tạo tài khoản...'
                  : 'Hoàn tất đăng ký'
                : 'Tiếp tục'}
            </span>
          </button>
        </div>
      </footer>
    </div>
  )
}
