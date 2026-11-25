import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Coins,
  Flame,
  Heart,
  Monitor,
  Smartphone,
  Sparkles,
  Timer,
  Trophy
} from 'lucide-react'
import { useOptionalCompanion } from '@/features/mascot/CompanionProvider'
import { FoxCompanionView } from '@/features/mascot/FoxCompanionView'
import styles from './LandingPage.module.css'

const WEEK_DAYS = [
  { label: 'T2', state: 'done' },
  { label: 'T3', state: 'done' },
  { label: 'T4', state: 'done' },
  { label: 'T5', state: 'done' },
  { label: 'T6', state: 'done' },
  { label: 'T7', state: 'today' },
  { label: 'CN', state: 'idle' }
] as const

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

  return (
    <div className={styles.page} data-testid="landing-page">
      {/* Sticky Minimalist Header */}
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <Link to="/welcome" className={styles.brandLink} aria-label="LifeQuest">
            <svg viewBox="0 0 48 40" width="32" height="27" aria-hidden="true">
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

          <div className={styles.navRight}>
            <span className={styles.langLabel}>Ngôn ngữ hiển thị: Tiếng Việt</span>
            <Link to="/register" className={styles.navCtaBtn}>
              Bắt đầu
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION: Warm Sunlit Sky + Decorative SVG Clouds + Live 3D Fox V2 */}
      <section className={styles.heroSection}>
        <svg
          className={styles.heroBgSvg}
          viewBox="0 0 1440 540"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <circle cx="130" cy="95" r="46" fill="#FFE7CC" opacity="0.55" />
          <circle cx="1320" cy="110" r="62" fill="#D4F4EC" opacity="0.55" />
          <circle cx="520" cy="70" r="14" fill="#FFD166" opacity="0.5" />
          <circle cx="940" cy="430" r="18" fill="#FBC6D2" opacity="0.55" />
          <path
            d="M0 490 Q360 440 720 485 T1440 475 L1440 540 L0 540 Z"
            fill="#FFFFFF"
            opacity="0.7"
          />
        </svg>

        <div className={styles.heroInner}>
          <div className={styles.heroVisual}>
            <div className={styles.heroAura} aria-hidden="true" />
            <span className={`${styles.floatBadge} ${styles.floatTopLeft}`}>
              <Flame size={15} color="#F26733" aria-hidden="true" />
              <span>Chuỗi 12 ngày</span>
            </span>
            <span className={`${styles.floatBadge} ${styles.floatTopRight}`}>
              <Coins size={15} color="#C9962B" aria-hidden="true" />
              <span>+40 XP · +15 Xu</span>
            </span>
            <span className={`${styles.floatBadge} ${styles.floatBottomLeft}`}>
              <Heart size={15} color="#E54868" aria-hidden="true" />
              <span>Lên cấp cùng Fox</span>
            </span>
            <span className={`${styles.floatBadge} ${styles.floatBottomRight}`}>
              <CheckCircle2 size={15} color="#168C78" aria-hidden="true" />
              <span>Quest hằng ngày</span>
            </span>

            <div
              className={styles.foxHeroWrap}
              onClick={handleHeroFoxClick}
              role="button"
              tabIndex={0}
              aria-label="Chạm vào Fox V2 để chào hỏi"
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
                className={styles.foxHeroCanvas}
              />
            </div>
          </div>

          <div className={styles.heroCopy}>
            <span className={styles.heroPill}>
              <Sparkles size={13} aria-hidden="true" />
              <span>Web App &amp; Mobile App · Fox V2 3D</span>
            </span>
            <h1 className={styles.heroTitle}>
              Biến mục tiêu mỗi ngày thành hành trình vui nhất!
            </h1>

            <div className={styles.heroActions}>
              <Link to="/register" className={styles.ctaPrimary} data-testid="landing-start-btn">
                Bắt đầu
              </Link>
              <Link to="/login" className={styles.ctaSecondary} data-testid="landing-login-btn">
                Tôi đã có tài khoản
              </Link>
            </div>

            <Link to="/" className={styles.previewWorkspaceLink}>
              <span>Vào thẳng không gian làm việc</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ROW 1: Phone Mockup Showcase (miễn phí. vui nhộn. hiệu quả.) */}
      <div className={styles.bandWhite}>
        <section className={styles.featureSection}>
          <div className={styles.featureText}>
            <span className={`${styles.featureEyebrow} ${styles.eyebrowOrange}`}>
              Gamification thông minh
            </span>
            <h2 className={styles.featureHeading}>miễn phí. vui nhộn. hiệu quả.</h2>
            <p className={styles.featureDesc}>
              Quản lý công việc và thói quen cùng LifeQuest nhẹ nhàng như chơi một trò chơi! Chia
              nhỏ mục tiêu thành từng Quest ngắn gọn giúp bạn ghi điểm KN, mở khóa cấp độ mới và
              tạo đà tiến bộ mỗi ngày.
            </p>
          </div>

          <div className={styles.featureVisualCol} aria-hidden="true">
            <div className={styles.phoneFrame}>
              <div className={styles.phoneNotch} />
              <div className={styles.phoneScreen}>
                <div className={styles.phoneTopStats}>
                  <span className={styles.phoneStatItem}>
                    <Flame size={13} color="#F26733" /> 12
                  </span>
                  <span className={styles.phoneStatItem}>
                    <Coins size={13} color="#C9962B" /> 480
                  </span>
                  <span className={styles.phoneStatItem}>
                    <Heart size={13} color="#E54868" /> Cấp 5
                  </span>
                </div>
                <div className={styles.phoneProgressTrack}>
                  <div className={styles.phoneProgressFill} style={{ width: '76%' }} />
                </div>
                <div className={styles.phoneGrid}>
                  <div className={`${styles.phoneTile} ${styles.tileTeal}`}>
                    <CheckCircle2 size={18} color="#168C78" />
                    <span className={styles.phoneTileTitle}>Nhiệm vụ</span>
                    <span className={styles.phoneTileMeta}>+40 XP</span>
                  </div>
                  <div className={`${styles.phoneTile} ${styles.tileOrange}`}>
                    <Flame size={18} color="#F26733" />
                    <span className={styles.phoneTileTitle}>Thói quen</span>
                    <span className={styles.phoneTileMeta}>Streak 12</span>
                  </div>
                  <div className={`${styles.phoneTile} ${styles.tilePurple}`}>
                    <Trophy size={18} color="#7C3AED" />
                    <span className={styles.phoneTileTitle}>Quest tuần</span>
                    <span className={styles.phoneTileMeta}>3/4 xong</span>
                  </div>
                  <div className={`${styles.phoneTile} ${styles.tileRose}`}>
                    <Heart size={18} color="#E54868" />
                    <span className={styles.phoneTileTitle}>Fox V2</span>
                    <span className={styles.phoneTileMeta}>Vui vẻ</span>
                  </div>
                </div>
                <div className={styles.rankRibbon}>
                  <Trophy size={14} />
                  <span>#1 Bảng tiến độ tuần này</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ROW 2: Mint-Teal Band — Scientific Habit & Calendar */}
      <div className={styles.bandMint}>
        <section className={`${styles.featureSection} ${styles.featureReverse}`}>
          <div className={styles.featureText}>
            <span className={`${styles.featureEyebrow} ${styles.eyebrowTeal}`}>
              Lịch trình &amp; Pomodoro
            </span>
            <h2 className={`${styles.featureHeading} ${styles.headingTeal}`}>
              dựa trên phương pháp khoa học
            </h2>
            <p className={styles.featureDesc}>
              Kết hợp nguyên tắc chia nhỏ mục tiêu, lịch trực quan theo tháng và phiên tập trung sâu
              Pomodoro — giúp bạn hình thành thói quen bền vững mà không bị quá tải.
            </p>
          </div>

          <div className={styles.featureVisualCol} aria-hidden="true">
            <div className={styles.showcaseCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 15 }}>
                  <Calendar size={19} color="#168C78" />
                  <span>Nhịp tuần hiện tại</span>
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#168C78' }}>5/7 ngày</span>
              </div>
              <div className={styles.weekDaysRow}>
                {WEEK_DAYS.map((d) => (
                  <span
                    key={d.label}
                    className={`${styles.dayDot} ${d.state === 'done' ? styles.dayDotDone : d.state === 'today' ? styles.dayDotToday : ''}`.trim()}
                  >
                    {d.label}
                  </span>
                ))}
              </div>
              <div className={styles.scheduleItem}>
                <span>08:30 · Tập trung sâu 25 phút</span>
                <span style={{ color: '#168C78' }}>✓ Xong</span>
              </div>
              <div className={`${styles.scheduleItem} ${styles.scheduleItemActive}`}>
                <span>14:00 · Hoàn thiện Quest tuần</span>
                <span>Đang chạy</span>
              </div>
              <div className={styles.scheduleItem}>
                <span>20:30 · Đọc 15 trang sách</span>
                <span style={{ color: '#8C7B6B' }}>Sắp tới</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ROW 3: Warm Cream Band — Fox V2 Motivation & Wardrobe */}
      <div className={styles.bandCream}>
        <section className={styles.featureSection}>
          <div className={styles.featureText}>
            <span className={`${styles.featureEyebrow} ${styles.eyebrowOrange}`}>
              Người bạn đồng hành 3D
            </span>
            <h2 className={styles.featureHeading}>tiếp thêm động lực mỗi ngày</h2>
            <p className={styles.featureDesc}>
              Luôn có người bạn đồng hành 3D sống động — <strong>Fox V2</strong> — cùng bảng tin bạn
              bè, thử thách nhóm và tủ đồ trang phục để mỗi bước tiến nhỏ đều đáng ăn mừng.
            </p>
          </div>

          <div className={styles.featureVisualCol} aria-hidden="true">
            <div className={styles.foxSpotlightCard}>
              <img
                src="/fox_poster.png"
                alt=""
                className={styles.foxSpotlightImg}
                draggable={false}
              />
              <div className={styles.miniStack}>
                <div className={styles.miniHighlight}>
                  <span className={styles.miniHighlightTitle}>🔥 Chuỗi 14 ngày rực lửa</span>
                  <span className={styles.miniHighlightDesc}>
                    Fox tung pháo giấy ăn mừng mỗi cột mốc!
                  </span>
                </div>
                <div className={styles.miniHighlight}>
                  <span className={styles.miniHighlightTitle}>🎒 Tủ đồ &amp; Cửa hàng Fox</span>
                  <span className={styles.miniHighlightDesc}>
                    Dùng Xu thưởng đổi mũ, kính và phụ kiện
                  </span>
                </div>
                <div className={styles.miniHighlight}>
                  <span className={styles.miniHighlightTitle}>💬 Nhắn tin &amp; Thử thách nhóm</span>
                  <span className={styles.miniHighlightDesc}>
                    Cổ vũ bạn bè giữ lửa mỗi ngày
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* SKY-BLUE BAND: Dual Mobile Phones + Web App Showcase */}
      <section className={styles.anywhereBand}>
        <div className={styles.anywhereInner}>
          <div className={styles.anywhereCopy}>
            <span className={`${styles.featureEyebrow} ${styles.eyebrowTeal}`}>
              Đa nền tảng · Đồng bộ tức thì
            </span>
            <h2 className={styles.anywhereTitle}>
              chinh phục mục tiêu bất kỳ lúc nào, ở bất kỳ đâu
            </h2>
            <p className={styles.anywhereDesc}>
              Lên kế hoạch trên máy tính buổi sáng, check-in thói quen nhanh trên điện thoại buổi
              tối — dữ liệu Quest, Streak và Fox V2 luôn đi cùng bạn trên mọi thiết bị.
            </p>
            <div className={styles.storeRow}>
              <Link to="/" className={styles.storeBadge}>
                <Monitor size={22} color="#F26733" aria-hidden="true" />
                <span>
                  <span className={styles.storeSmall}>Sẵn sàng ngay</span>
                  <span className={styles.storeBig}>LifeQuest Web App</span>
                </span>
              </Link>
              <div className={styles.storeBadge}>
                <Smartphone size={22} color="#168C78" aria-hidden="true" />
                <span>
                  <span className={styles.storeSmall}>iOS &amp; Android</span>
                  <span className={styles.storeBig}>Mobile App (Sắp ra mắt)</span>
                </span>
              </div>
            </div>
          </div>

          <div className={styles.dualPhones} aria-hidden="true">
            <div className={styles.phoneTiltedLeft}>
              <div className={styles.miniPhoneScreen}>
                <div className={styles.miniPhoneHeader}>
                  <span>Hôm nay</span>
                  <span style={{ color: '#F26733' }}>🔥 12</span>
                </div>
                <img src="/fox_poster.png" alt="" className={styles.miniPhoneFox} draggable={false} />
                <div className={styles.miniPhoneCard}>✓ Uống đủ 2L nước · +20 XP</div>
                <div className={styles.miniPhoneCard}>✓ Chạy bộ 20 phút · +30 XP</div>
              </div>
            </div>

            <div className={styles.phoneTiltedRight}>
              <div className={styles.miniPhoneScreen}>
                <div className={styles.miniPhoneHeader}>
                  <span>Tập trung</span>
                  <Timer size={14} color="#168C78" />
                </div>
                <div
                  style={{
                    textAlign: 'center',
                    padding: '14px 8px',
                    borderRadius: 14,
                    background: '#FFF1E6',
                    color: '#C84B1D',
                    fontSize: 22,
                    fontWeight: 900
                  }}
                >
                  24:59
                </div>
                <div className={styles.miniPhoneCard}>🎯 Rà soát mục tiêu tuần</div>
                <div className={styles.miniPhoneCard}>❤️ Fox đang cổ vũ bạn!</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEEP INDIGO SPOTLIGHT BAND: LifeQuest Plus / Fox Wardrobe */}
      <section className={styles.plusBand}>
        <div className={styles.plusInner}>
          <div className={styles.plusVisual} aria-hidden="true">
            <div className={styles.plusOrb}>
              <div className={styles.plusOrbInner}>
                <img
                  src="/fox_poster.png"
                  alt=""
                  style={{ width: 118, height: 'auto' }}
                  draggable={false}
                />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#FFD166' }}>
                  FOX V2 COMPANION
                </span>
              </div>
            </div>
          </div>

          <div className={styles.plusCopy}>
            <span className={styles.plusKicker}>Nâng cấp trải nghiệm cùng Fox</span>
            <h2 className={styles.plusTitle}>POWER UP WITH LIFEQUEST</h2>
            <p className={styles.plusDesc}>
              Mở khóa tủ đồ Fox V2, chế độ tập trung sâu, thành tích cấp cao và thử thách nhóm cùng
              bạn bè — biến từng ngày bình thường thành một chặng phiêu lưu đáng nhớ.
            </p>
            <Link to="/wardrobe" className={styles.plusBtn}>
              <Sparkles size={16} color="#F26733" aria-hidden="true" />
              <span>Khám phá Tủ đồ Fox</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA with Warm Meadow Hills */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <Sparkles size={36} color="#F26733" aria-hidden="true" />
          <h2 className={styles.finalTitle}>bắt đầu hành trình cùng LifeQuest</h2>
          <div className={styles.finalBtnWrap}>
            <Link to="/register" className={styles.ctaPrimary}>
              Bắt đầu ngay
            </Link>
          </div>
        </div>

        <svg
          className={styles.finalHillsSvg}
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 70 Q280 5 640 65 T1440 45 L1440 120 L0 120 Z" fill="#FF925E" opacity="0.4" />
          <path d="M0 85 Q420 25 840 78 T1440 60 L1440 120 L0 120 Z" fill="#F26733" />
        </svg>
      </section>

      {/* Vibrant Fox Orange Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>© 2026 LifeQuest · Đồng hành cùng Fox V2</span>
          <nav className={styles.footerLinks} aria-label="Liên kết chân trang">
            <Link to="/" className={styles.footerLink}>
              Không gian làm việc
            </Link>
            <Link to="/login" className={styles.footerLink}>
              Đăng nhập
            </Link>
            <Link to="/register" className={styles.footerLink}>
              Đăng ký
            </Link>
            <Link to="/loading" className={styles.footerLink}>
              Màn hình Loading
            </Link>
            <Link to="/profile" className={styles.footerLink}>
              Hồ sơ
            </Link>
            <Link to="/settings" className={styles.footerLink}>
              Cài đặt
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
