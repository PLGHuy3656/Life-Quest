import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Info,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import {
  gamificationApi,
  type CoinTransactionRecord,
  type CoinTransactionType,
} from '@/services/api/gamificationApi'
import { PREVIEW_WALLET_TRANSACTIONS } from './shopCatalog'
import styles from './ShopPage.module.css'

type WalletFilter = 'ALL' | CoinTransactionType
type WalletViewStatus = 'loading' | 'live' | 'preview' | 'empty' | 'error'

function formatTxDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ShopWalletView({
  coinBalance,
  isLiveBackend,
  isMockSession,
}: {
  coinBalance: number | null
  isLiveBackend: boolean
  isMockSession: boolean
}) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<WalletFilter>('ALL')
  const [status, setStatus] = useState<WalletViewStatus>(isLiveBackend ? 'loading' : 'preview')
  const [liveItems, setLiveItems] = useState<CoinTransactionRecord[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 36)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const fetchTransactions = useCallback(async () => {
    if (!isLiveBackend) {
      setStatus('preview')
      setErrorMsg(null)
      return
    }
    setStatus('loading')
    setErrorMsg(null)
    try {
      const res = await gamificationApi.getCoinTransactions({ limit: 50 })
      const list = Array.isArray(res) ? res : (res.items ?? res.transactions ?? [])
      setLiveItems(list)
      setStatus(list.length === 0 ? 'empty' : 'live')
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Không thể kết nối máy chủ để tải lịch sử giao dịch Xu.',
      )
      setStatus('error')
    }
  }, [isLiveBackend])

  useEffect(() => {
    void fetchTransactions()
  }, [fetchTransactions])

  const sourceItems: readonly CoinTransactionRecord[] = useMemo(
    () =>
      status === 'live' ? liveItems : status === 'preview' ? PREVIEW_WALLET_TRANSACTIONS : [],
    [status, liveItems],
  )

  const filteredItems = useMemo(() => {
    if (filter === 'ALL') return sourceItems
    return sourceItems.filter((tx) => tx.type === filter)
  }, [sourceItems, filter])

  const totalEarned = useMemo(
    () => sourceItems.filter((t) => t.type === 'EARNED').reduce((s, t) => s + Math.abs(t.amount), 0),
    [sourceItems],
  )
  const totalSpent = useMemo(
    () => sourceItems.filter((t) => t.type === 'SPENT').reduce((s, t) => s + Math.abs(t.amount), 0),
    [sourceItems],
  )

  return (
    <div className={styles.walletWrap} data-testid="shop-wallet-view">
      {/* Honest Preview Notice (Compact) */}
      {status === 'preview' && (
        <div className={styles.walletNoticeBanner} role="note" data-testid="wallet-preview-notice">
          <Info size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Đang hiển thị <strong>lịch sử mẫu (Xem trước)</strong>. Đăng nhập tài khoản Backend để
            đồng bộ sổ cái Xu thực tế.
          </span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className={styles.walletFilterRow}>
        <div className={styles.walletFilters} role="group" aria-label="Lọc giao dịch Xu">
          {(
            [
              { id: 'ALL', label: 'Tất cả' },
              { id: 'EARNED', label: 'Nhận Xu' },
              { id: 'SPENT', label: 'Đã đổi' },
              { id: 'REFUNDED', label: 'Hoàn lại' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`${styles.filterChipBtn} ${filter === f.id ? styles.filterChipActive : ''}`.trim()}
              data-testid={`wallet-filter-${f.id.toLowerCase()}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className={styles.walletToolsRight}>
          {isLiveBackend && (
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => void fetchTransactions()}
              data-testid="wallet-refresh-btn"
            >
              <RefreshCw size={14} aria-hidden="true" /> Làm mới
            </button>
          )}
        </div>
      </div>

      {/* States: Loading / Error / Empty / Transaction List */}
      {status === 'loading' ? (
        <div className={styles.walletStateBox} data-testid="wallet-loading-state" aria-busy="true">
          <div className={styles.skeletonBar} />
          <div className={styles.skeletonBar} style={{ width: '72%' }} />
          <p>Đang tải lịch sử giao dịch Xu từ máy chủ...</p>
        </div>
      ) : status === 'error' ? (
        <div className={styles.walletStateBox} role="alert" data-testid="wallet-error-state">
          <AlertTriangle size={24} color="#B42318" aria-hidden="true" />
          <strong>Không thể tải lịch sử Ví Xu</strong>
          <p>{errorMsg}</p>
          <div className={styles.walletErrorActions}>
            <button type="button" className={styles.btnPrimary} onClick={() => void fetchTransactions()}>
              <RefreshCw size={14} aria-hidden="true" /> Thử lại
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setStatus('preview')}
            >
              Xem giao diện mẫu
            </button>
          </div>
        </div>
      ) : status === 'empty' || filteredItems.length === 0 ? (
        <div className={styles.walletStateBox} data-testid="wallet-empty-state">
          <Sparkles size={24} color="#F26B3A" aria-hidden="true" />
          <strong>Chưa có giao dịch Xu nào phù hợp</strong>
          <p>
            {filter === 'ALL'
              ? 'Hoàn thành nhiệm vụ đầu tiên để nhận Xu thưởng vào sổ cái của bạn.'
              : 'Không có giao dịch nào thuộc bộ lọc này. Thử chọn "Tất cả" để xem đầy đủ.'}
          </p>
          {filter !== 'ALL' && (
            <button type="button" className={styles.btnSecondary} onClick={() => setFilter('ALL')}>
              Xem tất cả giao dịch
            </button>
          )}
        </div>
      ) : (
        <ul className={styles.txList} data-testid="wallet-tx-list">
          {filteredItems.map((tx) => {
            const isEarned = tx.type === 'EARNED'
            const isRefunded = tx.type === 'REFUNDED'
            const Icon = isEarned ? ArrowDownLeft : isRefunded ? RotateCcw : ArrowUpRight
            const sign = tx.type === 'SPENT' ? '-' : '+'
            return (
              <li
                key={tx.id}
                className={styles.txRow}
                data-testid={`wallet-tx-${tx.id}`}
                data-tx-type={tx.type}
              >
                <span
                  className={`${styles.txIconCircle} ${
                    isEarned
                      ? styles.txIconEarned
                      : isRefunded
                        ? styles.txIconRefunded
                        : styles.txIconSpent
                  }`.trim()}
                  aria-hidden="true"
                >
                  <Icon size={16} />
                </span>
                <div className={styles.txMeta}>
                  <strong>{tx.reason}</strong>
                  <span>
                    {formatTxDate(tx.createdAt)}
                    {status === 'preview' ? ' · Mẫu xem trước' : ''}
                  </span>
                </div>
                <span
                  className={`${styles.txAmount} ${
                    isEarned
                      ? styles.txAmountEarned
                      : isRefunded
                        ? styles.txAmountRefunded
                        : styles.txAmountSpent
                  }`.trim()}
                >
                  {sign}
                  {Math.abs(tx.amount)} Xu
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {/* Sticky Bottom Frosted-Glass Wallet Balance Dock */}
      <section
        className={`${styles.walletBottomDock} ${isScrolled ? styles.walletDockScrolled : ''}`.trim()}
        aria-label="Số dư Ví Xu"
      >
        <div className={styles.walletBalanceBlock}>
          <span className={styles.walletEyebrow}>
            <Coins size={14} aria-hidden="true" />
            <span>Ví Xu LifeQuest</span>
            <span
              className={
                status === 'live' ? styles.sourceBadgeLive : styles.sourceBadgePreview
              }
              data-testid="wallet-data-source-badge"
            >
              {status === 'live'
                ? 'Dữ liệu máy chủ (LIVE)'
                : isMockSession
                  ? 'Xem trước (Tài khoản Mock)'
                  : 'Chế độ xem trước'}
            </span>
          </span>

          <div className={styles.walletDockBalance} data-testid="wallet-coin-balance">
            {coinBalance !== null ? `${coinBalance.toLocaleString('vi-VN')} Xu` : '— Xu'}
          </div>
        </div>

        <div className={styles.walletHeroRight}>
          <div className={styles.walletStatPills}>
            <div className={styles.walletMiniStat}>
              <span>Đã nhận</span>
              <strong className={styles.txAmountEarned}>+{totalEarned} Xu</strong>
            </div>
            <div className={styles.walletMiniStat}>
              <span>Đã đổi</span>
              <strong className={styles.txAmountSpent}>-{totalSpent} Xu</strong>
            </div>
          </div>

          <button
            type="button"
            className={styles.walletTopUpCta}
            onClick={() => navigate('/shop/topup')}
            data-testid="wallet-open-topup-btn"
          >
            <Plus size={16} aria-hidden="true" />
            <span>Nạp Xu</span>
          </button>
        </div>
      </section>
    </div>
  )
}
