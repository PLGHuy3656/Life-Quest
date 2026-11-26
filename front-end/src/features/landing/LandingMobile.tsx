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
  CP3_FOX_MOODS,
  CP4_SOCIAL_FEATURES,
  LANDING_COPY,
  MOBILE_FIREFLIES,
  type HabitDayStatus,
} from './landingData'
import type { LegalTopic } from './LandingLegalNotice'
import {
  BrandLogo,
  CampfireSvg,
  FoxPicture,
  LandingIcon,
  MobileCheckpointHeader,
  TreeGroup,
} from './LandingPrimitives'
import styles from './LandingPage.module.css'

interface LandingMobileProps {
  onOpenLegal: (topic: Exclude<LegalTopic, null>) => void
  onScrollTop: () => void
}

function getMobileHabitDotStyle(status: HabitDayStatus): CSSProperties {
  const base: CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: '50%',
    display: 'block',
    boxSizing: 'border-box',
  }
  if (status === 'done') return { ...base, background: '#2C9B63' }
  if (status === 'today') return { ...base, background: '#FFFFFF', border: '2px solid #F26B2E' }
  if (status === 'future') return { ...base, background: 'transparent', border: '1.5px dashed #D6D2C9' }
  return { ...base, background: '#EFECE6' }
}

export function LandingMobile({ onOpenLegal, onScrollTop }: LandingMobileProps) {
  return (
    <div className={styles.vMobile} data-testid="landing-mobile">
      <div className={styles.mobileContainer}>
        <div className={styles.lqPage}>
          {/* ==================== MOBILE HERO ==================== */}
          <section className={styles.mobileHero}>
            <header className={styles.mobileHeader}>
              <BrandLogo size="mobile" />
              <Link to="/login" className={styles.mobileLoginBtn} data-testid="landing-mobile-login-btn">
                {LANDING_COPY.headerLoginCta}
              </Link>
            </header>

            <div
              className={styles.lqHxText}
              style={{
                position: 'relative',
                zIndex: 3,
                padding: '28px 20px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
                textAlign: 'center',
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: 38,
                  lineHeight: 1.08,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: '#16324A',
                }}
              >
                {LANDING_COPY.heroHeadlineLine1} {LANDING_COPY.heroHeadlineLine2Prefix}
                <span className={styles.accentOrange} style={{ whiteSpace: 'nowrap' }}>
                  {LANDING_COPY.heroHeadlineAccent}
                </span>
              </h1>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: '#4D6274' }}>
                {LANDING_COPY.heroSubtitle}
              </p>
              <div
                style={{
                  width: '100%',
                  marginTop: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <Link
                  to="/register"
                  className={`${styles.lqCta} ${styles.primaryCtaMobile}`}
                  data-testid="landing-mobile-start-btn"
                >
                  {LANDING_COPY.heroPrimaryCta}
                </Link>
                <Link to="/login" className={styles.secondaryLoginLink}>
                  {LANDING_COPY.heroSecondaryPrefix}
                  <span className={styles.secondaryLoginAccent}>{LANDING_COPY.heroSecondaryCta}</span>
                </Link>
              </div>
            </div>

            <svg
              viewBox="0 0 390 300"
              preserveAspectRatio="xMidYMax slice"
              width="100%"
              height="300"
              style={{ position: 'absolute', left: 0, bottom: 0 }}
              aria-hidden="true"
            >
              <path d="M0 90 C 80 60 160 70 230 82 C 300 94 350 70 390 76 V300 H0Z" fill="#D9EDE5" />
              <path d="M0 150 C 90 130 200 140 390 132 V300 H0Z" fill="#C2E2D7" />
              <path d="M0 200 C 120 190 260 196 390 192 V300 H0Z" fill="#F3E5CF" />
              <TreeGroup x={40} y={150} scale={0.6} />
              <TreeGroup x={350} y={140} scale={0.7} />
              <g transform="translate(320 196) scale(0.45)">
                <path d="M-60 0 L0 -84 L60 0 Z" fill="#F26B3A" />
                <path d="M-60 0 L0 -84 L-22 0 Z" fill="#E0582A" />
                <path d="M-14 0 L0 -40 L14 0 Z" fill="#FCEBD8" />
                <path d="M0 -84 L0 -98" stroke="#16324A" strokeWidth="4" strokeLinecap="round" />
              </g>
              <path
                d="M120 300 C 140 250 230 250 230 210 C 230 170 180 160 220 130 C 240 115 270 110 300 100 L306 102 C 280 114 252 122 240 136 C 220 160 260 176 260 212 C 260 260 200 270 250 300 Z"
                fill="#FDEEDD"
                stroke="#EBCBA9"
                strokeWidth="2"
              />
              <g transform="translate(302 102) scale(0.5)">
                <path d="M0 0 V -64" stroke="#16324A" strokeWidth="5" strokeLinecap="round" />
                <path d="M2 -62 h 36 l -9 12 9 12 h -36 z" fill="#F26B3A" />
              </g>
            </svg>

            <div className={styles.lqHxFox} style={{ position: 'absolute', left: 70, bottom: 14, zIndex: 2 }}>
              <FoxPicture
                asset={LANDING_FOX_ASSETS.hero}
                alt="Fox V2 trên con đường hành trình"
                style={{ height: 230, width: 'auto', display: 'block' }}
                loading="eager"
              />
            </div>

            <div
              className={styles.lqFloat}
              style={{
                position: 'absolute',
                right: 16,
                bottom: 230,
                zIndex: 3,
                background: '#FFFFFF',
                border: '2px solid #EAE3D8',
                borderRadius: 14,
                boxShadow: '0 4px 0 #EAE3D8',
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 800,
                color: '#B84317',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              aria-hidden="true"
            >
              <LandingIcon name="flame" size={16} color="#F26B3A" />
              Streak 5 ngày
            </div>

            <svg
              viewBox="0 0 390 40"
              preserveAspectRatio="none"
              width="100%"
              height="40"
              style={{ position: 'absolute', left: 0, bottom: 0, display: 'block', zIndex: 1 }}
              aria-hidden="true"
            >
              <path d="M0 40 V22 C 90 4 180 34 270 16 C 320 6 360 14 390 10 V40 Z" fill="#F5F3EE" />
            </svg>
          </section>

          {/* ==================== STICKY MOBILE PROGRESS BAR ==================== */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 40,
              background: 'rgba(245,243,238,0.94)',
              borderBottom: '2px solid #EAE3D8',
              padding: '10px 20px 12px',
            }}
            aria-hidden="true"
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                fontWeight: 800,
                color: '#4D6274',
                marginBottom: 8,
                paddingRight: 4,
              }}
            >
              <span>Hôm nay</span>
              <span>Quest</span>
              <span>Fox</span>
              <span>Bạn bè</span>
              <span>Đích</span>
            </div>
            <div style={{ position: 'relative', height: 8, borderRadius: 999, background: '#EADFCF' }}>
              <span className={styles.lqMbarFill} style={{ position: 'absolute', inset: 0, borderRadius: 999, background: '#F26B3A' }} />
              {[20, 42, 64, 86].map((pct) => (
                <span
                  key={pct}
                  style={{
                    position: 'absolute',
                    left: `${pct}%`,
                    top: '50%',
                    translate: '-50% -50%',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '3px solid #F26B3A',
                    boxSizing: 'border-box',
                  }}
                />
              ))}
              <span
                className={styles.lqMbarFox}
                style={{
                  position: 'absolute',
                  left: -6,
                  top: -26,
                  width: 32,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <img src={LANDING_FOX_ASSETS.railFox} alt="" style={{ height: 34, width: 'auto' }} />
              </span>
            </div>
          </div>

          {/* ==================== MOBILE CHẶNG 1 ==================== */}
          <section style={{ position: 'relative', background: '#F5F3EE', padding: '48px 20px 56px' }}>
            <span style={{ position: 'absolute', left: 39, top: 0, bottom: 0, borderLeft: '4px dotted #EBCBA9' }} aria-hidden="true" />
            <div className={styles.lqReveal} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <MobileCheckpointHeader step="CHẶNG 1" label="Việc mỗi ngày" />
              <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.035em', color: '#16324A' }}>
                Việc nhỏ mỗi ngày, thay đổi lớn mai sau.
              </h2>
              <div style={{ height: 64 }} />

              <div
                style={{
                  background: '#FFFFFF',
                  border: '2px solid #EAE3D8',
                  borderRadius: 22,
                  boxShadow: '0 6px 0 #EAE3D8',
                  padding: '16px 16px 10px',
                  position: 'relative',
                }}
              >
                <FoxPicture
                  asset={LANDING_FOX_ASSETS.cp1}
                  alt=""
                  style={{ position: 'absolute', right: -6, top: -78, height: 96, width: 'auto' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <strong style={{ fontSize: 18, color: '#16324A' }}>Hôm nay</strong>
                  <span className={styles.pillSuccess} style={{ fontSize: 11 }}>
                    2/3 xong
                  </span>
                </div>
                {CP1_TASKS.slice(0, 3).map((task) => (
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
                      {task.mobileTitle ?? task.title}
                    </span>
                    {task.mobileXp && <span className={styles.pillXp}>{task.mobileXp}</span>}
                  </div>
                ))}
              </div>

              <div
                style={{
                  background: '#FFFFFF',
                  border: '2px solid #EAE3D8',
                  borderRadius: 22,
                  boxShadow: '0 6px 0 #EAE3D8',
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: 16, color: '#16324A' }}>Uống đủ 2 lít nước</strong>
                  <span className={styles.pillNeutral}>Bản xem trước</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                  {CP1_HABITS[0].days.map((status, idx) => (
                    <span
                      key={CP1_HABIT_DAYS[idx]}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}
                    >
                      <span style={getMobileHabitDotStyle(status)} />
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: idx === CP1_TODAY_INDEX ? '#D9511F' : '#8B99A8',
                        }}
                      >
                        {CP1_HABIT_DAYS[idx]}
                      </span>
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 800, color: '#D9511F', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <PawPrint size={14} color="#F26B2E" aria-hidden="true" />
                  Chuỗi 5 ngày liên tiếp
                </div>
              </div>
            </div>
          </section>

          {/* ==================== MOBILE CHẶNG 2 ==================== */}
          <section style={{ position: 'relative', background: '#F5F3EE', padding: '48px 20px 56px' }}>
            <span style={{ position: 'absolute', left: 39, top: 0, bottom: 0, borderLeft: '4px dotted #EBCBA9' }} aria-hidden="true" />
            <div className={styles.lqReveal} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <MobileCheckpointHeader step="CHẶNG 2" label="Quest & Epic" />
              <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.035em', color: '#16324A' }}>
                Mọi mục tiêu lớn đều bắt đầu từ một chặng nhỏ.
              </h2>

              <div
                style={{
                  background: '#FFFFFF',
                  border: '2px solid #EAE3D8',
                  borderRadius: 22,
                  boxShadow: '0 6px 0 #EAE3D8',
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: '#B84317', letterSpacing: '0.08em' }}>QUEST</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#16324A', margin: '2px 0 10px' }}>Đạt IELTS 6.5</div>
                <div style={{ height: 10, borderRadius: 999, background: '#F1ECE4', overflow: 'hidden' }}>
                  <div style={{ width: '46%', height: '100%', borderRadius: 999, background: '#F26B3A' }} />
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#4D6274', marginTop: 8 }}>2/5 Epic · 46%</div>
              </div>

              <div style={{ background: '#E9F4EF', borderRadius: 22, padding: '10px 16px' }} aria-hidden="true">
                {CP2_EPICS.map((epic) => {
                  const isDone = epic.status === 'done'
                  const isActive = epic.status === 'active'
                  const nodeBg = isDone ? '#168C78' : isActive ? '#F26B3A' : '#FFFFFF'
                  const nodeShadow = isDone
                    ? '0 4px 0 #0F6B5B'
                    : isActive
                      ? '0 4px 0 #C84B1D, 0 0 0 7px rgba(242,107,58,0.18)'
                      : '0 4px 0 #D8CDBD'
                  return (
                    <div key={epic.id} style={{ display: 'flex', alignItems: 'center', gap: 14, height: 76 }}>
                      <span
                        style={{
                          flex: 'none',
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          background: nodeBg,
                          boxShadow: nodeShadow,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isDone && <LandingIcon name="check" size={22} color="#FFFFFF" strokeWidth={3.2} />}
                        {isActive && <LandingIcon name="star" size={20} color="#FFFFFF" />}
                        {epic.status === 'locked' && <LandingIcon name="lock" size={18} color="#9A8F80" strokeWidth={2.4} />}
                      </span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', color: '#4D6274' }}>{epic.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: epic.status === 'locked' ? '#4D6274' : '#16324A' }}>
                          {epic.title}
                        </div>
                      </div>
                      {isActive && (
                        <span style={{ marginLeft: 'auto' }}>
                          <FoxPicture asset={LANDING_FOX_ASSETS.cp2} alt="" style={{ height: 78, width: 'auto' }} />
                        </span>
                      )}
                    </div>
                  )
                })}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 56 }}>
                  <span style={{ width: 52, display: 'flex', justifyContent: 'center' }}>
                    <LandingIcon name="flag" size={26} color="#7A5400" />
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#7A5400',
                      background: '#FDF3D7',
                      padding: '5px 12px',
                      borderRadius: 999,
                    }}
                  >
                    Về đích
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Mobile Wave 1 */}
          <div aria-hidden="true" style={{ height: 60, background: '#FFFFFF', margin: '-1px 0' }}>
            <svg viewBox="0 0 390 60" preserveAspectRatio="none" width="100%" height="60" style={{ display: 'block' }}>
              <path d="M0 0 H390 V27 C 300 57 200 6 100 33 C 60 45 30 36 0 42 Z" fill="#F5F3EE" />
            </svg>
          </div>

          {/* ==================== MOBILE CHẶNG 3 ==================== */}
          <section style={{ position: 'relative', background: '#FFFFFF', padding: '24px 20px 40px' }}>
            <span style={{ position: 'absolute', left: 39, top: 0, bottom: 0, borderLeft: '4px dotted #EBCBA9' }} aria-hidden="true" />
            <div className={styles.lqReveal} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <MobileCheckpointHeader step="CHẶNG 3" label="Fox đồng hành" />
              <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.035em', color: '#16324A' }}>
                Một người bạn luôn đồng hành cùng bạn.
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                {CP3_FOX_MOODS.map((mood) => (
                  <div
                    key={mood.id}
                    style={{
                      background: '#FFFFFF',
                      border: '2px solid #EAE3D8',
                      borderRadius: 20,
                      boxShadow: '0 4px 0 #EAE3D8',
                      padding: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      textAlign: 'center',
                    }}
                  >
                    <span
                      style={{
                        width: '100%',
                        height: 96,
                        borderRadius: 14,
                        background: mood.bgColor,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                      }}
                    >
                      <FoxPicture asset={mood.asset} alt={mood.alt} style={{ height: 88, width: 'auto' }} />
                    </span>
                    <strong style={{ fontSize: 15, color: mood.accentColor }}>{mood.title}</strong>
                    <span style={{ fontSize: 12.5, color: '#4D6274' }}>{mood.mobileDescription}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Mobile Wave 2 */}
          <div aria-hidden="true" style={{ height: 60, background: '#F5F3EE', margin: '-1px 0' }}>
            <svg viewBox="0 0 390 60" preserveAspectRatio="none" width="100%" height="60" style={{ display: 'block' }}>
              <path d="M0 0 H390 V27 C 300 57 200 6 100 33 C 60 45 30 36 0 42 Z" fill="#FFFFFF" />
            </svg>
          </div>

          {/* ==================== MOBILE CHẶNG 4 ==================== */}
          <section style={{ position: 'relative', background: '#F5F3EE', padding: '48px 20px 56px' }}>
            <span style={{ position: 'absolute', left: 39, top: 0, bottom: 0, borderLeft: '4px dotted #EBCBA9' }} aria-hidden="true" />
            <div className={styles.lqReveal} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <MobileCheckpointHeader step="CHẶNG 4" label="Bạn bè & Moments" />
              <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.035em', color: '#16324A' }}>
                Đi xa hơn khi có bạn bè đồng hành.
              </h2>

              <div style={{ position: 'relative', height: 250 }} aria-hidden="true">
                <div
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: 10,
                    width: 180,
                    transform: 'rotate(-5deg)',
                    background: '#FFFFFF',
                    border: '2px solid #EAE3D8',
                    borderRadius: 18,
                    padding: '8px 8px 12px',
                    boxShadow: '0 5px 0 #EAE3D8',
                  }}
                >
                  <div style={{ height: 130, borderRadius: 12, background: 'linear-gradient(160deg, #DFF2EC, #F6E7D6)' }} />
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#16324A', padding: '8px 2px 0' }}>Leo núi Bà Đen</div>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    left: 170,
                    top: 120,
                    background: '#168C78',
                    color: '#FFFFFF',
                    borderRadius: '16px 16px 16px 4px',
                    padding: '10px 14px',
                    fontSize: 13,
                    fontWeight: 700,
                    boxShadow: '0 4px 0 #0F6B5B',
                  }}
                >
                  Mai chạy cùng nhé!
                </div>
                <FoxPicture
                  asset={LANDING_FOX_ASSETS.cp4}
                  alt=""
                  style={{ position: 'absolute', right: 0, top: 0, height: 110, width: 'auto' }}
                />
              </div>

              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: '#4D6274' }}>
                Vòng tròn nhỏ, không bảng tin công khai. Đang hoàn thiện và sẽ mở dần.
              </p>

              <div>
                {CP4_SOCIAL_FEATURES.map((feat) => (
                  <div
                    key={feat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 0',
                      borderTop: '1.5px solid #EDE6DB',
                    }}
                  >
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 11,
                        background: '#E3F3EF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <LandingIcon name={feat.icon} size={17} color="#127A68" strokeWidth={2.4} />
                    </span>
                    <strong style={{ fontSize: 15, color: '#16324A', flex: 1 }}>{feat.title}</strong>
                    <span className={styles.pillNeutral}>Sắp ra mắt</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Mobile Sunset Transition */}
          <div
            aria-hidden="true"
            style={{
              height: 220,
              background:
                'linear-gradient(#F5F3EE 0%, #F9E3CF 30%, #E7B79F 55%, #8E6E72 78%, #2B4A63 94%, #16324A 100%)',
            }}
          />

          {/* ==================== MOBILE FINAL CTA ==================== */}
          <section
            style={{
              position: 'relative',
              background: '#16324A',
              padding: '56px 20px 0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 22,
              textAlign: 'center',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.035em', color: '#FFFFFF' }}>
              Sẵn sàng bắt đầu hành trình của riêng bạn?
            </h2>
            <Link to="/register" className={`${styles.lqCta} ${styles.primaryCtaMobile}`}>
              Bắt đầu cùng Fox
            </Link>
            <div style={{ position: 'relative', width: 'calc(100% + 40px)', height: 230, marginTop: 10 }}>
              <svg
                viewBox="0 0 390 230"
                preserveAspectRatio="xMidYMax slice"
                width="100%"
                height="230"
                style={{ position: 'absolute', inset: 0 }}
                aria-hidden="true"
              >
                <path d="M0 150 L 90 80 L 160 130 L 250 50 L 320 120 L 390 90 V230 H0Z" fill="#2E5068" />
                <path d="M0 190 C 120 170 260 180 390 172 V230 H0Z" fill="#244258" />
                <g transform="translate(250 52) scale(0.5)">
                  <path d="M0 0 V -64" stroke="#16324A" strokeWidth="5" strokeLinecap="round" />
                  <path d="M2 -62 h 36 l -9 12 9 12 h -36 z" fill="#F6C85F" />
                </g>
              </svg>
              <FoxPicture
                asset={LANDING_FOX_ASSETS.ctaSummit}
                alt="Fox V2 trên đỉnh hành trình"
                style={{ position: 'absolute', left: 'calc(50% - 70px)', bottom: 10, height: 170, width: 'auto' }}
              />
            </div>
          </section>

          {/* ==================== MOBILE CAMPFIRE FOOTER ==================== */}
          <footer
            style={{
              position: 'relative',
              background: 'linear-gradient(#1B3850, #132A3E)',
              overflow: 'hidden',
              padding: '36px 20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}
          >
            {MOBILE_FIREFLIES.map((ff, idx) => (
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

            <div style={{ position: 'relative', height: 190 }}>
              <div style={{ position: 'absolute', right: 18, bottom: 26 }}>
                <CampfireSvg gradientId="lqFireGlowMobile" width={160} height={128} />
              </div>

              <div style={{ position: 'absolute', left: 0, bottom: 30 }}>
                <FoxPicture
                  asset={LANDING_FOX_ASSETS.footerCamp}
                  alt="Fox V2 ngủ bên lửa trại"
                  style={{ height: 118, width: 'auto', display: 'block' }}
                />
                <div style={{ position: 'absolute', left: 56, top: -12, width: 50, height: 30 }}>
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

              <svg
                viewBox="0 0 390 40"
                preserveAspectRatio="none"
                width="100%"
                height="40"
                style={{ position: 'absolute', left: -20, right: -20, bottom: 0, width: 'calc(100% + 40px)' }}
                aria-hidden="true"
              >
                <path d="M0 20 C 100 6 220 30 390 14 V40 H0Z" fill="#163046" />
              </svg>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 20px' }}>
              <nav aria-label="Liên kết chân trang di động" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '8px 0 0' }}>
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
                  <Link to="/login" className={`${styles.lqSign} ${styles.signPostLinkRight}`} style={{ width: 220, rotate: '-3deg' }}>
                    Đăng nhập
                  </Link>
                  <Link to="/register" className={`${styles.lqSign} ${styles.signPostLinkLeft}`} style={{ width: 220, rotate: '2deg' }}>
                    Đăng ký
                  </Link>
                  <button
                    type="button"
                    className={`${styles.lqSign} ${styles.signPostLinkRight}`}
                    style={{ width: 220, rotate: '-2deg' }}
                    onClick={() => onOpenLegal('privacy')}
                  >
                    Quyền riêng tư
                  </button>
                  <button
                    type="button"
                    className={`${styles.lqSign} ${styles.signPostLinkLeft}`}
                    style={{ width: 220, rotate: '3deg' }}
                    onClick={() => onOpenLegal('terms')}
                  >
                    Điều khoản
                  </button>
                </div>
              </nav>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: '#8EA3B7' }}>
              <span>© 2026 LifeQuest</span>
              <a
                href="#top"
                style={{ color: '#C9D5E0', textDecoration: 'none' }}
                onClick={(e) => {
                  e.preventDefault()
                  onScrollTop()
                }}
              >
                Về đầu ↑
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
