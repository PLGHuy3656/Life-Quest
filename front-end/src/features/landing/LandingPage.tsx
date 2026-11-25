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
  Trophy
} from 'lucide-react'
import { useOptionalCompanion } from '@/features/mascot/CompanionProvider'
import { FoxCompanionView } from '@/features/mascot/FoxCompanionView'
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

      {/* Hero Section: Live Interactive 3D Fox V2 Left + Headline & CTAs Right */}
      <section className={styles.heroSection}>
        <div className={styles.heroInner}>
          <div className={styles.heroVisual}>
            <span className={`${styles.floatBadge} ${styles.floatTopLeft}`}>
              <Flame size={15} color="#F26733" aria-hidden="true" />
              <span>Chuỗi Streak</span>
            </span>
            <span className={`${styles.floatBadge} ${styles.floatTopRight}`}>
              <Coins size={15} color="#C9962B" aria-hidden="true" />
              <span>+40 XP</span>
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

      {/* Feature Row 1: miễn phí. vui nhộn. hiệu quả. */}
      <section className={styles.featureSection}>
        <div className={styles.featureText}>
          <h2 className={styles.featureHeading}>miễn phí. vui nhộn. hiệu quả.</h2>
          <p className={styles.featureDesc}>
            Quản lý công việc và thói quen cùng LifeQuest nhẹ nhàng như chơi một trò chơi! Chia nhỏ
            mục tiêu thành từng Quest ngắn gọn giúp bạn ghi điểm KN, mở khóa cấp độ mới và tạo đà
            tiến bộ mỗi ngày.
          </p>
        </div>

        <div className={styles.featureCardVisual} aria-hidden="true">
          <div className={styles.mockProgressRow}>
            <Flame size={18} color="#F26733" />
            <div className={styles.mockTrack}>
              <div className={styles.mockFill} style={{ width: '74%' }} />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: '#C84B1D' }}>74%</span>
          </div>
          <div className={styles.mockGrid}>
            <div className={styles.mockTile}>
              <CheckCircle2 size={20} color="#168C78" />
              <span className={styles.mockTileTitle}>Nhiệm vụ hôm nay</span>
              <span className={styles.mockTileMeta}>+40 XP · +15 Xu</span>
            </div>
            <div className={styles.mockTile}>
              <Flame size={20} color="#F26733" />
              <span className={styles.mockTileTitle}>Thói quen bền bỉ</span>
              <span className={styles.mockTileMeta}>Giữ lửa 7 ngày</span>
            </div>
            <div className={styles.mockTile}>
              <Trophy size={20} color="#8E44E8" />
              <span className={styles.mockTileTitle}>Cột mốc Quest</span>
              <span className={styles.mockTileMeta}>Mở khóa thành tích</span>
            </div>
            <div className={styles.mockTile}>
              <Heart size={20} color="#E54868" />
              <span className={styles.mockTileTitle}>Lên cấp cùng Fox</span>
              <span className={styles.mockTileMeta}>Đổi trang phục mới</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Row 2: dựa trên thói quen khoa học */}
      <section className={`${styles.featureSection} ${styles.featureReverse}`}>
        <div className={styles.featureText}>
          <h2 className={styles.featureHeading}>dựa trên phương pháp khoa học</h2>
          <p className={styles.featureDesc}>
            Kết hợp nguyên tắc chia nhỏ mục tiêu, lịch trình trực quan và chu kỳ tập trung Pomodoro
            — giúp bạn hình thành thói quen bền vững mà không bị quá tải.
          </p>
        </div>

        <div className={styles.featureCardVisual} aria-hidden="true">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={20} color="#168C78" />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#182640' }}>
              Lịch trình &amp; Tập trung sâu
            </span>
          </div>
          <div className={styles.pacePills}>
            <div className={styles.paceRow}>
              <span>08:30 · Phiên tập trung 25 phút</span>
              <span style={{ color: '#168C78' }}>Hoàn thành</span>
            </div>
            <div className={`${styles.paceRow} ${styles.paceRowActive}`}>
              <span>14:00 · Ôn tập mục tiêu tuần</span>
              <span>Đang chạy</span>
            </div>
            <div className={styles.paceRow}>
              <span>20:00 · Đọc 15 trang sách</span>
              <span style={{ color: '#8C7B6B' }}>Sắp tới</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Row 3: tiếp thêm động lực */}
      <section className={styles.featureSection}>
        <div className={styles.featureText}>
          <h2 className={styles.featureHeading}>tiếp thêm động lực mỗi ngày</h2>
          <p className={styles.featureDesc}>
            Luôn có người bạn đồng hành 3D sống động — <strong>Fox V2</strong> — cùng bảng tin bạn
            bè, thử thách nhóm và tủ đồ trang phục để mỗi bước tiến nhỏ đều đáng ăn mừng.
          </p>
        </div>

        <div className={styles.featureCardVisual} aria-hidden="true">
          <div className={styles.foxSpotlightRow}>
            <img
              src="/fox_poster.png"
              alt=""
              className={styles.foxSpotlightImg}
              draggable={false}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className={styles.mockTile} style={{ padding: '10px 14px' }}>
                <span className={styles.mockTileTitle}>🔥 Chuỗi 14 ngày rực lửa</span>
                <span className={styles.mockTileMeta}>Fox đang cổ vũ bạn hết mình!</span>
              </span>
              <span className={styles.mockTile} style={{ padding: '10px 14px' }}>
                <span className={styles.mockTileTitle}>✨ Tủ đồ Fox V2</span>
                <span className={styles.mockTileMeta}>Dùng Xu thưởng đổi mũ &amp; phụ kiện</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Row 4: cá nhân hóa trải nghiệm */}
      <section className={`${styles.featureSection} ${styles.featureReverse}`}>
        <div className={styles.featureText}>
          <h2 className={styles.featureHeading}>cá nhân hóa hành trình của bạn</h2>
          <p className={styles.featureDesc}>
            Chỉ 30 giây khảo sát khi bắt đầu giúp LifeQuest điều chỉnh nhịp độ 5, 15, 30 hay 60+
            phút mỗi ngày phù hợp nhất với lịch học và công việc của riêng bạn.
          </p>
        </div>

        <div className={styles.featureCardVisual} aria-hidden="true">
          <div className={styles.pacePills}>
            <div className={styles.paceRow}>
              <span>5 phút / ngày</span>
              <span style={{ color: '#8C7B6B' }}>Nhẹ nhàng</span>
            </div>
            <div className={`${styles.paceRow} ${styles.paceRowActive}`}>
              <span>15 phút / ngày</span>
              <span>Đều đặn · Gợi ý</span>
            </div>
            <div className={styles.paceRow}>
              <span>30 phút / ngày</span>
              <span style={{ color: '#8C7B6B' }}>Nghiêm túc</span>
            </div>
          </div>
        </div>
      </section>

      {/* Anywhere Band */}
      <section className={styles.anywhereBand}>
        <div className={styles.anywhereInner}>
          <h2 className={styles.anywhereTitle}>
            chinh phục mục tiêu bất kỳ lúc nào, ở bất kỳ đâu
          </h2>
          <div className={styles.platformRow}>
            <Link to="/" className={styles.platformPill}>
              <Monitor size={18} color="#F26733" aria-hidden="true" />
              <span>Trải nghiệm ngay trên Web</span>
            </Link>
            <span className={styles.platformPill}>
              <Smartphone size={18} color="#168C78" aria-hidden="true" />
              <span>Ứng dụng Mobile (Đang phát triển)</span>
            </span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <Sparkles size={34} color="#F26733" aria-hidden="true" />
          <h2 className={styles.finalTitle}>bắt đầu hành trình cùng LifeQuest</h2>
          <div className={styles.finalBtnWrap}>
            <Link to="/register" className={styles.ctaPrimary}>
              Bắt đầu ngay
            </Link>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
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
            <Link to="/settings" className={styles.footerLink}>
              Cài đặt
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
