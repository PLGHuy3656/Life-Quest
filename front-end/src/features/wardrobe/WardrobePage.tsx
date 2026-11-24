import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Award,
  Check,
  Coins,
  Info,
  Lock,
  Shirt,
  ShoppingBag,
  Store
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { useCompanion } from '@/features/mascot/CompanionProvider'
import { foxDialogueBus } from '@/features/mascot/dialogue/dialogueBus'
import { useTodayQuery } from '@/hooks/useDashboardData'
import type { CosmeticItemId, CosmeticSlot } from '@/mascot/cosmetics/cosmeticContract'
import { useAuthStore } from '@/stores/authStore'
import { CosmeticPreviewThumb } from './CosmeticPreviewThumb'
import { WardrobeDressingRoom } from './WardrobeDressingRoom'
import {
  DEFAULT_FOX_ACCESSORIES,
  WARDROBE_CATALOG_ITEMS,
  WARDROBE_CATEGORIES,
  WARDROBE_OUTFIT_PRESETS,
  filterCatalogByCategory,
  type WardrobeCategoryId,
  type WardrobeCatalogItem
} from './wardrobeCatalog'
import styles from './WardrobePage.module.css'

type WardrobeMode = 'wardrobe' | 'shop'

export function WardrobePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const companion = useCompanion()
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken.trim()))
  const todayQuery = useTodayQuery()

  const mode: WardrobeMode = location.pathname.startsWith('/wardrobe/shop') ? 'shop' : 'wardrobe'
  const [selectedCategory, setSelectedCategory] = useState<WardrobeCategoryId>('ALL')
  const [selectedShopFilter, setSelectedShopFilter] = useState<'ALL' | 'PREVIEWING' | 'PENDING'>('ALL')
  const openedEmittedRef = useRef(false)

  // Emit neutral WARDROBE_OPENED dialogue once on entry
  useEffect(() => {
    if (openedEmittedRef.current) return
    openedEmittedRef.current = true
    foxDialogueBus.emit({ event: 'WARDROBE_OPENED', dedupeKey: `wardrobe-open-${Date.now()}` })
  }, [])

  // Authoritative player stats (never fabricated)
  const liveToday =
    isAuthenticated && todayQuery.data?.source === 'LIVE' ? todayQuery.data.data : null
  const coinDisplay = liveToday ? String(liveToday.gamification.coinBalance) : '—'
  const levelDisplay = liveToday ? `Lv.${liveToday.gamification.level}` : '—'

  const categoryItems = useMemo(
    () => filterCatalogByCategory(WARDROBE_CATALOG_ITEMS, selectedCategory),
    [selectedCategory]
  )

  const shopItems = useMemo(() => {
    if (selectedShopFilter === 'PREVIEWING') {
      return categoryItems.filter((item) => companion.previewCosmetics[item.slot] === item.id)
    }
    if (selectedShopFilter === 'PENDING') {
      return categoryItems.filter((item) => item.ownershipStatus === 'UNVERIFIED_PENDING_API')
    }
    return categoryItems
  }, [categoryItems, selectedShopFilter, companion.previewCosmetics])

  const categoryCounts = useMemo(() => {
    const counts: Record<WardrobeCategoryId, number> = {
      ALL: WARDROBE_CATALOG_ITEMS.length,
      HAT: 0,
      SCARF: DEFAULT_FOX_ACCESSORIES.filter((a) => a.category === 'SCARF').length,
      BACKPACK: 0,
      OUTFIT: 0,
      ACCESSORY: 0
    }
    for (const item of WARDROBE_CATALOG_ITEMS) {
      counts[item.category] = (counts[item.category] ?? 0) + 1
    }
    return counts
  }, [])

  const handleSwitchMode = (nextMode: WardrobeMode) => {
    const target = nextMode === 'shop' ? '/wardrobe/shop' : '/wardrobe'
    if (location.pathname !== target) {
      navigate(target)
    }
  }

  const handleTogglePreview = (item: WardrobeCatalogItem) => {
    const isPreviewing = companion.previewCosmetics[item.slot] === item.id
    if (isPreviewing) {
      companion.unequipSlot(item.slot)
      foxDialogueBus.emit({ event: 'COSMETIC_REMOVED', taskTitle: item.displayNameVi })
    } else {
      companion.equipCosmetic(item.id)
      foxDialogueBus.emit({ event: 'COSMETIC_PREVIEWED', taskTitle: item.displayNameVi })
    }
  }

  const handleResetPreview = () => {
    companion.restoreEquippedOutfit()
    foxDialogueBus.emit({ event: 'OUTFIT_RESET' })
  }

  const handleApplyPreset = (presetId: (typeof WARDROBE_OUTFIT_PRESETS)[number]['id'], nameVi: string) => {
    companion.applyOutfit(presetId)
    foxDialogueBus.emit({ event: 'COSMETIC_PREVIEWED', taskTitle: `bộ ${nameVi}` })
  }

  const showDefaultScarfCard = selectedCategory === 'SCARF'
  const showDefaultBackpackCard = selectedCategory === 'BACKPACK' && !companion.previewCosmetics.BACK

  return (
    <div className={styles.workspace} data-testid="wardrobe-workspace" data-mode={mode}>
      {/* Main Claude-inspired Split Workspace — starts flush with left sidebar */}
      <div className={styles.splitGrid}>
        {/* LEFT: Large Fox V2 3D Dressing Room (single mounted WebGL canvas) */}
        <WardrobeDressingRoom onResetPreview={handleResetPreview} />

        {/* RIGHT: Wardrobe Inventory OR Cosmetic Shop */}
        <section
          className={styles.catalogPanel}
          aria-label={mode === 'wardrobe' ? 'Danh mục trang phục Fox V2' : 'Cửa hàng trang phục Fox V2'}
        >
          <div className={styles.panelHeader}>
            <div className={styles.titleCluster}>
              <h1 className={styles.heading}>Tủ đồ Fox V2</h1>
              <Chip tone="reward">PREVIEW ONLY</Chip>
            </div>

            <div className={styles.panelHeaderRight}>
              {mode === 'shop' && (
                <div
                  className={styles.statsPill}
                  data-testid="wardrobe-authoritative-stats"
                  data-source={liveToday ? 'LIVE' : 'UNAVAILABLE'}
                  title={
                    liveToday
                      ? `Đồng bộ máy chủ: ${liveToday.gamification.coinBalance} Xu • Cấp ${liveToday.gamification.level}`
                      : 'Đăng nhập để đồng bộ Xu & Cấp độ từ máy chủ'
                  }
                >
                  <span className={styles.statItem}>
                    <Coins size={13} color="#C78A00" aria-hidden="true" />
                    <span data-testid="wardrobe-coin-balance">{coinDisplay}</span>
                  </span>
                  <span className={styles.statDivider} aria-hidden="true" />
                  <span className={styles.statItem}>
                    <Award size={13} color="#168C78" aria-hidden="true" />
                    <span data-testid="wardrobe-player-level">{levelDisplay}</span>
                  </span>
                </div>
              )}

              <nav className={styles.modeSwitch} aria-label="Chuyển đổi Tủ đồ và Cửa hàng">
                <button
                  type="button"
                  className={`${styles.modeBtn} ${mode === 'wardrobe' ? styles.modeBtnActive : ''}`.trim()}
                  aria-current={mode === 'wardrobe' ? 'page' : undefined}
                  onClick={() => handleSwitchMode('wardrobe')}
                  data-testid="wardrobe-tab-btn"
                >
                  <Shirt size={14} aria-hidden="true" />
                  <span>Tủ đồ</span>
                </button>
                <button
                  type="button"
                  className={`${styles.modeBtn} ${mode === 'shop' ? styles.modeBtnActive : ''}`.trim()}
                  aria-current={mode === 'shop' ? 'page' : undefined}
                  onClick={() => handleSwitchMode('shop')}
                  data-testid="shop-tab-btn"
                >
                  <Store size={14} aria-hidden="true" />
                  <span>Cửa hàng</span>
                </button>
              </nav>
            </div>
          </div>
          {mode === 'wardrobe' ? (
            <>
              <div className={styles.noticeStrip} role="note">
                <Info size={15} className={styles.noticeIcon} aria-hidden="true" />
                <span>
                  <strong>Xem trước cục bộ (PREVIEW):</strong> Toàn bộ 18 vật phẩm Gate I H1/H2
                  gắn đúng khớp xương Fox V2. Lưu trang phục lên tài khoản và kho đồ cá nhân đang
                  chờ Backend API.
                </span>
              </div>

              {/* H2 Themed Outfit Presets */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>Bộ trang phục H2</h2>
                  <span className={styles.sectionSub}>Thử nhanh cả bộ chuẩn khớp xương</span>
                </div>
                <div className={styles.presets} aria-label="Bộ trang phục gợi ý">
                  {WARDROBE_OUTFIT_PRESETS.map((preset) => {
                    const isMatchingPreset =
                      Object.keys(preset.slots).length > 0 &&
                      (Object.entries(preset.slots) as [CosmeticSlot, CosmeticItemId][]).every(
                        ([slot, id]) => companion.previewCosmetics[slot] === id
                      )
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`${styles.presetBtn} ${isMatchingPreset ? styles.presetBtnActive : ''}`.trim()}
                        onClick={() => handleApplyPreset(preset.id, preset.nameVi)}
                      >
                        <span className={styles.presetDots} aria-hidden="true">
                          {preset.palette.slice(0, 3).map((hex) => (
                            <span
                              key={hex}
                              className={styles.presetDot}
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </span>
                        <span>{preset.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className={styles.shopBanner} role="note" data-testid="shop-api-boundary-banner">
              <div className={styles.shopBannerHead}>
                <ShoppingBag size={16} aria-hidden="true" />
                <strong>Cửa hàng Trang phục • Chế độ Thử đồ (Chờ Shop &amp; Inventory API)</strong>
              </div>
              <p className={styles.shopBannerText}>
                Bạn có thể nhấn <strong>Thử trên Fox</strong> để xem thực tế 3D từng vật phẩm Gate
                I. Tính năng mua bằng Xu, giá bán và điều kiện mở khóa theo Cấp độ sẽ kích hoạt khi
                Backend hoàn thiện Shop/Inventory API — không trừ Xu hay tạo sở hữu ảo.
              </p>
            </div>
          )}

          {/* Primary Claude Category Tabs */}
          <div className={styles.categoryBarWrap}>
            <div className={styles.slotBar} role="tablist" aria-label="Lọc theo danh mục trang phục">
              {WARDROBE_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`${styles.slotBtn} ${active ? styles.slotBtnActive : ''}`.trim()}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <span>{cat.label}</span>
                    <span className={styles.tabCount}>{categoryCounts[cat.id]}</span>
                  </button>
                )
              })}
            </div>

            {mode === 'shop' && (
              <div className={styles.subFilterRow} aria-label="Lọc trạng thái cửa hàng">
                {(
                  [
                    { id: 'ALL', label: 'Tất cả' },
                    { id: 'PREVIEWING', label: 'Đang thử trên Fox' },
                    { id: 'PENDING', label: 'Chờ mở bán API' }
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`${styles.subFilterPill} ${selectedShopFilter === f.id ? styles.subFilterPillActive : ''}`.trim()}
                    onClick={() => setSelectedShopFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scrollable Catalog / Shop Body inside single-page viewport */}
          <div className={styles.catalogScrollArea}>
          {/* Built-in Fox V2 Default Accessory Notice for SCARF / BACKPACK */}
          {showDefaultScarfCard && (
            <div className={styles.defaultNoticeCard} data-testid="default-scarf-card">
              <CosmeticPreviewThumb
                kind="default_scarf"
                palette={DEFAULT_FOX_ACCESSORIES[0].palette}
                size={56}
              />
              <div className={styles.defaultCardBody}>
                <div className={styles.cardTopRow}>
                  <span className={styles.itemName}>{DEFAULT_FOX_ACCESSORIES[0].displayNameVi}</span>
                  <Chip tone="success">Đang mặc (Mặc định)</Chip>
                </div>
                <p className={styles.itemMeta}>
                  Ô gắn: <code>NECK</code> • {DEFAULT_FOX_ACCESSORIES[0].subtitleVi}. Danh mục Gate
                  I H1/H2 hiện chưa có tệp GLB khăn thay thế nên không tạo vật phẩm giả lập.
                </p>
              </div>
            </div>
          )}

          {showDefaultBackpackCard && mode === 'wardrobe' && (
            <div className={styles.defaultNoticeCard} data-testid="default-backpack-card">
              <CosmeticPreviewThumb
                kind="default_backpack"
                palette={DEFAULT_FOX_ACCESSORIES[1].palette}
                size={56}
              />
              <div className={styles.defaultCardBody}>
                <div className={styles.cardTopRow}>
                  <span className={styles.itemName}>{DEFAULT_FOX_ACCESSORIES[1].displayNameVi}</span>
                  <Chip tone="success">Đang mặc (Mặc định)</Chip>
                </div>
                <p className={styles.itemMeta}>
                  Ô gắn: <code>BACK</code> • {DEFAULT_FOX_ACCESSORIES[1].subtitleVi}
                </p>
              </div>
            </div>
          )}

          {/* Catalog / Shop Grid */}
          {mode === 'wardrobe' ? (
            !showDefaultScarfCard && (
              <div className={styles.catalogGrid} data-testid="wardrobe-catalog-grid">
                {categoryItems.map((item) => {
                  const isPreviewing = companion.previewCosmetics[item.slot] === item.id
                  const isPersisted = companion.persistedCosmetics[item.slot] === item.id
                  return (
                    <article
                      key={item.id}
                      className={`${styles.itemCard} ${isPreviewing ? styles.itemPreviewing : ''}`.trim()}
                      data-testid="wardrobe-item-card"
                      data-item-id={item.id}
                      data-slot={item.slot}
                    >
                      <div className={styles.itemHeader}>
                        <CosmeticPreviewThumb kind={item.iconKind} palette={item.palette} size={52} />
                        <div className={styles.itemInfo}>
                          <div className={styles.itemName}>{item.displayNameVi}</div>
                          <div className={styles.itemTagRow}>
                            <span className={styles.slotBadge}>{item.slot}</span>
                            {item.outfitThemeVi && (
                              <span className={styles.themeBadge}>{item.outfitThemeVi}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={styles.itemMeta}>{item.subtitleVi}</div>

                      <div className={styles.cardFooter}>
                        <Chip tone={isPreviewing ? 'reward' : isPersisted ? 'success' : 'neutral'}>
                          {isPreviewing
                            ? 'Đang xem trước'
                            : isPersisted
                              ? 'Đang mặc'
                              : 'Xem trước'}
                        </Chip>
                        <Button
                          variant={isPreviewing ? 'ghost' : 'primary'}
                          size="sm"
                          onClick={() => handleTogglePreview(item)}
                        >
                          {isPreviewing ? 'Tháo' : 'Thử ngay'}
                        </Button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )
          ) : (
            !showDefaultScarfCard && (
              <>
                {shopItems.length === 0 ? (
                  <div className={styles.emptyShopState}>
                    Không có vật phẩm nào khớp bộ lọc hiện tại. Hãy chọn mục khác hoặc nhấn “Thử
                    trên Fox” để xem trước.
                  </div>
                ) : (
                  <div className={styles.catalogGrid} data-testid="shop-catalog-grid">
                    {shopItems.map((item) => {
                      const isPreviewing = companion.previewCosmetics[item.slot] === item.id
                      return (
                        <article
                          key={item.id}
                          className={`${styles.itemCard} ${styles.shopCard} ${isPreviewing ? styles.itemPreviewing : ''}`.trim()}
                          data-testid="shop-item-card"
                          data-item-id={item.id}
                          data-slot={item.slot}
                        >
                          <div className={styles.itemHeader}>
                            <CosmeticPreviewThumb
                              kind={item.iconKind}
                              palette={item.palette}
                              size={52}
                            />
                            <div className={styles.itemInfo}>
                              <div className={styles.itemName}>{item.displayNameVi}</div>
                              <div className={styles.itemTagRow}>
                                <span className={styles.slotBadge}>{item.slot}</span>
                                {item.outfitThemeVi && (
                                  <span className={styles.themeBadge}>{item.outfitThemeVi}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className={styles.shopRequirementRow}>
                            <span className={styles.reqBadge}>
                              <Coins size={12} aria-hidden="true" />
                              <span>Giá: Chờ Shop API</span>
                            </span>
                            <span className={styles.reqBadge}>
                              <Lock size={12} aria-hidden="true" />
                              <span>Mở khóa: Chờ API</span>
                            </span>
                          </div>

                          <div className={styles.shopActions}>
                            <Button
                              variant={isPreviewing ? 'subtle' : 'primary'}
                              size="sm"
                              onClick={() => handleTogglePreview(item)}
                            >
                              {isPreviewing ? (
                                <>
                                  <Check size={13} aria-hidden="true" />
                                  <span>Bỏ thử</span>
                                </>
                              ) : (
                                <span>Thử trên Fox</span>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              title="Chức năng mua bằng Xu đang chờ Backend Shop & Inventory API"
                              data-testid={`shop-buy-disabled-${item.id}`}
                            >
                              <Lock size={12} aria-hidden="true" />
                              <span>Mua (Chờ API)</span>
                            </Button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </>
            )
          )}
          </div>
        </section>
      </div>
    </div>
  )
}
