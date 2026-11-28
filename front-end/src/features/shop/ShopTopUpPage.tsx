import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Coins,
  CreditCard,
  Lock,
  QrCode,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { useTodayQuery } from '@/hooks/useDashboardData'
import { useAuthStore } from '@/stores/authStore'
import { useMockProfileStore } from '@/stores/mockProfileStore'
import styles from './ShopPage.module.css'

type PaymentMethodId = 'vietqr' | 'momo' | 'vnpay' | 'zalopay'

interface TopUpPackage {
  id: string
  name: string
  coins: number
  bonusCoins: number
  priceVnd: string
  badge?: string
  accent: string
}

const TOPUP_PACKAGES: readonly TopUpPackage[] = [
  {
    id: 'pkg-100',
    name: 'Gói Khởi đầu',
    coins: 100,
    bonusCoins: 0,
    priceVnd: '19.000đ',
    accent: '#168C78',
  },
  {
    id: 'pkg-200',
    name: 'Gói Tập sự',
    coins: 200,
    bonusCoins: 15,
    priceVnd: '35.000đ',
    accent: '#0E7490',
  },
  {
    id: 'pkg-300',
    name: 'Gói Đồng hành',
    coins: 300,
    bonusCoins: 30,
    priceVnd: '49.000đ',
    accent: '#2B6CB0',
  },
  {
    id: 'pkg-600',
    name: 'Gói Thám hiểm',
    coins: 600,
    bonusCoins: 90,
    priceVnd: '99.000đ',
    badge: 'Phổ biến',
    accent: '#F26B3A',
  },
  {
    id: 'pkg-1200',
    name: 'Gói Rừng Phong',
    coins: 1200,
    bonusCoins: 250,
    priceVnd: '189.000đ',
    accent: '#6B46C1',
  },
  {
    id: 'pkg-2500',
    name: 'Gói Huyền thoại',
    coins: 2500,
    bonusCoins: 650,
    priceVnd: '379.000đ',
    badge: 'Tiết kiệm nhất',
    accent: '#B84317',
  },
]

const PAYMENT_METHODS: ReadonlyArray<{ id: PaymentMethodId; label: string; desc: string }> = [
  { id: 'vietqr', label: 'Chuyển khoản VietQR', desc: 'Quét mã QR ngân hàng 24/7, xác nhận tức thì' },
  { id: 'momo', label: 'Ví MoMo', desc: 'Thanh toán một chạm qua ứng dụng MoMo' },
  { id: 'vnpay', label: 'VNPay / Thẻ ATM', desc: 'Hỗ trợ thẻ nội địa và thẻ quốc tế' },
  { id: 'zalopay', label: 'Ví ZaloPay', desc: 'Liên kết nhanh, không phí giao dịch' },
]

