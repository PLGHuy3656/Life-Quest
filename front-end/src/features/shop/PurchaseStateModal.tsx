import { useEffect, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  Lock,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react'
import { DecorativeLabel } from '@/features/journal/JournalPrimitives'
import type { PurchaseUiState, ShopItemOwnership } from './shopCatalog'
import styles from './ShopPage.module.css'

export interface PurchasePreviewTarget {
  id: string
  name: string
  categoryLabel: string
  description: string
  priceCoin: number
  requiredLevel: number
  ownership: ShopItemOwnership
  isDecorativeTitle?: boolean
  visual?: ReactNode
}

const STATE_LABELS: Record<PurchaseUiState, string> = {
  preview: 'Xem trước vật phẩm',
  confirm: 'Xác nhận đổi Xu',
  insufficient_coins: 'Chưa đủ Xu',
  level_locked: 'Chưa đủ Cấp độ',
  owned: 'Đã sở hữu',
  equipped: 'Đang trang bị',
  success_simulated: 'Đổi thành công (Mô phỏng)',
  failed: 'Giao dịch thất bại',
  api_unavailable: 'Shop API chưa mở',
}

function computeNaturalState(
  item: PurchasePreviewTarget,
  coinBalance: number | null,
  playerLevel: number | null,
): PurchaseUiState {
  if (item.ownership === 'EQUIPPED') return 'equipped'
  if (item.ownership === 'OWNED') return 'owned'
  if (playerLevel !== null && playerLevel < item.requiredLevel) return 'level_locked'
  if (coinBalance !== null && coinBalance < item.priceCoin) return 'insufficient_coins'
  return 'confirm'
}

export function PurchaseStateModal({
  open,
  item,
  coinBalance,
  playerLevel,
  initialState,
  onClose,
}: {
  open: boolean
  item: PurchasePreviewTarget | null
  coinBalance: number | null
  playerLevel: number | null
  initialState?: PurchaseUiState
  onClose: () => void
}) {
  const [viewState, setViewState] = useState<PurchaseUiState>('preview')
  const [showStateInspector, setShowStateInspector] = useState(false)

  useEffect(() => {
    if (!open || !item) return
    setViewState(initialState ?? computeNaturalState(item, coinBalance, playerLevel))
    setShowStateInspector(false)
  }, [open, item, coinBalance, playerLevel, initialState])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !item) return null

  const coinsMissing =
    coinBalance !== null ? Math.max(0, item.priceCoin - coinBalance) : item.priceCoin

  return (
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-state-modal-title"
      data-testid="shop-purchase-modal"
      data-purchase-state={viewState}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.modalCard}>
        <div className={styles.modalHead}>
          <span className={styles.modalHeadSpacer} aria-hidden="true" />
          <h2 id="purchase-state-modal-title" className={styles.modalTitle}>
            {STATE_LABELS[viewState]}
          </h2>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Đóng hộp thoại vật phẩm"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Item Preview Stage */}
          <div className={styles.modalPreviewBox}>
            {item.visual && <div className={styles.modalVisualSlot}>{item.visual}</div>}
            <div className={styles.modalItemInfo}>
              <div className={styles.modalItemMetaRow}>
                <span className={styles.catMiniTag}>{item.categoryLabel}</span>
                {item.isDecorativeTitle && <DecorativeLabel />}
              </div>
              <strong className={styles.modalItemName}>{item.name}</strong>
              <p className={styles.modalItemDesc}>{item.description}</p>
              <div className={styles.modalPriceRow}>
                <span className={styles.priceBadge}>
                  <Coins size={13} aria-hidden="true" /> {item.priceCoin} Xu
                </span>
                <span className={styles.levelReqBadge}>Yêu cầu Cấp {item.requiredLevel}</span>
              </div>
            </div>
          </div>

          {/* State-Specific Honest Feedback Banner */}
          {viewState === 'preview' && (
            <div className={styles.stateBannerInfo}>
              <Sparkles size={16} aria-hidden="true" />
              <div>
                <strong>Chế độ xem trước vật phẩm</strong>
                <p>Bạn có thể xem trước giao diện tự do. Không trừ Xu và không ghi đè sở hữu thật.</p>
              </div>
            </div>
          )}

          {viewState === 'confirm' && (
            <div className={styles.stateBannerWarn} data-testid="purchase-state-confirm">
              <Lock size={16} aria-hidden="true" />
              <div>
                <strong>Tạm khóa thực thi mua thật (Chờ Backend R1–R3)</strong>
                <p>
                  Số dư hiện tại: <strong>{coinBalance ?? '—'} Xu</strong> · Giá dự kiến:{' '}
                  <strong>{item.priceCoin} Xu</strong>. Nút xác nhận mua thật đang được khóa an toàn
                  cho tới khi Backend hoàn tất bảo vệ đồng thời và idempotency.
                </p>
              </div>
            </div>
          )}

          {viewState === 'insufficient_coins' && (
            <div className={styles.stateBannerDanger} data-testid="purchase-state-insufficient">
              <Coins size={16} aria-hidden="true" />
              <div>
                <strong>Chưa đủ Xu để đổi vật phẩm này</strong>
                <p>
                  Cần thêm <strong>{coinsMissing} Xu</strong>. Hoàn thành nhiệm vụ hằng ngày để tích
                  lũy Xu miễn phí (không nạp tiền thật).
                </p>
              </div>
            </div>
          )}

          {viewState === 'level_locked' && (
            <div className={styles.stateBannerWarn} data-testid="purchase-state-level-locked">
              <Lock size={16} aria-hidden="true" />
              <div>
                <strong>Chưa đạt Cấp độ yêu cầu (Cấp {item.requiredLevel})</strong>
                <p>
                  Cấp độ hiện tại của bạn: <strong>Cấp {playerLevel ?? 1}</strong>. Tiếp tục hoàn
                  thành Quest để mở khóa vật phẩm này.
                </p>
              </div>
            </div>
          )}

          {viewState === 'owned' && (
            <div className={styles.stateBannerSuccess} data-testid="purchase-state-owned">
              <CheckCircle2 size={16} aria-hidden="true" />
              <div>
                <strong>Đã sở hữu (Xem trước)</strong>
                <p>
                  Vật phẩm đã nằm trong bộ sưu tập xem trước. Việc lưu trang bị lên máy chủ sẽ mở
                  khi Inventory API sẵn sàng.
                </p>
              </div>
            </div>
          )}

          {viewState === 'equipped' && (
            <div className={styles.stateBannerSuccess} data-testid="purchase-state-equipped">
              <CheckCircle2 size={16} aria-hidden="true" />
              <div>
                <strong>Đang trang bị (Xem trước)</strong>
                <p>Vật phẩm này đang hiển thị trên bản xem trước của bạn.</p>
              </div>
            </div>
          )}

          {viewState === 'success_simulated' && (
            <div className={styles.stateBannerSuccess} data-testid="purchase-state-simulated-success">
              <Sparkles size={16} aria-hidden="true" />
              <div>
                <strong>Đổi vật phẩm thành công · TRẠNG THÁI MÔ PHỎNG UI</strong>
                <p>
                  Đây chỉ là màn hình minh họa trạng thái thành công. Không có Xu thật nào bị trừ và
                  không lưu quyền sở hữu giả lên máy chủ.
                </p>
              </div>
            </div>
          )}

          {viewState === 'failed' && (
            <div className={styles.stateBannerDanger} data-testid="purchase-state-failed">
              <AlertTriangle size={16} aria-hidden="true" />
              <div>
                <strong>Giao dịch không thành công</strong>
                <p>
                  Không thể hoàn tất yêu cầu lúc này. Số dư Xu của bạn hoàn toàn nguyên vẹn — vui
                  lòng thử lại sau.
                </p>
              </div>
            </div>
          )}

          {viewState === 'api_unavailable' && (
            <div className={styles.stateBannerWarn} data-testid="purchase-state-api-unavailable">
              <ShieldAlert size={16} aria-hidden="true" />
              <div>
                <strong>Shop Purchase API tạm thời chưa sẵn sàng</strong>
                <p>
                  Cửa hàng đang mở ở chế độ xem trước an toàn trong khi Backend xử lý các điều kiện
                  bảo vệ số dư R1–R3.
                </p>
              </div>
            </div>
          )}

          {/* Isolated QA / Design State Preview Switcher */}
          <div className={styles.stateInspectorWrap}>
            <button
              type="button"
              className={styles.stateInspectorToggle}
              onClick={() => setShowStateInspector((v) => !v)}
              aria-expanded={showStateInspector}
              data-testid="toggle-purchase-state-inspector"
            >
              {showStateInspector
                ? 'Ẩn bộ xem trước trạng thái UI'
                : 'Xem thử các trạng thái giao dịch (Mô phỏng UI)'}
            </button>

            {showStateInspector && (
              <div
                className={styles.stateInspectorGrid}
                role="group"
                aria-label="Mô phỏng trạng thái giao diện mua hàng"
              >
                {(Object.keys(STATE_LABELS) as PurchaseUiState[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    aria-pressed={viewState === st}
                    onClick={() => setViewState(st)}
                    className={`${styles.stateChipBtn} ${viewState === st ? styles.stateChipBtnActive : ''}`.trim()}
                    data-testid={`simulate-state-${st}`}
                  >
                    {STATE_LABELS[st]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFoot}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Đóng
          </button>
          <button
            type="button"
            className={styles.btnDisabledLocked}
            disabled
            data-testid="shop-real-purchase-disabled-btn"
            title="Mua thật đang khóa an toàn chờ Backend xử lý R1–R3"
          >
            <Lock size={14} aria-hidden="true" />
            <span>Mua thật đang khóa (Chờ API)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
