import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Camera,
  CheckCircle2,
  Coins,
  Compass,
  Flame,
  Heart,
  ShieldCheck,
  Sparkles,
  Trophy
} from 'lucide-react'
import { useOptionalCompanion } from '@/features/mascot/CompanionProvider'
import { FoxCompanionView } from '@/features/mascot/FoxCompanionView'
import {
  EVIDENCE_STEPS,
  FOX_MODES_PREVIEW,
  HERO_STRIP_ITEMS,
  MOCK_CALENDAR_HIGHLIGHTS,
  MOCK_FRIEND_STORIES,
  MOCK_MOBILE_TODAY_TASKS,
  MOCK_PROGRESS_SUMMARY,
  ONBOARDING_STEPS_SUMMARY,
  WORK_TYPE_CARDS
} from './landingMockData'
import styles from './LandingPage.module.css'

export function LandingPage() {
  const companion = useOptionalCompanion()
  const companionRef = useRef(companion)
  companionRef.current = companion

  useEffect(() => {
    const id = window.setTimeout(() => {
      companionRef.current?.playClip('wave')
    }, 450)
    return () => window.clearTimeout(id)
  }, [])

  const handleHeroFoxClick = () => {
    companionRef.current?.playClip('duo_celebrate')
  }

  const highlightByDay = new Map<number, (typeof MOCK_CALENDAR_HIGHLIGHTS)[number]>(
    MOCK_CALENDAR_HIGHLIGHTS.map((item) => [item.day, item])
  )

  return (
    <div className={styles.page} data-testid="landing-page">
      {/* Top Navbar */}
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <Link to="/welcome" className={styles.brandLink} aria-label="LifeQuest">
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

          <nav className={styles.navLinks} aria-label="Điều hướng giới thiệu">
            <a href="#features" className={styles.navLink}>Tính năng</a>
            <a href="#mobile-preview" className={styles.navLink}>Cách hoạt động</a>
            <a href="#fox-companion" className={styles.navLink}>Cáo đồng hành</a>
            <a href="#community" className={styles.navLink}>Cộng đồng</a>
          </nav>

          <div className={styles.navActions}>
            <Link to="/login" className={styles.navLoginLink} data-testid="landing-login-btn">
              Đăng nhập
            </Link>
            <Link to="/register" className={styles.btnTeal} data-testid="landing-start-btn">
              Bắt đầu miễn phí
            </Link>
          </div>
        </div>
      </header>

      {/* SECTION 1: HERO */}
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <h1 className={styles.heroTitle}>Biến từng việc nhỏ thành một hành trình.</h1>
              <p className={styles.heroDesc}>
                Quản lý nhiệm vụ, thói quen và mục tiêu dài hạn trên cả Web &amp; Mobile cùng người
                bạn đồng hành 3D <strong>Fox V2</strong> — nhẹ nhàng, rõ ràng và đầy cảm hứng.
              </p>
              <div className={styles.heroCtas}>
                <Link to="/register" className={styles.btnTeal} style={{ minHeight: 46, padding: '0 22px' }}>
                  Bắt đầu miễn phí
                </Link>
                <Link to="/" className={styles.btnOutline}>
                  Mở ứng dụng Web
                </Link>
              </div>
              <span className={styles.heroMockNote}>
                * Giao diện điện thoại minh họa bằng dữ liệu mẫu (Mock Preview) trước khi hoàn thiện bản Mobile.
              </span>
            </div>

            <div className={styles.heroStage}>
              <span className={`${styles.floatChip} ${styles.floatChipTop}`}>
                <CheckCircle2 size={14} color="#147A68" aria-hidden="true" />
                <span>Hoàn thành +35 XP</span>
              </span>
              <span className={`${styles.floatChip} ${styles.floatChipMid}`}>
                <Flame size={14} color="#F26733" aria-hidden="true" />
                <span>Streak 12 ngày</span>
              </span>
              <span className={`${styles.floatChip} ${styles.floatChipBottom}`}>
                <Heart size={14} color="#E54868" aria-hidden="true" />
                <span>Cấp 5 · 480 Xu</span>
              </span>

              <div className={styles.heroPhone} aria-hidden="true">
                <div className={styles.heroPhoneScreen}>
                  <div className={styles.phoneHeader}>
                    <span>Hôm nay · Mobile Mock</span>
                    <span className={styles.phonePillRow}>
                      <Flame size={12} color="#F26733" /> 12
                    </span>
                  </div>
                  {MOCK_MOBILE_TODAY_TASKS.map((task) => (
                    <div key={task.id} className={styles.phoneTaskCard}>
                      <div className={styles.phoneTaskTop}>
                        <span>{task.done ? '✓ ' : ''}{task.title}</span>
                        <span style={{ color: '#147A68' }}>{task.xp}</span>
                      </div>
                      <div className={styles.phoneMiniTrack}>
                        <div className={styles.phoneMiniFill} style={{ width: `${task.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={styles.heroFoxFloat}
                onClick={handleHeroFoxClick}
                role="button"
                tabIndex={0}
                aria-label="Chạm vào Fox V2 để tương tác"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleHeroFoxClick()
                  }
                }}
              >
                <FoxCompanionView
                  presentation="mini"
                  label="landing-hero-fox"
                  className={styles.foxCanvasClean}
                />
              </div>
            </div>
          </div>

          <div className={styles.stripGrid}>
            {HERO_STRIP_ITEMS.map((item) => (
              <div key={item.id} className={styles.stripCard}>
                <span className={`${styles.dotIcon} ${styles[`tone_${item.tone}`]}`} aria-hidden="true">
                  {item.id === 'task' ? (
                    <CheckCircle2 size={15} />
                  ) : item.id === 'habit' ? (
                    <Flame size={15} />
                  ) : item.id === 'quest' ? (
                    <Compass size={15} />
                  ) : (
                    <Sparkles size={15} />
                  )}
                </span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: 3 WORK TYPES */}
      <section id="features" className={styles.sectionPad}>
        <div className={styles.container}>
          <div className={styles.sectionCenterHead}>
            <h2 className={styles.sectionTitle}>Không phải mọi việc đều giống nhau.</h2>
            <p className={styles.sectionSubtitle}>
              LifeQuest tách riêng 3 loại mục tiêu để bạn luôn biết hôm nay cần tập trung điều gì mà
              không bị rối.
            </p>
          </div>

          <div className={styles.threeColGrid}>
            {WORK_TYPE_CARDS.map((card) => (
              <div key={card.id} className={styles.whiteCard}>
                <span className={`${styles.typeBadge} ${styles[`tone_${card.tone}`]}`}>
                  {card.badge}
                </span>
                <h3 className={styles.cardHeading}>{card.title}</h3>
                <div className={styles.tagRow}>
                  {card.tags.map((t) => (
                    <span key={t} className={styles.miniTag}>{t}</span>
                  ))}
                </div>
                <div className={styles.samplePreviewBox}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#162C42' }}>
                    {card.sampleTitle}
                  </span>
                  <span style={{ fontSize: 12, color: '#667085', fontWeight: 600 }}>
                    {card.sampleMeta}
                  </span>
                  {card.id === 'habit' && (
                    <div className={styles.habitDotsRow} aria-hidden="true">
                      {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, idx) => (
                        <span
                          key={d}
                          className={`${styles.habitDot} ${idx === 6 ? styles.habitDotMuted : ''}`.trim()}
                        >
                          {idx < 6 ? '✓' : '·'}
                        </span>
                      ))}
                    </div>
                  )}
                  {card.id === 'quest' && (
                    <div className={styles.phoneMiniTrack} style={{ height: 8 }}>
                      <div
                        className={styles.phoneMiniFill}
                        style={{ width: '64%', background: '#F26733' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: DEEP NAVY MOBILE GESTURE & EVIDENCE PREVIEW (MOCK DATA) */}
      <div id="mobile-preview" className={styles.container}>
        <section className={styles.navyBlock}>
          <div className={styles.navyCenterHead}>
            <span className={styles.navyEyebrow}>Bản xem trước Mobile (Mock Data)</span>
            <h2 className={styles.navyTitle}>Một cử chỉ cho mỗi phần của hành trình.</h2>
          </div>

          <div className={styles.gestureRow}>
            <div className={styles.gestureNote}>
              <h3 className={styles.gestureHeading}>Vuốt phải để ghi nhận.</h3>
              <p className={styles.gestureDesc}>
                Hoàn thành nhanh nhiệm vụ hay check-in thói quen hằng ngày chỉ với một cú chạm nhẹ.
              </p>
            </div>

            <div className={styles.heroPhone} style={{ width: 248 }} aria-hidden="true">
              <div className={styles.heroPhoneScreen}>
                <div className={styles.phoneHeader}>
                  <span>LifeQuest Mobile</span>
                  <span style={{ color: '#F26733' }}>Mock</span>
                </div>
                {MOCK_MOBILE_TODAY_TASKS.map((t) => (
                  <div key={t.id} className={styles.phoneTaskCard}>
                    <div className={styles.phoneTaskTop}>
                      <span>{t.title}</span>
                    </div>
                    <div className={styles.phoneMiniTrack}>
                      <div className={styles.phoneMiniFill} style={{ width: `${t.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${styles.gestureNote} ${styles.gestureNoteRight}`}>
              <h3 className={styles.gestureHeading}>Vuốt trái để xem chi tiết.</h3>
              <p className={styles.gestureDesc}>
                Mở phiên tập trung Pomodoro, ghi chú minh chứng và theo dõi cột mốc Quest.
              </p>
            </div>
          </div>

          <div className={styles.evidenceGrid}>
            <div>
              <h3 className={styles.navyTitle} style={{ fontSize: 26 }}>
                Khi Task cần minh chứng, camera mở ra trực tiếp.
              </h3>
              <ul className={styles.evidenceList}>
                {EVIDENCE_STEPS.map((text, idx) => (
                  <li key={text} className={styles.evidenceStep}>
                    <span className={styles.stepNumDot}>{idx + 1}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.cameraMockPair} aria-hidden="true">
              <div className={`${styles.cameraCard} ${styles.cameraCardDesk}`}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#CBD5E1' }}>
                  Góc học tập · Mock
                </span>
                <Camera size={32} color="#FFD166" style={{ alignSelf: 'center' }} />
                <div className={styles.shutterRow}>
                  <span className={styles.shutterCircle} />
                </div>
              </div>
              <div className={`${styles.cameraCard} ${styles.cameraCardWindow}`}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#CBD5E1' }}>
                  Hoàn thành 20 phút · Mock
                </span>
                <CheckCircle2 size={32} color="#5EEAD4" style={{ alignSelf: 'center' }} />
                <div className={styles.shutterRow}>
                  <span className={styles.shutterCircle} />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.privacyBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={20} color="#FFD166" aria-hidden="true" />
              <span style={{ fontSize: 14, fontWeight: 700 }}>
                Minh chứng của bạn không tự động đăng công khai — bạn luôn toàn quyền chọn chế độ.
              </span>
            </div>
            <div className={styles.privacyPills}>
              <span className={`${styles.privacyPill} ${styles.privacyPillActive}`}>Riêng tư</span>
              <span className={styles.privacyPill}>Bạn bè</span>
              <span className={styles.privacyPill}>Công khai</span>
            </div>
          </div>
        </section>
      </div>

      {/* SECTION 4: FRIENDS STORIES */}
      <section id="community" className={styles.sectionPad}>
        <div className={styles.container}>
          <div className={styles.twoColSplit}>
            <div className={styles.heroCopy}>
              <span className={`${styles.typeBadge} ${styles.tone_orange}`}>CỘNG ĐỒNG NHẸ NHÀNG</span>
              <h2 className={styles.sectionTitle}>Bạn bè ở ngay một cú vuốt.</h2>
              <p className={styles.sectionSubtitle}>
                Chia sẻ khoảnh khắc hoàn thành mục tiêu với nhóm bạn thân để cùng cổ vũ giữ Streak.
                <br />
                <strong>Không ồn ào. Không cần đăng mọi thứ.</strong>
              </p>
            </div>

            <div className={styles.storiesRow}>
              {MOCK_FRIEND_STORIES.map((story) => (
                <div key={story.id} className={`${styles.storyCard} ${styles[`story_${story.tone}`]}`}>
                  <span className={styles.storyAuthor}>{story.author}</span>
                  <span className={styles.storyCaption}>{story.caption}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: CALENDAR & PROGRESS */}
      <section className={styles.sectionPad} style={{ paddingTop: 12 }}>
        <div className={styles.container}>
          <div className={styles.sectionCenterHead}>
            <h2 className={styles.sectionTitle}>
              Nhìn lại không chỉ những gì bạn đã làm, mà cả cách bạn đã tiến bộ.
            </h2>
          </div>

          <div className={styles.calendarSplit}>
            <div className={styles.whiteCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 15 }}>Tháng 11, 2026 (Mock)</strong>
                <span style={{ fontSize: 12, color: '#147A68', fontWeight: 700 }}>5 cột mốc</span>
              </div>
              <div className={styles.calGrid}>
                {Array.from({ length: 28 }, (_, i) => {
                  const day = i + 1
                  const hl = highlightByDay.get(day)
                  return (
                    <div key={day} className={styles.calCell}>
                      <span>{day}</span>
                      {hl && (
                        <span className={`${styles.calTag} ${styles[`tone_${hl.tone}`]}`}>
                          {hl.label}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className={styles.whiteCard}>
              <strong style={{ fontSize: 15 }}>Tổng kết chặng đường</strong>
              <div className={styles.summaryList}>
                {MOCK_PROGRESS_SUMMARY.map((item) => (
                  <div key={item.num} className={styles.summaryRow}>
                    <span className={`${styles.dotIcon} ${styles[`tone_${item.tone}`]}`}>
                      {item.num}
                    </span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#162C42' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#667085' }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: FOX V2 COMPANION */}
      <section id="fox-companion" className={styles.sectionPad} style={{ paddingTop: 12 }}>
        <div className={styles.container}>
          <div className={styles.foxShowcaseBanner}>
            <div className={styles.heroCopy}>
              <span className={`${styles.typeBadge} ${styles.tone_teal}`}>FOX V2 COMPANION</span>
              <h2 className={styles.sectionTitle}>
                Một người bạn nhỏ, không phải một popup phiền phức.
              </h2>
              <p className={styles.sectionSubtitle}>
                Fox V2 3D đồng hành lặng lẽ bên góc học tập: vẫy chào khi bạn mở trang, tự che mắt
                quay đi khi bạn nhập mật khẩu và tung pháo giấy ăn mừng mỗi khi hoàn thành Quest.
              </p>
            </div>

            <div className={styles.foxModesGrid}>
              {FOX_MODES_PREVIEW.map((m) => (
                <div key={m.id} className={styles.foxModeCard}>
                  <img
                    src="/fox_poster.png"
                    alt=""
                    className={styles.foxModeImg}
                    draggable={false}
                  />
                  <span className={styles.foxModeTag}>{m.tag}</span>
                  <span style={{ fontSize: 12, color: '#5b6a7c', lineHeight: 1.45 }}>{m.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: REWARDS & 3 SIMPLE STEPS */}
      <section className={styles.sectionPad} style={{ paddingTop: 12 }}>
        <div className={styles.container}>
          <div className={styles.twoColSplit} style={{ marginBottom: 56 }}>
            <div className={styles.heroCopy}>
              <span className={`${styles.typeBadge} ${styles.tone_orange}`}>PHẦN THƯỞNG CÂN BẰNG</span>
              <h2 className={styles.sectionTitle}>
                Tiến bộ có phần thưởng, nhưng phần thưởng không thay thế mục tiêu.
              </h2>
              <div className={styles.summaryList}>
                <div className={styles.whiteCard} style={{ padding: '12px 16px', flexDirection: 'row', alignItems: 'center' }}>
                  <Trophy size={18} color="#F26733" />
                  <span style={{ fontSize: 13.5, fontWeight: 700 }}>Điểm KN (XP) phản ánh đúng nỗ lực thật mỗi ngày</span>
                </div>
                <div className={styles.whiteCard} style={{ padding: '12px 16px', flexDirection: 'row', alignItems: 'center' }}>
                  <Coins size={18} color="#C9962B" />
                  <span style={{ fontSize: 13.5, fontWeight: 700 }}>Xu thưởng dùng để mở khóa mũ, kính và phụ kiện Fox V2</span>
                </div>
              </div>
            </div>

            <div className={styles.whiteCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 14.5 }}>Tủ đồ &amp; Cấp độ Fox V2</strong>
                <Link to="/wardrobe" style={{ fontSize: 12.5, fontWeight: 800, color: '#147A68', textDecoration: 'none' }}>
                  Mở Tủ đồ →
                </Link>
              </div>
              <div className={styles.phoneMiniTrack} style={{ height: 10 }}>
                <div className={styles.phoneMiniFill} style={{ width: '72%' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {['Cấp 1', 'Cấp 5', 'Cấp 10', 'Cấp 20'].map((lv) => (
                  <div key={lv} className={styles.foxModeCard} style={{ padding: '10px 6px' }}>
                    <img src="/fox_poster.png" alt="" style={{ width: 52, height: 'auto' }} draggable={false} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#162C42' }}>{lv}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.sectionCenterHead}>
            <h2 className={styles.sectionTitle}>Bắt đầu rất đơn giản.</h2>
          </div>
          <div className={styles.threeColGrid}>
            {ONBOARDING_STEPS_SUMMARY.map((step) => (
              <div key={step.num} className={styles.whiteCard}>
                <span className={styles.stepNumber}>{step.num}</span>
                <h3 className={styles.cardHeading}>{step.title}</h3>
                <p className={styles.sectionSubtitle} style={{ fontSize: 13.5 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Final Deep Navy CTA */}
          <div className={styles.finalCtaBanner}>
            <div className={styles.heroCopy}>
              <h2 className={styles.navyTitle} style={{ fontSize: 34 }}>
                Hôm nay bạn muốn bắt đầu điều gì?
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: '#B7CADB', maxWidth: 480 }}>
                Tạo tài khoản miễn phí trong 30 giây cùng bài khảo sát nhanh của Fox V2, hoặc vào
                thẳng không gian làm việc Web ngay bây giờ.
              </p>
              <div className={styles.heroCtas}>
                <Link to="/register" className={styles.btnOrange}>
                  Bắt đầu miễn phí
                </Link>
                <Link to="/login" className={styles.btnGhostDark}>
                  Tôi đã có tài khoản
                </Link>
              </div>
            </div>

            <img
              src="/fox_poster.png"
              alt="Cáo đồng hành LifeQuest V2"
              style={{ width: 156, height: 'auto', flexShrink: 0 }}
              draggable={false}
            />
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerRow}`}>
          <span>© 2026 LifeQuest · Đồng hành cùng Fox V2</span>
          <nav className={styles.footerLinks} aria-label="Liên kết chân trang">
            <Link to="/" className={styles.footerLink}>Ứng dụng Web</Link>
            <Link to="/login" className={styles.footerLink}>Đăng nhập</Link>
            <Link to="/register" className={styles.footerLink}>Đăng ký</Link>
            <Link to="/loading" className={styles.footerLink}>Màn hình Loading</Link>
            <Link to="/profile" className={styles.footerLink}>Hồ sơ</Link>
            <Link to="/settings" className={styles.footerLink}>Cài đặt</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
