import type { CSSProperties } from 'react'
import { PawPrint } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LANDING_FOX_ASSETS } from './landingAssets'
import {
  CP1_HABITS,
  CP1_HABIT_DAYS,
  CP1_TASKS,
  CP1_TODAY_INDEX,
  CP2_EPICS,
  CP2_QUEST_TASKS,
  CP3_FOX_MOODS,
  CP4_SOCIAL_FEATURES,
  DESKTOP_FIREFLIES,
  FINALE_STARS,
  FOOTER_STARS,
  LANDING_COPY,
  type HabitDayStatus,
} from './landingData'
import type { LegalTopic } from './LandingLegalNotice'
import {
  BrandLogo,
  CampfireSvg,
  DesktopCheckpointBadge,
  FoxPicture,
  LandingIcon,
  TreeGroup,
} from './LandingPrimitives'
import styles from './LandingPage.module.css'

interface LandingDesktopProps {
  onOpenLegal: (topic: Exclude<LegalTopic, null>) => void
  onScrollTop: () => void
}

function getHabitDotStyle(status: HabitDayStatus): CSSProperties {
  const base: CSSProperties = {
    width: 18,
    height: 18,
    borderRadius: '50%',
    display: 'block',
    boxSizing: 'border-box',
  }
  if (status === 'done') return { ...base, background: '#2C9B63' }
  if (status === 'today') return { ...base, background: '#FFFFFF', border: '2px solid #F26B2E' }
  if (status === 'future') return { ...base, background: 'transparent', border: '1.5px dashed #D6D2C9' }
  return { ...base, background: '#EFECE6' }
}