export function ShopTopUpPage() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken.trim()))
  const isMockSession = useMockProfileStore((s) => s.isMockSession)
  const mockStats = useMockProfileStore((s) => s.stats)
  const todayQuery = useTodayQuery()

  const [selectedPkgId, setSelectedPkgId] = useState<string>('pkg-600')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('vietqr')

  const liveToday =
    isAuthenticated && todayQuery.data?.source === 'LIVE' ? todayQuery.data.data : null
  const coinBalance = liveToday
    ? liveToday.gamification.coinBalance
    : isMockSession
      ? mockStats.coinBalance
      : null

  const selectedPkg =
    TOPUP_PACKAGES.find((p) => p.id === selectedPkgId) ?? TOPUP_PACKAGES[3]
  const activeMethod =
    PAYMENT_METHODS.find((m) => m.id === paymentMethod) ?? PAYMENT_METHODS[0]
  const totalReceive = selectedPkg.coins + selectedPkg.bonusCoins

  return (
    <div className={styles.shopWrap} data-testid="shop-topup-page">
      {/* Header */}
      <header className={styles.topUpPageHeader}>
        <div className={styles.topUpHeaderLeft}>
          <Link to="/shop/wallet" className={styles.backWalletLink}>
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Quay lại Ví Xu</span>
          </Link>
          <h1 className={styles.shopTitle}>Nạp Xu vào Ví</h1>
          <p className={styles.shopSubtitle}>
            Chọn gói Xu phù hợp và phương thức thanh toán thuận tiện nhất cho bạn.
          </p>
        </div>

        <div className={styles.coinWalletPill} aria-label="Số dư hiện tại">
          <Coins size={15} aria-hidden="true" />
          <strong>
            {coinBalance !== null ? `${coinBalance.toLocaleString('vi-VN')} Xu` : '— Xu'}
          </strong>
          <span className={styles.coinPillSub}>Hiện có</span>
        </div>
      </header>

      {/* Main 2-Column Checkout Layout */}
      <div className={styles.topUpPageGrid}>
        {/* Left: 6 Packages + Payment Methods */}
        <div className={styles.topUpLeftCol}>
          <section className={styles.catalogSection} aria-label="Chọn gói Xu">
            <div className={styles.sectionHeadRow}>
              <h2 className={styles.sectionTitle}>1. Chọn gói Xu</h2>
              <span className={styles.comingSoonPill}>6 gói · Tặng thêm Xu thưởng</span>
            </div>

            <div className={styles.topUpPagePkgGrid}>
              {TOPUP_PACKAGES.map((pkg) => {
                const active = selectedPkgId === pkg.id
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`${styles.topUpCard} ${active ? styles.topUpCardActive : ''}`.trim()}
                    data-testid={`topup-pkg-${pkg.id}`}
                  >
                    {pkg.badge && <span className={styles.topUpPopularTag}>{pkg.badge}</span>}
                    <div className={styles.topUpCoinRow}>
                      <span
                        className={styles.topUpCoinIcon}
                        style={{ background: `${pkg.accent}1A`, color: pkg.accent }}
                        aria-hidden="true"
                      >
                        <Coins size={19} />
                      </span>
                      <div className={styles.topUpCoinVal}>
                        <strong>{pkg.coins.toLocaleString('vi-VN')} Xu</strong>
                        {pkg.bonusCoins > 0 ? (
                          <span className={styles.topUpBonus}>
                            <Sparkles size={10} aria-hidden="true" /> +{pkg.bonusCoins} Xu tặng
                          </span>
                        ) : (
                          <span className={styles.topUpNameSub}>Gói tiêu chuẩn</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.topUpCardFoot}>
                      <span className={styles.topUpPkgName}>{pkg.name}</span>
                      <strong className={styles.topUpPrice}>{pkg.priceVnd}</strong>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section className={styles.catalogSection} aria-label="Chọn phương thức thanh toán">
            <div className={styles.sectionHeadRow}>
              <h2 className={styles.sectionTitle}>2. Phương thức thanh toán</h2>
            </div>

            <div className={styles.topUpMethodGrid} role="radiogroup" aria-label="Phương thức thanh toán">
              {PAYMENT_METHODS.map((m) => {
                const Icon =
                  m.id === 'vietqr'
                    ? QrCode
                    : m.id === 'vnpay'
                      ? CreditCard
                      : Wallet
                const active = paymentMethod === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`${styles.topUpMethodBtn} ${active ? styles.topUpMethodActive : ''}`.trim()}
                    data-testid={`topup-method-${m.id}`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <div>
                      <strong>{m.label}</strong>
                      <span>{m.desc}</span>
                    </div>
                    {active && (
                      <CheckCircle2
                        size={16}
                        color="#F26B3A"
                        style={{ marginLeft: 'auto', flexShrink: 0 }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        {/* Right: Sticky Order Summary */}
        <aside className={styles.topUpCheckoutCard} aria-label="Tóm tắt đơn hàng">
          <h2 className={styles.sectionTitle}>Tóm tắt đơn hàng</h2>

          <div className={styles.checkoutRowList}>
            <div className={styles.checkoutRow}>
              <span>Gói đã chọn</span>
              <strong>{selectedPkg.name}</strong>
            </div>
            <div className={styles.checkoutRow}>
              <span>Xu cơ bản</span>
              <strong>{selectedPkg.coins.toLocaleString('vi-VN')} Xu</strong>
            </div>
            <div className={styles.checkoutRow}>
              <span>Xu thưởng tặng thêm</span>
              <strong className={styles.txAmountEarned}>
                +{selectedPkg.bonusCoins.toLocaleString('vi-VN')} Xu
              </strong>
            </div>
            <div className={styles.checkoutRow}>
              <span>Phương thức</span>
              <strong>{activeMethod.label}</strong>
            </div>
          </div>

          <div className={styles.checkoutTotalBox}>
            <div>
              <span>Tổng Xu nhận được</span>
              <strong className={styles.checkoutTotalCoins}>
                {totalReceive.toLocaleString('vi-VN')} Xu
              </strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span>Thanh toán</span>
              <strong className={styles.checkoutTotalPrice}>{selectedPkg.priceVnd}</strong>
            </div>
          </div>

          <button
            type="button"
            className={styles.btnDisabledLocked}
            style={{ width: '100%' }}
            disabled
            data-testid="topup-confirm-disabled-btn"
          >
            <Lock size={14} aria-hidden="true" />
            <span>Thanh toán (Chờ Payment API)</span>
          </button>

          <div className={styles.checkoutSafeNote}>
            <ShieldCheck size={15} color="#168C78" aria-hidden="true" style={{ flexShrink: 0 }} />
            <span>
              Giao diện đang ở chế độ xem trước an toàn. Thanh toán thật chỉ kích hoạt sau khi
              Backend hoàn tất tích hợp cổng thanh toán.
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}