export function LandingDesktop({ onOpenLegal, onScrollTop }: LandingDesktopProps) {
  return (
    <div className={styles.vDesktop} data-testid="landing-desktop">
      <div className={styles.lqPage}>
        {/* ==================== HERO ==================== */}
        <section id="top" className={styles.desktopHero}>
          {/* Sky & Clouds */}
          <svg
            className={styles.lqParSky}
            viewBox="0 0 1440 900"
            preserveAspectRatio="xMidYMax slice"
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0 }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="lqSkyDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FBF5EC" />
                <stop offset="0.62" stopColor="#F9E6D3" />
              </linearGradient>
            </defs>
            <rect width="1440" height="900" fill="url(#lqSkyDesktop)" />
            <circle cx="1068" cy="470" r="96" fill="#FCDDB4" opacity="0.8" />
            <g className={styles.lqCloud} transform="translate(250 470) scale(1.1)" fill="#FFFFFF" opacity="0.9">
              <ellipse cx="0" cy="0" rx="46" ry="18" />
              <circle cx="-14" cy="-10" r="18" />
              <circle cx="14" cy="-14" r="22" />
            </g>
            <g className={styles.lqCloud} transform="translate(1290 420) scale(0.9)" fill="#FFFFFF" opacity="0.9">
              <ellipse cx="0" cy="0" rx="46" ry="18" />
              <circle cx="-14" cy="-10" r="18" />
              <circle cx="14" cy="-14" r="22" />
            </g>
            <g className={styles.lqCloud} transform="translate(1180 520) scale(0.5)" fill="#FFFFFF" opacity="0.9">
              <ellipse cx="0" cy="0" rx="46" ry="18" />
              <circle cx="-14" cy="-10" r="18" />
              <circle cx="14" cy="-14" r="22" />
            </g>
          </svg>

          {/* Far Hill */}
          <svg
            className={styles.lqParFar}
            viewBox="0 0 1440 900"
            preserveAspectRatio="xMidYMax slice"
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0 }}
            aria-hidden="true"
          >
            <path
              d="M0 575 C 180 520 360 535 520 556 C 700 580 860 512 1040 528 C 1220 545 1340 506 1440 520 V900 H0Z"
              fill="#D9EDE5"
            />
            <TreeGroup x={410} y={612} scale={0.6} />
            <TreeGroup x={1190} y={600} scale={0.55} />
          </svg>

          {/* Mid Hill */}
          <svg
            className={styles.lqParMid}
            viewBox="0 0 1440 900"
            preserveAspectRatio="xMidYMax slice"
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0 }}
            aria-hidden="true"
          >
            <path
              d="M0 650 C 240 600 430 628 640 640 C 860 652 1080 592 1440 622 V900 H0Z"
              fill="#C2E2D7"
            />
            <TreeGroup x={150} y={655} scale={1.2} />
            <TreeGroup x={232} y={668} scale={0.9} variant="soft" />
            <TreeGroup x={1300} y={640} scale={1.3} />
            <TreeGroup x={1385} y={660} scale={0.9} variant="soft" />
          </svg>

          {/* Foreground Sand Hill + Tent + Adventure Path */}
          <svg
            viewBox="0 0 1440 900"
            preserveAspectRatio="xMidYMax slice"
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0 }}
            aria-hidden="true"
          >
            <path
              d="M0 730 C 300 700 600 712 900 720 C 1150 728 1300 700 1440 708 V900 H0Z"
              fill="#F3E5CF"
            />
            <g transform="translate(1205 724) scale(0.9)">
              <path d="M-60 0 L0 -84 L60 0 Z" fill="#F26B3A" />
              <path d="M-60 0 L0 -84 L-22 0 Z" fill="#E0582A" />
              <path d="M-14 0 L0 -40 L14 0 Z" fill="#FCEBD8" />
              <path d="M0 -84 L0 -98" stroke="#16324A" strokeWidth="4" strokeLinecap="round" />
            </g>
            <path
              d="M520 900 C 560 800 830 790 830 726 C 830 664 690 652 752 600 C 792 568 960 560 1052 542 L1072 544 C 990 570 852 588 824 614 C 788 650 944 668 944 730 C 944 806 780 826 940 900 Z"
              fill="#FDEEDD"
              stroke="#EBCBA9"
              strokeWidth="3"
            />
            <path
              className={styles.lqDash}
              d="M730 900 C 740 820 888 800 888 728 C 888 664 760 650 790 606 C 820 572 960 560 1062 543"
              fill="none"
              stroke="#F0C79D"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="2 22"
            />
            <g transform="translate(1064 544) scale(0.9)">
              <path d="M0 0 V -64" stroke="#16324A" strokeWidth="5" strokeLinecap="round" />
              <path d="M2 -62 h 36 l -9 12 9 12 h -36 z" fill="#F26B3A" />
            </g>
            <circle cx="820" cy="606" r="13" fill="#FFFFFF" stroke="#168C78" strokeWidth="5" />
            <circle cx="960" cy="562" r="10" fill="#FFFFFF" stroke="#F26B3A" strokeWidth="5" />
          </svg>

          {/* Header */}
          <header className={styles.desktopHeader}>
            <div className={styles.desktopHeaderInner}>
              <a
                href="#top"
                aria-label="LifeQuest — trang chủ"
                className={styles.brandLink}
                onClick={(e) => {
                  e.preventDefault()
                  onScrollTop()
                }}
              >
                <BrandLogo size="desktop" />
              </a>
              <Link to="/login" className={styles.desktopLoginBtn} data-testid="landing-login-btn">
                {LANDING_COPY.headerLoginCta}
              </Link>
            </div>
          </header>

          {/* Hero Copy & CTA */}
          <div className={`${styles.lqHxText} ${styles.desktopHeroTextWrap}`}>
            <div className={styles.desktopHeroTextCol}>
              <h1 className={`${styles.lqIn} ${styles.desktopHeroTitle}`}>
                {LANDING_COPY.heroHeadlineLine1}
                <br />
                {LANDING_COPY.heroHeadlineLine2Prefix}
                <span className={styles.accentOrange}>{LANDING_COPY.heroHeadlineAccent}</span>
              </h1>
              <p className={`${styles.lqIn} ${styles.desktopHeroSub}`}>{LANDING_COPY.heroSubtitle}</p>
              <div className={`${styles.lqIn} ${styles.desktopHeroCtaGroup}`}>
                <Link
                  to="/register"
                  className={`${styles.lqCta} ${styles.primaryCtaDesktop}`}
                  data-testid="landing-start-btn"
                >
                  {LANDING_COPY.heroPrimaryCta}
                </Link>
                <Link to="/login" className={styles.secondaryLoginLink}>
                  {LANDING_COPY.heroSecondaryPrefix}
                  <span className={styles.secondaryLoginAccent}>{LANDING_COPY.heroSecondaryCta}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Hero Fox V2 */}
          <div className={`${styles.lqHxFox} ${styles.desktopHeroFox}`}>
            <div className={styles.lqIn} style={{ animationDelay: '0.4s' }}>
              <FoxPicture
                asset={LANDING_FOX_ASSETS.hero}
                alt="Fox V2 đang bước lên con đường hành trình"
                style={{ height: 360, width: 'auto', display: 'block' }}
                loading="eager"
              />
            </div>
          </div>

          {/* Floating Hero Chips */}
          <div className={`${styles.lqHxChips} ${styles.desktopHeroChips}`}>
            <div
              className={`${styles.lqFloat} ${styles.heroFloatCard}`}
              style={{
                left: 'max(24px, calc(50% - 560px))',
                top: 600,
                animationDelay: '0.7s',
                transform: 'rotate(-3deg)',
              }}
              aria-hidden="true"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={styles.taskCheckDone}>
                  <LandingIcon name="check" size={15} color="#FFFFFF" strokeWidth={3} />
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#16324A' }}>Chạy bộ 20 phút</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#127A68' }}>Đã xong · +35 XP</div>
                </div>
              </div>
            </div>

            <div
              className={`${styles.lqFloat} ${styles.heroFloatCard}`}
              style={{
                left: 'min(calc(100% - 190px), calc(50% + 330px))',
                top: 640,
                animationDelay: '1.4s',
                transform: 'rotate(3deg)',
              }}
              aria-hidden="true"
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#B84317',
                }}
              >
                <LandingIcon name="flame" size={20} color="#F26B3A" />
                Streak 5 ngày
              </div>
            </div>

            <div
              className={`${styles.lqFloat} ${styles.heroFloatCard}`}
              style={{
                left: 'min(calc(100% - 224px), calc(50% + 400px))',
                top: 455,
                width: 200,
                animationDelay: '2.1s',
                transform: 'rotate(0deg)',
              }}
              aria-hidden="true"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, fontWeight: 800 }}>
                <span style={{ color: '#B84317' }}>QUEST</span>
                <span style={{ color: '#4D6274' }}>2/5 chặng</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#16324A', margin: '2px 0 8px' }}>
                Đạt IELTS 6.5
              </div>
              <div style={{ height: 8, borderRadius: 999, background: '#F1ECE4', overflow: 'hidden' }}>
                <div style={{ width: '46%', height: '100%', borderRadius: 999, background: '#F26B3A' }} />
              </div>
            </div>
          </div>
        </section>

        {/* Wave Divider 1 */}
        <div aria-hidden="true" style={{ position: 'relative', height: 120, background: '#F5F3EE', margin: '-1px 0' }}>
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            width="100%"
            height="120"
            style={{ position: 'absolute', inset: 0, display: 'block' }}
          >
            <g>
              <path d="M0 78 C 260 38 470 108 720 70 C 980 32 1180 112 1440 62 V120 H0 Z" fill="#F4EADB" />
              <path d="M0 98 C 260 58 470 128 720 90 C 980 52 1180 132 1440 82 V120 H0 Z" fill="#F5F3EE" />
              <path d="M0 0 H1440 V58 C 1180 112 980 18 720 62 C 470 104 250 28 0 74 Z" fill="#F3E5CF" />
            </g>
            <path
              className={styles.lqDash}
              d="M720 0 C 724 48 716 72 720 120"
              fill="none"
              stroke="#EBCBA9"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="2 20"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* ==================== CHẶNG 1 — TASK & HABIT ==================== */}
        <section id="cp1" className={styles.desktopCp1}>
          <svg
            viewBox="0 0 1440 1000"
            preserveAspectRatio="none"
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0, zIndex: 0 }}
            aria-hidden="true"
          >
            <path
              className={styles.lqDash}
              d="M720 0 C 720 120 120 160 110 500 C 100 820 720 860 720 1000"
              fill="none"
              stroke="#EBCBA9"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="2 20"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto' }}>
            <DesktopCheckpointBadge step="CHẶNG 1" label="Việc mỗi ngày" />

            <div
              className={styles.lqReveal}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                margin: '28px 0 64px',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <h2 className={styles.sectionTitleDesktop} style={{ textAlign: 'center' }}>
                Việc nhỏ mỗi ngày,
                <br />
                thay đổi lớn mai sau.
              </h2>
              <p className={styles.sectionSubDesktop} style={{ textAlign: 'center' }}>
                Ghi việc cần làm, đánh dấu khi xong, giữ lửa cho thói quen. Mỗi dấu tích là một bước trên con đường của
                bạn.
              </p>
            </div>

            <div className={styles.lqOutShrink}>
              <div
                className={styles.lqReveal}
                style={{
                  position: 'relative',
                  maxWidth: 960,
                  margin: '0 auto',
                  background: '#FFFFFF',
                  border: '2px solid #EAE3D8',
                  borderRadius: 28,
                  boxShadow: '0 8px 0 #EAE3D8, 0 40px 80px rgba(22,50,74,0.08)',
                }}
              >
                {/* Mock Window Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '14px 20px',
                    borderBottom: '2px solid #F1ECE4',
                  }}
                >
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#F3B8A0' }} />
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#F6D89B' }} />
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#B8DDD2' }} />
                  <span style={{ marginLeft: 12, display: 'flex', gap: 6 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: '#F26B3A',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      Task
                    </span>
                    <span className={styles.pillMuted} style={{ fontSize: 12 }}>
                      Habit
                    </span>
                    <span className={styles.pillMuted} style={{ fontSize: 12 }}>
                      Quest
                    </span>
                  </span>
                </div>

                {/* Split Preview Columns */}
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {/* Today Tasks */}
                  <div style={{ flex: '1.25 1 380px', minWidth: 0, padding: '26px 28px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#4D6274' }}>Thứ Năm, 26/11</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#16324A' }}>Hôm nay</div>
                      </div>
                      <span className={styles.pillSuccess}>2/4 xong</span>
                    </div>

                    {CP1_TASKS.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '11px 0',
                          borderTop: '1.5px solid #F1ECE4',
                        }}
                      >
                        {task.done ? (
                          <span className={styles.taskCheckDone}>
                            <LandingIcon name="check" size={15} color="#FFFFFF" strokeWidth={3} />
                          </span>
                        ) : (
                          <span className={styles.taskCheckTodo} />
                        )}
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontSize: 15,
                            fontWeight: 700,
                            textDecoration: task.done ? 'line-through' : 'none',
                            color: task.done ? '#4D6274' : '#16324A',
                          }}
                        >
                          {task.title}
                        </span>
                        <span style={{ display: 'flex', gap: 6 }}>
                          {task.time && (
                            <span className={styles.pillMuted}>
                              <LandingIcon name="clock" size={12} color="#4D6274" />
                              {task.time}
                            </span>
                          )}
                          {task.xp && <span className={styles.pillXp}>{task.xp}</span>}
                          {task.tag && <span className={styles.pillPurple}>{task.tag}</span>}
                        </span>
                      </div>
                    ))}

                    <div
                      style={{
                        marginTop: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 14px',
                        borderRadius: 14,
                        border: '2px dashed #EAE3D8',
                        color: '#4D6274',
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      <span style={{ fontSize: 20, color: '#F26B3A', fontWeight: 800 }}>+</span>
                      Thêm việc cho hôm nay…
                    </div>
                  </div>

                  {/* Habits Column */}
                  <div
                    style={{
                      flex: '1 1 300px',
                      minWidth: 0,
                      padding: '26px 28px',
                      background: '#FCFAF6',
                      borderLeft: '2px solid #F1ECE4',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#16324A' }}>Thói quen</div>
                      <span className={styles.pillNeutral}>Bản xem trước</span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#8B99A8',
                        margin: '4px 0 4px',
                      }}
                    >
                      {CP1_HABIT_DAYS.map((day, idx) => (
                        <span
                          key={day}
                          style={{
                            width: 18,
                            textAlign: 'center',
                            color: idx === CP1_TODAY_INDEX ? '#D9511F' : '#8B99A8',
                          }}
                        >
                          {day}
                        </span>
                      ))}
                    </div>

                    {CP1_HABITS.map((habit) => (
                      <div key={habit.id} style={{ padding: '12px 0', borderTop: '1.5px solid #F1ECE4' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: 14,
                            fontWeight: 800,
                            color: '#16324A',
                            marginBottom: 9,
                          }}
                        >
                          <span>{habit.title}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#D9511F' }}>
                            <PawPrint size={14} color="#F26B2E" aria-hidden="true" />
                            {habit.streak}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          {habit.days.map((status, idx) => (
                            <span key={CP1_HABIT_DAYS[idx]} style={getHabitDotStyle(status)} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Peeking Fox V2 */}
                <FoxPicture
                  asset={LANDING_FOX_ASSETS.cp1}
                  alt=""
                  style={{ position: 'absolute', right: -40, top: -118, height: 150, width: 'auto' }}
                />

                {/* Floating XP Chip */}
                <div
                  className={styles.lqFloat}
                  style={{
                    position: 'absolute',
                    left: -70,
                    bottom: -26,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    borderRadius: 18,
                    background: '#F6C85F',
                    boxShadow: '0 5px 0 #D9A83C',
                    fontSize: 15,
                    fontWeight: 800,
                    color: '#7A5400',
                    transform: 'rotate(-4deg)',
                  }}
                  aria-hidden="true"
                >
                  <LandingIcon name="star" size={18} color="#7A5400" />
                  +65 XP hôm nay
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== CHẶNG 2 — QUEST & EPIC ==================== */}
        <section id="cp2" className={styles.desktopCp2}>
          <div style={{ position: 'relative', height: 70 }}>
            <svg
              viewBox="0 0 1440 1000"
              preserveAspectRatio="none"
              width="100%"
              height="100%"
              style={{ position: 'absolute', inset: 0, zIndex: 0 }}
              aria-hidden="true"
            >
              <path
                className={styles.lqDash}
                d="M720 0 C 720 300 720 700 720 1000"
                fill="none"
                stroke="#EBCBA9"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="2 20"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          <DesktopCheckpointBadge step="CHẶNG 2" label="Quest & Epic" />

          <div style={{ height: 40 }} />

          <div
            className={styles.lqReveal}
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              padding: '0 48px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 24,
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div style={{ flex: '1 1 520px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h2 className={styles.sectionTitleDesktop}>
                Mọi mục tiêu lớn đều
                <br />
                bắt đầu từ một chặng nhỏ.
              </h2>
            </div>
            <div style={{ flex: '1 1 400px' }}>
              <p style={{ margin: 0, maxWidth: 420, fontSize: 18, lineHeight: 1.6, color: '#4D6274' }}>
                Chia mục tiêu thành từng chặng, mỗi chặng là vài việc làm được ngay hôm nay.
              </p>
              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, justifyContent: 'flex-end' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: '#16324A' }}>
                    <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#FFF0E6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LandingIcon name="flag" size={16} color="#B84317" />
                    </span>
                    Quest<span style={{ fontWeight: 600, color: '#4D6274' }}>mục tiêu lớn</span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: '#16324A' }}>
                    <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#FDF3D7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LandingIcon name="map" size={16} color="#7A5400" />
                    </span>
                    Epic<span style={{ fontWeight: 600, color: '#4D6274' }}>từng chặng</span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: '#16324A' }}>
                    <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#E3F3EF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LandingIcon name="check" size={16} color="#127A68" />
                    </span>
                    Task<span style={{ fontWeight: 600, color: '#4D6274' }}>việc hôm nay</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scenic Quest Map */}
          <div className={styles.lqHillWipe} style={{ position: 'relative', height: 560, marginTop: 140 }}>
            <svg
              viewBox="0 0 1440 560"
              preserveAspectRatio="xMidYMax slice"
              width="100%"
              height="100%"
              style={{ position: 'absolute', inset: 0 }}
              aria-hidden="true"
            >
              <rect width="1440" height="560" fill="#E9F4EF" />
              <path
                d="M0 250 C 220 180 420 210 620 230 C 860 255 1100 170 1440 200 V560 H0Z"
                fill="#D5EBE3"
              />
              <path
                d="M0 360 C 260 320 520 350 760 352 C 1020 354 1220 310 1440 330 V560 H0Z"
                fill="#C2E2D7"
              />
              <TreeGroup x={60} y={420} scale={1.1} />
              <TreeGroup x={1380} y={380} scale={1.2} />
              <TreeGroup x={520} y={470} scale={0.7} variant="soft" />
              <TreeGroup x={1020} y={470} scale={0.8} />
              <path
                d="M-20 400 C 100 400 140 330 220 330 S 380 230 460 230 S 640 320 720 320 S 900 220 980 220 S 1140 300 1220 300 S 1380 250 1460 250"
                fill="none"
                stroke="#FBEFE2"
                strokeWidth="44"
                strokeLinecap="round"
              />
              <path
                d="M-20 400 C 100 400 140 330 220 330 S 380 230 460 230 S 640 320 720 320"
                className={styles.lqDash}
                fill="none"
                stroke="#168C78"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="2 18"
              />
              <path
                d="M720 320 S 900 220 980 220 S 1140 300 1220 300 S 1380 250 1460 250"
                fill="none"
                stroke="#E6CDB0"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="2 18"
              />
            </svg>

            {/* 5 Epic Nodes */}
            {CP2_EPICS.map((epic) => {
              const isDone = epic.status === 'done'
              const isActive = epic.status === 'active'
              const nodeBg = isDone ? '#168C78' : isActive ? '#F26B3A' : '#FFFFFF'
              const nodeShadow = isDone
                ? '0 7px 0 #0F6B5B'
                : isActive
                  ? '0 7px 0 #C84B1D, 0 0 0 12px rgba(242,107,58,0.18)'
                  : '0 7px 0 #D8CDBD'
              return (
                <div
                  key={epic.id}
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${epic.desktopLeftOffset}px)`,
                    top: epic.desktopTop,
                    zIndex: 2,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 150 }}>
                    <span
                      className={isActive ? styles.lqPulse : undefined}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: nodeBg,
                        boxShadow: nodeShadow,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isDone && <LandingIcon name="check" size={32} color="#FFFFFF" strokeWidth={3.2} />}
                      {isActive && <LandingIcon name="star" size={30} color="#FFFFFF" />}
                      {epic.status === 'locked' && <LandingIcon name="lock" size={26} color="#9A8F80" strokeWidth={2.4} />}
                    </span>
                    <span
                      style={{
                        padding: '6px 12px',
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.92)',
                        textAlign: 'center',
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#4D6274',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {epic.label}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: epic.status === 'locked' ? '#4D6274' : '#16324A',
                        }}
                      >
                        {epic.title}
                      </span>
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Finish Flag */}
            <div
              style={{
                position: 'absolute',
                left: 'min(calc(100% - 140px), calc(50% + 580px))',
                top: 150,
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
              aria-hidden="true"
            >
              <svg width="60" height="80" viewBox="0 0 60 80">
                <path d="M12 76V6" stroke="#16324A" strokeWidth="5" strokeLinecap="round" />
                <path d="M14 8h34l-9 12 9 12H14z" fill="#F6C85F" stroke="#D9A83C" strokeWidth="2" />
              </svg>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#7A5400',
                  background: '#FDF3D7',
                  padding: '5px 12px',
                  borderRadius: 999,
                  whiteSpace: 'nowrap',
                }}
              >
                Về đích · +500 XP
              </span>
            </div>

            {/* Fox V2 near Epic 3 */}
            <FoxPicture
              asset={LANDING_FOX_ASSETS.cp2}
              alt=""
              style={{ position: 'absolute', left: 'calc(50% + 50px)', top: 150, height: 140, width: 'auto', zIndex: 3 }}
            />

            {/* Quest Summary Card */}
            <div
              className={styles.lqReveal}
              style={{
                position: 'absolute',
                left: 'max(24px, calc(50% - 600px))',
                top: -90,
                width: 380,
                zIndex: 4,
                background: '#FFFFFF',
                border: '2px solid #EAE3D8',
                borderRadius: 24,
                boxShadow: '0 6px 0 #EAE3D8, 0 24px 50px rgba(22,50,74,0.08)',
                padding: '22px 24px',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 15,
                    background: '#FFF0E6',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LandingIcon name="flag" size={24} color="#F26B3A" />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#B84317', letterSpacing: '0.08em' }}>QUEST</div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: '#16324A' }}>Đạt IELTS 6.5</div>
                </div>
                <span className={styles.pillMuted}>
                  <LandingIcon name="clock" size={12} color="#4D6274" />
                  Hạn 03/2027
                </span>
              </div>

              <div style={{ margin: '16px 0 8px' }}>
                <div style={{ height: 12, borderRadius: 999, background: '#F1ECE4', overflow: 'hidden' }}>
                  <div style={{ width: '46%', height: '100%', borderRadius: 999, background: '#F26B3A' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#4D6274' }}>
                <span>2/5 Epic hoàn thành</span>
                <span style={{ color: '#B84317', fontWeight: 800 }}>46%</span>
              </div>

              <div
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: '1.5px solid #F1ECE4',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#127A68',
                  letterSpacing: '0.06em',
                }}
              >
                TASK CỦA CHẶNG “LUYỆN NGHE”
              </div>

              {CP2_QUEST_TASKS.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 0',
                    borderTop: '1.5px solid #F1ECE4',
                  }}
                >
                  {task.done ? (
                    <span className={styles.taskCheckDone}>
                      <LandingIcon name="check" size={15} color="#FFFFFF" strokeWidth={3} />
                    </span>
                  ) : (
                    <span className={styles.taskCheckTodo} />
                  )}
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 15,
                      fontWeight: 700,
                      textDecoration: task.done ? 'line-through' : 'none',
                      color: task.done ? '#4D6274' : '#16324A',
                    }}
                  >
                    {task.title}
                  </span>
                  {task.xp && <span className={styles.pillXp}>{task.xp}</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Wave Divider 2 */}
        <div aria-hidden="true" style={{ position: 'relative', height: 160, background: '#FFFFFF', margin: '-1px 0' }}>
          <svg
            viewBox="0 0 1440 160"
            preserveAspectRatio="none"
            width="100%"
            height="160"
            style={{ position: 'absolute', inset: 0, display: 'block' }}
          >
            <g>
              <path d="M0 78 C 260 38 470 108 720 70 C 980 32 1180 112 1440 62 V160 H0 Z" fill="#D5EBE3" />
              <path d="M0 98 C 260 58 470 128 720 90 C 980 52 1180 132 1440 82 V160 H0 Z" fill="#EEF7F3" />
              <path d="M0 118 C 260 78 470 148 720 110 C 980 72 1180 152 1440 102 V160 H0 Z" fill="#FFFFFF" />
              <path d="M0 0 H1440 V58 C 1180 112 980 18 720 62 C 470 104 250 28 0 74 Z" fill="#C2E2D7" />
            </g>
            <path
              className={styles.lqDash}
              d="M720 0 C 724 64 716 96 720 160"
              fill="none"
              stroke="#EBCBA9"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="2 20"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* ==================== CHẶNG 3 — FOX COMPANION ==================== */}
        <section id="cp3" className={styles.desktopCp3}>
          <svg
            viewBox="0 0 1440 1000"
            preserveAspectRatio="none"
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0, zIndex: 0 }}
            aria-hidden="true"
          >
            <path
              className={styles.lqDash}
              d="M720 0 C 720 80 1340 120 1330 500 C 1320 860 720 880 720 1000"
              fill="none"
              stroke="#EBCBA9"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="2 20"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className={styles.lqIris} style={{ position: 'relative', maxWidth: 1200, margin: '0 auto' }}>
            <DesktopCheckpointBadge step="CHẶNG 3" label="Fox đồng hành" />

            <div
              className={styles.lqReveal}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                margin: '28px 0 40px',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <h2 className={styles.sectionTitleDesktop} style={{ textAlign: 'center' }}>
                Một người bạn luôn
                <br />
                đồng hành cùng bạn.
              </h2>
              <p className={styles.sectionSubDesktop} style={{ textAlign: 'center' }}>
                Fox V2 phản ứng theo những gì bạn làm — vui khi bạn xong việc, nhắc nhẹ khi bạn chững lại, ăn mừng khi
                bạn về đích.
              </p>
            </div>

            <div className={styles.lqOutBurst}>
              <div className={styles.lqReveal} style={{ position: 'relative', height: 560 }}>
                <svg
                  viewBox="0 0 1000 560"
                  width="1000"
                  height="560"
                  style={{ position: 'absolute', left: 'calc(50% - 500px)', top: 0 }}
                  aria-hidden="true"
                >
                  <ellipse
                    className={styles.lqDash}
                    cx="500"
                    cy="300"
                    rx="440"
                    ry="230"
                    fill="none"
                    stroke="#EBCBA9"
                    strokeWidth="4"
                    strokeDasharray="2 16"
                    strokeLinecap="round"
                  />
                </svg>

                <svg
                  viewBox="0 0 520 140"
                  width="520"
                  height="140"
                  style={{ position: 'absolute', left: 'calc(50% - 260px)', top: 380 }}
                  aria-hidden="true"
                >
                  <ellipse cx="260" cy="70" rx="250" ry="60" fill="#FBE6D4" />
                  <ellipse cx="260" cy="64" rx="190" ry="40" fill="#FCF1E5" />
                </svg>

                <FoxPicture
                  asset={LANDING_FOX_ASSETS.cp3Center}
                  alt="Fox V2"
                  style={{ position: 'absolute', left: 'calc(50% - 130px)', top: 120, height: 330, width: 'auto', zIndex: 2 }}
                />

                <div
                  style={{
                    position: 'absolute',
                    left: 'calc(50% + 70px)',
                    top: 86,
                    background: '#16324A',
                    color: '#FFFFFF',
                    padding: '10px 14px',
                    borderRadius: '16px 16px 16px 4px',
                    fontSize: 14,
                    fontWeight: 700,
                    zIndex: 3,
                  }}
                  aria-hidden="true"
                >
                  Hôm nay mình đi tiếp nhé!
                </div>

                {CP3_FOX_MOODS.map((mood) => (
                  <div
                    key={mood.id}
                    className={styles.lqFloat}
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${mood.desktopLeftOffset}px)`,
                      top: mood.desktopTop,
                      width: 250,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      background: '#FFFFFF',
                      border: '2px solid #EAE3D8',
                      borderRadius: 24,
                      boxShadow: '0 6px 0 #EAE3D8, 0 20px 40px rgba(22,50,74,0.06)',
                      padding: '12px 16px 12px 12px',
                      boxSizing: 'border-box',
                      zIndex: 3,
                    }}
                  >
                    <span
                      style={{
                        flex: 'none',
                        width: 76,
                        height: 82,
                        borderRadius: 18,
                        background: mood.bgColor,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <FoxPicture asset={mood.asset} alt={mood.alt} style={{ height: 76, width: 'auto' }} />
                    </span>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: mood.accentColor }}>{mood.title}</div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.45, color: '#4D6274' }}>{mood.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Wave Divider 3 */}
        <div aria-hidden="true" style={{ position: 'relative', height: 140, background: '#F5F3EE', margin: '-1px 0' }}>
          <svg
            viewBox="0 0 1440 140"
            preserveAspectRatio="none"
            width="100%"
            height="140"
            style={{ position: 'absolute', inset: 0, display: 'block' }}
          >
            <g transform="translate(1440 0) scale(-1 1)">
              <path d="M0 78 C 260 38 470 108 720 70 C 980 32 1180 112 1440 62 V140 H0 Z" fill="#FAF8F4" />
              <path d="M0 98 C 260 58 470 128 720 90 C 980 52 1180 132 1440 82 V140 H0 Z" fill="#F5F3EE" />
              <path d="M0 0 H1440 V58 C 1180 112 980 18 720 62 C 470 104 250 28 0 74 Z" fill="#FFFFFF" />
            </g>
            <path
              className={styles.lqDash}
              d="M720 0 C 724 56 716 84 720 140"
              fill="none"
              stroke="#EBCBA9"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="2 20"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* ==================== CHẶNG 4 — FRIENDS & MOMENTS ==================== */}
        <section id="cp4" className={styles.desktopCp4}>
          <svg
            viewBox="0 0 1440 1000"
            preserveAspectRatio="none"
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0, zIndex: 0 }}
            aria-hidden="true"
          >
            <path
              className={styles.lqDash}
              d="M720 0 C 720 100 80 160 70 520 C 60 860 720 870 720 1000"
              fill="none"
              stroke="#EBCBA9"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="2 20"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto' }}>
            <DesktopCheckpointBadge step="CHẶNG 4" label="Bạn bè & Moments" />

            <div
              className={styles.lqReveal}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 64,
                marginTop: 60,
                position: 'relative',
                zIndex: 2,
              }}
            >
              {/* Left Polaroid Collage */}
              <div style={{ position: 'relative', flex: '0 0 580px', height: 560 }}>
                {/* Card 1 */}
                <div
                  className={styles.lqFly}
                  style={
                    {
                      '--dx': '-220px',
                      '--dy': '-260px',
                      position: 'absolute',
                      left: 0,
                      top: 40,
                      width: 230,
                      transform: 'rotate(-6deg)',
                      background: '#FFFFFF',
                      border: '2px solid #EAE3D8',
                      borderRadius: 20,
                      padding: '10px 10px 14px',
                      boxShadow: '0 6px 0 #EAE3D8, 0 24px 40px rgba(22,50,74,0.08)',
                      boxSizing: 'border-box',
                      zIndex: 2,
                    } as CSSProperties
                  }
                  aria-hidden="true"
                >
                  <div
                    style={{
                      position: 'relative',
                      height: 170,
                      borderRadius: 14,
                      background: 'linear-gradient(160deg, #DFF2EC, #F6E7D6)',
                      overflow: 'hidden',
                    }}
                  >
                    <svg viewBox="0 0 230 170" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                      <path d="M0 170 L70 70 L110 120 L160 50 L230 170 Z" fill="#B8DDD2" />
                      <circle cx="180" cy="38" r="16" fill="#F6C85F" />
                    </svg>
                    <span style={{ position: 'absolute', top: 8, left: 8 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: 'rgba(255,255,255,0.92)',
                          color: '#16324A',
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        <LandingIcon name="lock" size={12} color="#16324A" />
                        Chỉ bạn bè
                      </span>
                    </span>
                  </div>
                  <div style={{ padding: '10px 4px 0' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#16324A' }}>Leo núi Bà Đen</div>
                    <div style={{ fontSize: 12.5, color: '#4D6274' }}>Minh Anh · chặng “Thể lực”</div>
                  </div>
                </div>

                {/* Card 2 */}
                <div
                  className={styles.lqFly}
                  style={
                    {
                      '--dx': '120px',
                      '--dy': '-320px',
                      position: 'absolute',
                      left: 220,
                      top: 0,
                      width: 230,
                      transform: 'rotate(4deg)',
                      background: '#FFFFFF',
                      border: '2px solid #EAE3D8',
                      borderRadius: 20,
                      padding: '10px 10px 14px',
                      boxShadow: '0 6px 0 #EAE3D8, 0 24px 40px rgba(22,50,74,0.08)',
                      boxSizing: 'border-box',
                      zIndex: 2,
                    } as CSSProperties
                  }
                  aria-hidden="true"
                >
                  <div
                    style={{
                      position: 'relative',
                      height: 170,
                      borderRadius: 14,
                      background: 'linear-gradient(160deg, #E8F1FF, #F6E7D6)',
                      overflow: 'hidden',
                    }}
                  >
                    <svg viewBox="0 0 230 170" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                      <rect x="60" y="60" width="110" height="70" rx="8" fill="#FFFFFF" />
                      <path d="M115 60 V130" stroke="#E2CFB6" strokeWidth="3" />
                      <rect x="74" y="74" width="30" height="5" rx="2.5" fill="#E2CFB6" />
                      <rect x="74" y="86" width="26" height="5" rx="2.5" fill="#E2CFB6" />
                    </svg>
                    <span style={{ position: 'absolute', top: 8, left: 8 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: 'rgba(255,255,255,0.92)',
                          color: '#16324A',
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        <LandingIcon name="lock" size={12} color="#16324A" />
                        Chỉ bạn bè
                      </span>
                    </span>
                  </div>
                  <div style={{ padding: '10px 4px 0' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#16324A' }}>Xong chương 4</div>
                    <div style={{ fontSize: 12.5, color: '#4D6274' }}>Gia Huy · Quest “Đọc 12 cuốn”</div>
                  </div>
                </div>

                {/* Card 3 */}
                <div
                  className={styles.lqFly}
                  style={
                    {
                      '--dx': '-60px',
                      '--dy': '-200px',
                      position: 'absolute',
                      left: 120,
                      top: 260,
                      width: 230,
                      transform: 'rotate(-2deg)',
                      background: '#FFFFFF',
                      border: '2px solid #EAE3D8',
                      borderRadius: 20,
                      padding: '10px 10px 14px',
                      boxShadow: '0 6px 0 #EAE3D8, 0 24px 40px rgba(22,50,74,0.08)',
                      boxSizing: 'border-box',
                      zIndex: 2,
                    } as CSSProperties
                  }
                  aria-hidden="true"
                >
                  <div
                    style={{
                      position: 'relative',
                      height: 170,
                      borderRadius: 14,
                      background: 'linear-gradient(160deg, #FFE9D6, #FCF1E5)',
                      overflow: 'hidden',
                    }}
                  >
                    <svg viewBox="0 0 230 170" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                      <path d="M0 130 C 60 110 160 150 230 120 V170 H0Z" fill="#F6D3B4" />
                      <circle cx="60" cy="50" r="22" fill="#FFFFFF" opacity="0.8" />
                    </svg>
                    <span style={{ position: 'absolute', top: 8, left: 8 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: 'rgba(255,255,255,0.92)',
                          color: '#16324A',
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        <LandingIcon name="lock" size={12} color="#16324A" />
                        Chỉ bạn bè
                      </span>
                    </span>
                  </div>
                  <div style={{ padding: '10px 4px 0' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#16324A' }}>5km đầu tiên!</div>
                    <div style={{ fontSize: 12.5, color: '#4D6274' }}>Thu Hà · Streak 12 ngày</div>
                  </div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    left: 380,
                    top: 300,
                    background: '#168C78',
                    color: '#FFFFFF',
                    borderRadius: '18px 18px 18px 4px',
                    padding: '12px 16px',
                    fontSize: 14,
                    fontWeight: 700,
                    boxShadow: '0 4px 0 #0F6B5B',
                    zIndex: 3,
                    maxWidth: 190,
                  }}
                  aria-hidden="true"
                >
                  Mai chạy cùng nhau nhé!
                </div>

                <FoxPicture
                  asset={LANDING_FOX_ASSETS.cp4}
                  alt=""
                  style={{ position: 'absolute', left: 420, top: 380, height: 150, width: 'auto', zIndex: 3 }}
                />
              </div>

              {/* Right Column */}
              <div style={{ flex: '1 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <h2 className={styles.sectionTitleDesktop}>
                  Đi xa hơn khi có
                  <br />
                  bạn bè đồng hành.
                </h2>
                <p style={{ margin: 0, maxWidth: 480, fontSize: 18, lineHeight: 1.6, color: '#4D6274' }}>
                  Một vòng tròn nhỏ, không bảng tin công khai. Nhóm tính năng này đang được hoàn thiện và sẽ mở dần.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={styles.pillNeutral}>Sắp ra mắt</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#4D6274' }}>
                    Áp dụng cho cả 5 tính năng bên dưới
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  {CP4_SOCIAL_FEATURES.map((feat) => (
                    <div
                      key={feat.id}
                      style={{
                        background: '#FFFFFF',
                        border: '2px solid #EAE3D8',
                        borderRadius: 18,
                        boxShadow: '0 4px 0 #EAE3D8',
                        padding: '14px 16px',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                      }}
                    >
                      <span
                        style={{
                          flex: 'none',
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          background: '#E3F3EF',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <LandingIcon name={feat.icon} size={18} color="#127A68" strokeWidth={2.4} />
                      </span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#16324A' }}>{feat.title}</div>
                        <div style={{ fontSize: 13, color: '#4D6274' }}>{feat.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== SUNSET TRANSITION ==================== */}
        <div
          aria-hidden="true"
          style={{
            position: 'relative',
            height: 320,
            background:
              'linear-gradient(#F5F3EE 0%, #F9E3CF 30%, #E7B79F 55%, #8E6E72 78%, #2B4A63 94%, #16324A 100%)',
            overflow: 'hidden',
          }}
        >
          <svg
            viewBox="0 0 1440 320"
            preserveAspectRatio="xMidYMid slice"
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0 }}
          >
            <circle className={styles.lqRise2} cx="360" cy="230" r="70" fill="#FBD3A8" opacity="0.85" />
            <path d="M980 120 q 8 -8 16 0 q 8 -8 16 0" fill="none" stroke="#7A6A6A" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            <path d="M1030 150 q 8 -8 16 0 q 8 -8 16 0" fill="none" stroke="#7A6A6A" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            <path d="M1010 95 q 8 -8 16 0 q 8 -8 16 0" fill="none" stroke="#7A6A6A" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            <path
              d="M720 0 C 720 120 760 200 720 320"
              fill="none"
              stroke="#EBCBA9"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="2 20"
              className={styles.lqDash}
              opacity="0.8"
            />
          </svg>
          <span
            style={{
              position: 'absolute',
              left: '50%',
              top: '46%',
              translate: '-50% 0',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            HOÀNG HÔN · CHẶNG CUỐI
          </span>
        </div>

        {/* ==================== FINAL CTA ==================== */}
        <section id="finale" style={{ position: 'relative', height: 640, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          <svg
            viewBox="0 0 1440 640"
            preserveAspectRatio="xMidYMax slice"
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0 }}
            aria-hidden="true"
          >
            <rect width="1440" height="640" fill="#16324A" />
            <g className={styles.lqStars}>
              {FINALE_STARS.map((star, idx) => (
                <circle
                  key={idx}
                  className={styles.lqTwinkle}
                  style={{ animationDelay: `${star.delay}s` }}
                  cx={star.cx}
                  cy={star.cy}
                  r={star.size}
                  fill="#FFFFFF"
                  opacity={star.opacity}
                />
              ))}
            </g>
            <circle className={styles.lqRise2} cx="1300" cy="150" r="44" fill="#FBE1BE" opacity="0.9" />
          </svg>

          <svg
            className={styles.lqRise}
            viewBox="0 0 1440 640"
            preserveAspectRatio="xMidYMax slice"
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0 }}
            aria-hidden="true"
          >
            <path d="M0 470 L 220 380 L 420 440 L 640 350 L 820 420 L 1060 240 L 1260 400 L 1440 330 V640 H0Z" fill="#2E5068" />
            <path d="M1060 240 L 1100 290 L 1060 280 L 1026 290 Z" fill="#E8EEF2" opacity="0.8" />
            <g transform="translate(1060 242) scale(0.9)">
              <path d="M0 0 V -64" stroke="#16324A" strokeWidth="5" strokeLinecap="round" />
              <path d="M2 -62 h 36 l -9 12 9 12 h -36 z" fill="#F6C85F" />
            </g>
          </svg>

          <svg
            className={styles.lqRise2}
            viewBox="0 0 1440 640"
            preserveAspectRatio="xMidYMax slice"
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0 }}
            aria-hidden="true"
          >
            <path d="M0 560 C 300 500 520 520 760 530 C 1000 540 1200 500 1440 520 V640 H0Z" fill="#1B3850" />
          </svg>

          <div className={styles.lqRise} style={{ position: 'absolute', left: 'calc(50% + 300px)', bottom: 40, zIndex: 2 }}>
            <FoxPicture
              asset={LANDING_FOX_ASSETS.ctaSummit}
              alt="Fox V2 trên đỉnh hành trình"
              style={{ height: 270, width: 'auto', display: 'block' }}
            />
          </div>

          <div
            className={styles.lqReveal}
            style={{
              position: 'relative',
              zIndex: 3,
              width: '100%',
              boxSizing: 'border-box',
              maxWidth: 1200,
              margin: '0 auto',
              padding: '0 48px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 26,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 52, lineHeight: 1.12, fontWeight: 800, letterSpacing: '-0.035em', color: '#FFFFFF' }}>
              Sẵn sàng bắt đầu hành trình
              <br />
              của riêng bạn?
            </h2>
            <p style={{ margin: 0, fontSize: 19, color: '#D5DEE6', maxWidth: 480, lineHeight: 1.6 }}>
              Chặng đầu tiên chỉ mất một phút: tạo tài khoản, chọn một mục tiêu, và Fox sẽ dẫn đường.
            </p>
            <Link to="/register" className={`${styles.lqCta} ${styles.primaryCtaDesktop}`}>
              Bắt đầu cùng Fox
            </Link>
          </div>
        </section>

        {/* ==================== CAMPFIRE FOOTER ==================== */}
        <footer style={{ position: 'relative', background: 'linear-gradient(#1B3850, #132A3E)', overflow: 'hidden' }}>
          {FOOTER_STARS.map((star, idx) => (
            <span
              key={idx}
              className={styles.lqTwinkle}
              aria-hidden="true"
              style={{
                animationDelay: `${star.delay}s`,
                position: 'absolute',
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                borderRadius: '50%',
                background: '#FFFFFF',
                opacity: star.opacity,
              }}
            />
          ))}

          {DESKTOP_FIREFLIES.map((ff, idx) => (
            <span
              key={idx}
              className={styles.lqFirefly}
              aria-hidden="true"
              style={
                {
                  '--fx': `${ff.fx}px`,
                  '--fy': `${ff.fy}px`,
                  '--fd': `${ff.duration}s`,
                  animationDelay: `${ff.delay}s`,
                  position: 'absolute',
                  left: ff.left,
                  top: ff.top,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#FFE58A',
                  boxShadow: '0 0 10px 3px rgba(255,229,138,0.55)',
                } as CSSProperties
              }
            />
          ))}

          <svg
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
            width="100%"
            height="200"
            style={{ position: 'absolute', left: 0, bottom: 0, display: 'block' }}
            aria-hidden="true"
          >
            <path d="M0 90 C 260 60 520 100 760 84 C 1000 68 1220 96 1440 80 V200 H0Z" fill="#163046" />
            <path d="M0 140 C 300 120 640 150 900 136 C 1120 124 1300 142 1440 134 V200 H0Z" fill="#11273A" />
          </svg>

          <div
            style={{
              position: 'relative',
              zIndex: 2,
              maxWidth: 1200,
              margin: '0 auto',
              padding: '56px 48px 40px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 40,
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 700px', minWidth: 0, height: 300 }}>
              {/* Night Tent */}
              <div style={{ position: 'absolute', left: 'calc(50% + 60px)', bottom: 64 }}>
                <svg viewBox="0 0 160 120" width="160" height="120" aria-hidden="true" style={{ display: 'block' }}>
                  <path d="M8 116 L80 10 L152 116 Z" fill="#C9572E" />
                  <path d="M8 116 L80 10 L54 116 Z" fill="#A9461F" />
                  <path d="M66 116 L80 62 L94 116 Z" fill="#FFCF8A" opacity="0.9" />
                  <path d="M80 10 V0" stroke="#0F2233" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>

              {/* Campfire */}
              <div style={{ position: 'absolute', left: 'calc(50% - 40px)', bottom: 34 }}>
                <CampfireSvg gradientId="lqFireGlowDesktop" width={200} height={160} />
              </div>

              {/* Sleeping Fox */}
              <div style={{ position: 'absolute', left: 'calc(50% - 250px)', bottom: 40 }}>
                <FoxPicture
                  asset={LANDING_FOX_ASSETS.footerCamp}
                  alt="Fox V2 ngủ bên lửa trại"
                  style={{ height: 150, width: 'auto', display: 'block' }}
                />
                <div style={{ position: 'absolute', left: 70, top: -10, width: 60, height: 30 }}>
                  <span className={styles.lqZzz} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, fontSize: 16, fontWeight: 800, color: '#C9D5E0', animationDelay: '0s' }}>
                    z
                  </span>
                  <span className={styles.lqZzz} aria-hidden="true" style={{ position: 'absolute', left: 10, top: 0, fontSize: 20, fontWeight: 800, color: '#C9D5E0', animationDelay: '1.2s' }}>
                    z
                  </span>
                  <span className={styles.lqZzz} aria-hidden="true" style={{ position: 'absolute', left: 22, top: 0, fontSize: 26, fontWeight: 800, color: '#C9D5E0', animationDelay: '2.4s' }}>
                    z
                  </span>
                </div>
              </div>
            </div>

            {/* Wooden Signpost Navigation */}
            <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 20 }}>
              <nav aria-label="Liên kết chân trang" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '8px 0 0' }}>
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: -14,
                    bottom: -40,
                    width: 14,
                    translate: '-50% 0',
                    borderRadius: 6,
                    background: '#5E432C',
                  }}
                />
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
                  <Link to="/login" className={`${styles.lqSign} ${styles.signPostLinkRight}`} style={{ width: 200, rotate: '-3deg' }}>
                    Đăng nhập
                  </Link>
                  <Link to="/register" className={`${styles.lqSign} ${styles.signPostLinkLeft}`} style={{ width: 200, rotate: '2deg' }}>
                    Đăng ký
                  </Link>
                  <button
                    type="button"
                    className={`${styles.lqSign} ${styles.signPostLinkRight}`}
                    style={{ width: 200, rotate: '-2deg' }}
                    onClick={() => onOpenLegal('privacy')}
                  >
                    Quyền riêng tư
                  </button>
                  <button
                    type="button"
                    className={`${styles.lqSign} ${styles.signPostLinkLeft}`}
                    style={{ width: 200, rotate: '3deg' }}
                    onClick={() => onOpenLegal('terms')}
                  >
                    Điều khoản
                  </button>
                </div>
              </nav>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              zIndex: 2,
              maxWidth: 1200,
              margin: '0 auto',
              padding: '0 48px 26px',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              fontSize: 13,
              fontWeight: 700,
              color: '#8EA3B7',
            }}
          >
            <span>© 2026 LifeQuest · Mỗi ngày đều là một cuộc phiêu lưu.</span>
            <a
              href="#top"
              style={{ color: '#C9D5E0', textDecoration: 'none' }}
              onClick={(e) => {
                e.preventDefault()
                onScrollTop()
              }}
            >
              Về đầu hành trình ↑
            </a>
          </div>
        </footer>

        {/* ==================== DESKTOP SCROLL-PROGRESS RAIL ==================== */}
        <div
          style={{
            position: 'absolute',
            top: 900,
            bottom: 1500,
            right: 20,
            width: 56,
            zIndex: 30,
            pointerEvents: 'none',
          }}
        >
          <nav
            className={styles.lqRail}
            aria-label="Tiến trình hành trình"
            style={{ position: 'sticky', top: 'calc(50vh - 150px)', height: 300, pointerEvents: 'auto' }}
          >
            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 18,
                  bottom: 18,
                  width: 4,
                  borderRadius: 2,
                  background: '#EADFCF',
                }}
                aria-hidden="true"
              >
                <span className={styles.lqRailFill} style={{ position: 'absolute', inset: 0, borderRadius: 2, background: '#F26B3A' }} />
              </span>

              {[
                { href: '#cp1', label: 'Chặng 1: Hôm nay', title: 'Hôm nay', icon: 'check' as const, dotClass: styles.lqDot1 },
                { href: '#cp2', label: 'Chặng 2: Quest', title: 'Quest', icon: 'flag' as const, dotClass: styles.lqDot2 },
                { href: '#cp3', label: 'Chặng 3: Fox', title: 'Fox', icon: 'heart' as const, dotClass: styles.lqDot3 },
                { href: '#cp4', label: 'Chặng 4: Bạn bè', title: 'Bạn bè', icon: 'users' as const, dotClass: styles.lqDot4 },
              ].map((dot) => (
                <a
                  key={dot.href}
                  href={dot.href}
                  aria-label={dot.label}
                  title={dot.title}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 10,
                    textDecoration: 'none',
                    zIndex: 1,
                  }}
                >
                  <span
                    className={`${styles.lqDot} ${dot.dotClass}`}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      color: '#9A8F80',
                      boxShadow: '0 3px 0 #E6D8C9',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #EAE3D8',
                    }}
                  >
                    <LandingIcon name={dot.icon} size={16} color="currentColor" />
                  </span>
                </a>
              ))}

              <span
                className={styles.lqRailFox}
                style={{
                  position: 'absolute',
                  right: -2,
                  top: -4,
                  width: 40,
                  height: 44,
                  zIndex: 2,
                  display: 'flex',
                  justifyContent: 'center',
                }}
                aria-hidden="true"
              >
                <img
                  src={LANDING_FOX_ASSETS.railFox}
                  alt=""
                  style={{ height: 44, width: 'auto', filter: 'drop-shadow(0 3px 4px rgba(22,50,74,0.25))' }}
                />
              </span>
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
}
