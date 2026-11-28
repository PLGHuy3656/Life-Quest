import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Archive,
  Award,
  Check,
  Coins,
  Heart,
  Lock,
  Search,
  Shirt,
  Sparkles,
  Store,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { useCompanion } from '@/features/mascot/CompanionProvider'
import { foxDialogueBus } from '@/features/mascot/dialogue/dialogueBus'
import { useTodayQuery } from '@/hooks/useDashboardData'
import type { CosmeticItemId, CosmeticSlot } from '@/mascot/cosmetics/cosmeticContract'
import { useAuthStore } from '@/stores/authStore'
import { useMockProfileStore } from '@/stores/mockProfileStore'
import { PurchaseStateModal, type PurchasePreviewTarget } from '@/features/shop/PurchaseStateModal'
import { getFoxShopMeta } from '@/features/shop/shopCatalog'
import { CosmeticPreviewThumb } from './CosmeticPreviewThumb'
import { ClosetBotanicalDecor, HangingOutfitSvg, MiniHangerHook } from './ClosetGarmentVisuals'
import { WardrobeDressingRoom } from './WardrobeDressingRoom'
import {
  DEFAULT_FOX_ACCESSORIES,
  WARDROBE_CATALOG_ITEMS,
  WARDROBE_CATEGORIES,
  WARDROBE_OUTFIT_PRESETS,
  filterCatalogByCategory,
  getCatalogItemById,
  type WardrobeCategoryId,
  type WardrobeCatalogItem
} from './wardrobeCatalog'
import styles from './WardrobePage.module.css'

type WardrobeMode = 'wardrobe' | 'shop'
type ClosetSectionTab = 'drawers' | 'hanging'

export function WardrobePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const companion = useCompanion()
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken.trim()))
  const isMockSession = useMockProfileStore((s) => s.isMockSession)
  const mockStats = useMockProfileStore((s) => s.stats)
  const todayQuery = useTodayQuery()

  const mode: WardrobeMode = location.pathname.startsWith('/wardrobe/shop') ? 'shop' : 'wardrobe'
  const [closetTab, setClosetTab] = useState<ClosetSectionTab>('drawers')
  const [selectedCategory, setSelectedCategory] = useState<WardrobeCategoryId>('ALL')
  const [selectedShopFilter, setSelectedShopFilter] = useState<'ALL' | 'PREVIEWING' | 'WISHLIST'>('ALL')
  const [shopSearch, setShopSearch] = useState('')
  const [wishlistIds, setWishlistIds] = useState<Set<CosmeticItemId>>(() => new Set())
  const [inspectTarget, setInspectTarget] = useState<PurchasePreviewTarget | null>(null)
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
    const q = shopSearch.trim().toLowerCase()
    let list = categoryItems
    if (selectedShopFilter === 'PREVIEWING') {
      list = list.filter((item) => companion.previewCosmetics[item.slot] === item.id)
    } else if (selectedShopFilter === 'WISHLIST') {
      list = list.filter((item) => wishlistIds.has(item.id))
    }
    if (q) {
      list = list.filter(
        (item) =>
          item.displayNameVi.toLowerCase().includes(q) ||
          (item.outfitThemeVi?.toLowerCase().includes(q) ?? false)
      )
    }
    return list
  }, [categoryItems, selectedShopFilter, companion.previewCosmetics, wishlistIds, shopSearch])

  const toggleWishlist = (id: CosmeticItemId) => {
    setWishlistIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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

  const handleApplyPreset = (presetId: (typeof WARDROBE_OUTFIT_PRESETS)[number]['id'], nameVi: string) => {
    companion.applyOutfit(presetId)
    foxDialogueBus.emit({ event: 'COSMETIC_PREVIEWED', taskTitle: `bộ ${nameVi}` })
  }

  const showDefaultScarfCard = selectedCategory === 'SCARF'
  const showDefaultBackpackCard = selectedCategory === 'BACKPACK' && !companion.previewCosmetics.BACK
  const activeCategoryDef = useMemo(
    () => WARDROBE_CATEGORIES.find((c) => c.id === selectedCategory) ?? WARDROBE_CATEGORIES[0],
    [selectedCategory]
  )

  // Up to 3 real item thumbnails per wooden drawer so hovering a drawer pops its contents into view
  const drawerPeekItems = useMemo(() => {
    const map: Record<
      WardrobeCategoryId,
      Array<{ key: string; kind: Parameters<typeof CosmeticPreviewThumb>[0]['kind']; palette: readonly [string, string, string] }>
    > = {
      ALL: [],
      HAT: [],
      SCARF: [
        {
          key: 'default_scarf',
          kind: 'default_scarf',
          palette: DEFAULT_FOX_ACCESSORIES[0].palette
        }
      ],
      BACKPACK: [],
      OUTFIT: [],
      ACCESSORY: []
    }
    for (const cat of WARDROBE_CATEGORIES) {
      if (cat.id === 'SCARF') continue
      const items = filterCatalogByCategory(WARDROBE_CATALOG_ITEMS, cat.id).slice(0, 3)
      map[cat.id] = items.map((it) => ({
        key: it.id,
        kind: it.iconKind,
        palette: it.palette
      }))
    }
    return map
  }, [])

  return (
    <div className={styles.workspace} data-testid="wardrobe-workspace" data-mode={mode}>
      {/* Main Claude-inspired Split Workspace — starts flush with left sidebar */}
      <div className={styles.splitGrid}>
        {/* LEFT: Large Fox V2 3D Dressing Room + Tủ đồ / Cửa hàng switch */}
        <WardrobeDressingRoom mode={mode} onSwitchMode={handleSwitchMode} />

        {/* RIGHT: Interactive White Closet (wardrobe) OR Cozy Fox Boutique (shop) */}
        <section
          className={`${styles.catalogPanel} ${mode === 'wardrobe' ? styles.closetCabinet : styles.shopBoutique}`.trim()}
          aria-label={mode === 'wardrobe' ? 'Tủ đồ trang phục Fox V2' : 'Cửa hàng trang phục Fox V2'}
          data-testid={mode === 'wardrobe' ? 'wooden-closet-cabinet' : 'shop-catalog-panel'}
        >
          {mode === 'wardrobe' ? (
            <ClosetBotanicalDecor
              vineLeftClass={styles.closetVineLeft}
              vineRightClass={styles.closetVineRight}
              leafClass={styles.floatingMapleLeaf}
            />
          ) : (
            <div className={styles.shopAwning} aria-hidden="true" />
          )}
          <div className={`${styles.panelHeader} ${mode === 'wardrobe' ? styles.closetCrown : ''}`.trim()}>
            <div className={styles.titleCluster}>
              <h1 className={styles.heading}>
                {mode === 'wardrobe' ? 'Tủ đồ Fox V2' : 'Cửa hàng Trang phục'}
              </h1>
              <Chip tone="reward">PREVIEW ONLY</Chip>
            </div>

            <div className={styles.panelHeaderRight}>
              {mode === 'wardrobe' ? (
                <div
                  className={styles.modeSwitch}
                  role="tablist"
                  aria-label="Chọn ngăn tủ đồ"
                  data-testid="closet-section-tabs"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={closetTab === 'drawers'}
                    className={`${styles.modeBtn} ${closetTab === 'drawers' ? styles.modeBtnActive : ''}`.trim()}
                    onClick={() => setClosetTab('drawers')}
                    data-testid="closet-tab-drawers"
                  >
                    <Archive size={14} aria-hidden="true" />
                    <span>Ngăn kéo</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={closetTab === 'hanging'}
                    className={`${styles.modeBtn} ${closetTab === 'hanging' ? styles.modeBtnActive : ''}`.trim()}
                    onClick={() => setClosetTab('hanging')}
                    data-testid="closet-tab-hanging"
                  >
                    <Shirt size={14} aria-hidden="true" />
                    <span>Hộc tủ</span>
                  </button>
                </div>
              ) : (
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
            </div>
          </div>

          {mode === 'wardrobe' ? (
            <div className={styles.closetBody}>
              {closetTab === 'hanging' ? (
                /* TAB "HỘC TỦ": Bright Scandinavian Hanging Niche + Brass Rod + 6 Realistic Hanging Outfits */
                <div className={styles.hangingTabBody} data-testid="closet-hanging-panel">
                  <div className={styles.closetRackSection} data-testid="closet-hanging-rack">
                    <div className={styles.rackInterior}>
                      <div className={styles.closetRod} aria-hidden="true">
                        <span className={styles.rodBracketLeft} />
                        <span className={styles.rodBracketRight} />
                      </div>

                      <div className={styles.hangerRow} aria-label="Bộ trang phục treo trên thanh">
                        {WARDROBE_OUTFIT_PRESETS.map((preset) => {
                          const isMatchingPreset =
                            Object.keys(preset.slots).length > 0 &&
                            (Object.entries(preset.slots) as [CosmeticSlot, CosmeticItemId][]).every(
                              ([slot, id]) => companion.previewCosmetics[slot] === id
                            )
                          const pieceNames = (Object.values(preset.slots) as CosmeticItemId[])
                            .map((id) => getCatalogItemById(id)?.displayNameVi)
                            .filter((n): n is string => Boolean(n))

                          return (
                            <button
                              key={preset.id}
                              type="button"
                              className={`${styles.hangerItem} ${isMatchingPreset ? styles.hangerItemActive : ''}`.trim()}
                              onClick={() => handleApplyPreset(preset.id, preset.nameVi)}
                              data-testid={`closet-hanger-${preset.id}`}
                            >
                              <span className={styles.srOnly}>{preset.name}</span>
                              <span className={styles.garmentStage} aria-hidden="true">
                                <HangingOutfitSvg
                                  outfitId={preset.id}
                                  className={styles.hangingGarmentSvg}
                                />
                              </span>
                              <span className={styles.hangerInfoPopover} aria-hidden="true">
                                <span className={styles.popoverHeader}>
                                  <span className={styles.popoverTitle}>Bộ {preset.nameVi}</span>
                                  <span className={styles.popoverBadge}>{preset.itemCount} món</span>
                                </span>
                                <span className={styles.popoverPieces}>
                                  {pieceNames.join(' • ')}
                                </span>
                                <span className={styles.popoverCta}>
                                  {isMatchingPreset ? 'Đang mặc thử trên Fox' : 'Bấm để mặc cả bộ'}
                                </span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Lower clean shelf listing the 6 complete outfit sets */}
                  <div className={styles.openDrawerTray}>
                    <div className={styles.catalogScrollArea}>
                      <div className={styles.outfitShelfGrid}>
                        {WARDROBE_OUTFIT_PRESETS.map((preset) => {
                          const isMatchingPreset =
                            Object.keys(preset.slots).length > 0 &&
                            (Object.entries(preset.slots) as [CosmeticSlot, CosmeticItemId][]).every(
                              ([slot, id]) => companion.previewCosmetics[slot] === id
                            )
                          const pieceNames = (Object.values(preset.slots) as CosmeticItemId[])
                            .map((id) => getCatalogItemById(id)?.displayNameVi)
                            .filter((n): n is string => Boolean(n))
                          return (
                            <article
                              key={preset.id}
                              className={`${styles.itemCard} ${styles.drawerItemSlot} ${isMatchingPreset ? styles.itemPreviewing : ''}`.trim()}
                            >
                              <div className={styles.itemHeader}>
                                <span className={styles.presetDots} aria-hidden="true">
                                  {preset.palette.slice(0, 3).map((hex) => (
                                    <span
                                      key={hex}
                                      className={styles.presetDot}
                                      style={{ backgroundColor: hex }}
                                    />
                                  ))}
                                </span>
                                <div className={styles.itemInfo}>
                                  <div className={styles.itemName}>Bộ {preset.nameVi}</div>
                                </div>
                                <Chip tone={isMatchingPreset ? 'reward' : 'neutral'}>
                                  {preset.itemCount} món
                                </Chip>
                              </div>
                              <div className={styles.itemMeta}>{pieceNames.join(' • ')}</div>
                              <div className={styles.cardFooter}>
                                <span className={styles.slotBadge}>{preset.name}</span>
                                <Button
                                  variant={isMatchingPreset ? 'subtle' : 'primary'}
                                  size="sm"
                                  onClick={() => handleApplyPreset(preset.id, preset.nameVi)}
                                >
                                  {isMatchingPreset ? 'Đang mặc bộ này' : 'Mặc cả bộ'}
                                </Button>
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* TAB "NGĂN KÉO": 6 Pull-Out Wooden Drawers + Clean Opened Drawer Interior */
                <div className={styles.drawersTabBody} data-testid="closet-drawers-panel">
                  <div className={styles.drawerSection}>
                    <div
                      className={styles.drawerGrid}
                      role="tablist"
                      aria-label="Hộc tủ phân loại trang phục"
                      data-testid="closet-drawer-bank"
                    >
                      {WARDROBE_CATEGORIES.map((cat) => {
                        const active = selectedCategory === cat.id
                        const peekItems = drawerPeekItems[cat.id]
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            className={`${styles.drawerBtn} ${active ? styles.drawerBtnOpen : ''}`.trim()}
                            onClick={() => setSelectedCategory(cat.id)}
                            data-testid={`closet-drawer-${cat.id.toLowerCase()}`}
                          >
                            <span className={styles.drawerCavity} aria-hidden="true">
                              <span className={styles.drawerPeekItems}>
                                {peekItems.map((peek) => (
                                  <span key={peek.key} className={styles.peekThumbWrap}>
                                    <CosmeticPreviewThumb
                                      kind={peek.kind}
                                      palette={peek.palette}
                                      size={26}
                                    />
                                  </span>
                                ))}
                              </span>
                            </span>

                            <span className={styles.drawerFront}>
                              <span className={styles.drawerBrassPull} aria-hidden="true" />
                              <span className={styles.drawerFaceRow}>
                                <span className={styles.drawerLabel}>{cat.label}</span>
                                <span className={styles.drawerCount}>{categoryCounts[cat.id]}</span>
                              </span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Clean Opened Drawer Tray */}
                  <div
                    className={styles.openDrawerTray}
                    role="tabpanel"
                    aria-label={`Nội dung hộc tủ ${activeCategoryDef.label}`}
                    data-testid="closet-open-drawer-tray"
                  >
                    <div className={styles.catalogScrollArea}>
                      {showDefaultScarfCard && (
                        <div className={styles.defaultNoticeCard} data-testid="default-scarf-card">
                          <CosmeticPreviewThumb
                            kind="default_scarf"
                            palette={DEFAULT_FOX_ACCESSORIES[0].palette}
                            size={56}
                          />
                          <div className={styles.defaultCardBody}>
                            <div className={styles.cardTopRow}>
                              <span className={styles.itemName}>
                                {DEFAULT_FOX_ACCESSORIES[0].displayNameVi}
                              </span>
                              <Chip tone="success">Đang mặc</Chip>
                            </div>
                            <p className={styles.itemMeta}>
                              Khăn quàng nguyên bản của Fox V2 (chưa có khăn thay thế trong bộ H1/H2).
                            </p>
                          </div>
                        </div>
                      )}

                      {showDefaultBackpackCard && (
                        <div className={styles.defaultNoticeCard} data-testid="default-backpack-card">
                          <CosmeticPreviewThumb
                            kind="default_backpack"
                            palette={DEFAULT_FOX_ACCESSORIES[1].palette}
                            size={56}
                          />
                          <div className={styles.defaultCardBody}>
                            <div className={styles.cardTopRow}>
                              <span className={styles.itemName}>
                                {DEFAULT_FOX_ACCESSORIES[1].displayNameVi}
                              </span>
                              <Chip tone="success">Đang mặc</Chip>
                            </div>
                            <p className={styles.itemMeta}>
                              Balo nguyên bản của Fox V2 • Tự ẩn khi bạn chọn balo khác.
                            </p>
                          </div>
                        </div>
                      )}

                      {!showDefaultScarfCard && (
                        <div className={styles.catalogGrid} data-testid="wardrobe-catalog-grid">
                          {categoryItems.map((item) => {
                            const isPreviewing = companion.previewCosmetics[item.slot] === item.id
                            const isPersisted = companion.persistedCosmetics[item.slot] === item.id
                            const isHangingItem =
                              item.category === 'OUTFIT' || item.category === 'BACKPACK'
                            const cleanDesc = item.subtitleVi.includes('•')
                              ? item.subtitleVi.split('•').slice(1).join('•').trim()
                              : item.subtitleVi

                            return (
                              <article
                                key={item.id}
                                className={`${styles.itemCard} ${styles.drawerItemSlot} ${isPreviewing ? styles.itemPreviewing : ''}`.trim()}
                                data-testid="wardrobe-item-card"
                                data-item-id={item.id}
                                data-slot={item.slot}
                              >
                                {isHangingItem && <MiniHangerHook className={styles.miniHanger} />}
                                <div className={styles.itemHeader}>
                                  <CosmeticPreviewThumb
                                    kind={item.iconKind}
                                    palette={item.palette}
                                    size={54}
                                  />
                                  <div className={styles.itemInfo}>
                                    <div className={styles.itemName}>{item.displayNameVi}</div>
                                    <div className={styles.itemMeta}>{cleanDesc}</div>
                                  </div>
                                </div>

                                <div className={styles.cardFooter}>
                                  <div className={styles.itemTagRow}>
                                    {item.outfitThemeVi && (
                                      <span className={styles.themeBadge}>
                                        {item.outfitThemeVi}
                                      </span>
                                    )}
                                    {isPreviewing && <Chip tone="reward">Đang thử</Chip>}
                                    {!isPreviewing && isPersisted && (
                                      <Chip tone="success">Đang mặc</Chip>
                                    )}
                                  </div>
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
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Compact single toolbar: Category tabs + Quick Search + Quick toggles */}
              <div className={styles.shopToolbar}>
                <div className={styles.shopToolbarTop}>
                  <div className={styles.shopSearchWrap}>
                    <Search size={14} className={styles.shopSearchIcon} aria-hidden="true" />
                    <input
                      type="search"
                      className={styles.shopSearchInput}
                      value={shopSearch}
                      onChange={(e) => setShopSearch(e.target.value)}
                      placeholder="Tìm nhanh mũ, áo, balo, phụ kiện..."
                      aria-label="Tìm kiếm vật phẩm trong cửa hàng"
                    />
                    {shopSearch && (
                      <button
                        type="button"
                        className={styles.shopSearchClear}
                        onClick={() => setShopSearch('')}
                        aria-label="Xóa từ khóa tìm kiếm"
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className={styles.shopQuickToggles} aria-label="Lọc nhanh cửa hàng">
                    <button
                      type="button"
                      className={`${styles.quickToggleBtn} ${selectedShopFilter === 'PREVIEWING' ? styles.quickToggleActive : ''}`.trim()}
                      onClick={() =>
                        setSelectedShopFilter((cur) => (cur === 'PREVIEWING' ? 'ALL' : 'PREVIEWING'))
                      }
                      aria-pressed={selectedShopFilter === 'PREVIEWING'}
                    >
                      <Sparkles size={12} aria-hidden="true" />
                      <span>Đang thử</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.quickToggleBtn} ${selectedShopFilter === 'WISHLIST' ? styles.quickToggleActive : ''}`.trim()}
                      onClick={() =>
                        setSelectedShopFilter((cur) => (cur === 'WISHLIST' ? 'ALL' : 'WISHLIST'))
                      }
                      aria-pressed={selectedShopFilter === 'WISHLIST'}
                    >
                      <Heart
                        size={12}
                        fill={selectedShopFilter === 'WISHLIST' ? 'currentColor' : 'none'}
                        aria-hidden="true"
                      />
                      <span>
                        {wishlistIds.size > 0 ? `Yêu thích (${wishlistIds.size})` : 'Yêu thích'}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={styles.quickToggleBtn}
                      onClick={() => navigate('/shop')}
                      aria-label="Mở Tiệm LifeQuest"
                      title="Mở Tiệm LifeQuest & Ví Xu (Thử 3D miễn phí • Mua chờ Shop API)"
                      data-testid="wardrobe-open-shop-hub-btn"
                    >
                      <Store size={14} aria-hidden="true" />
                      <span className="sr-only" data-testid="shop-api-boundary-banner">
                        Thử 3D miễn phí • Mua chờ Shop API
                      </span>
                    </button>
                  </div>
                </div>

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
              </div>

              {/* Spacious 3-Column Boutique Display Grid (click image or button to try on Fox) */}
              <div className={styles.catalogScrollArea}>
                {showDefaultScarfCard && (
                  <div className={styles.defaultNoticeCard} data-testid="default-scarf-card">
                    <CosmeticPreviewThumb
                      kind="default_scarf"
                      palette={DEFAULT_FOX_ACCESSORIES[0].palette}
                      size={56}
                    />
                    <div className={styles.defaultCardBody}>
                      <div className={styles.cardTopRow}>
                        <span className={styles.itemName}>
                          {DEFAULT_FOX_ACCESSORIES[0].displayNameVi}
                        </span>
                        <Chip tone="success">Đang mặc</Chip>
                      </div>
                      <p className={styles.itemMeta}>
                        Khăn quàng nguyên bản của Fox V2 (chưa có mẫu khăn mở bán trong bộ H1/H2).
                      </p>
                    </div>
                  </div>
                )}

                {!showDefaultScarfCard && (
                  <>
                    {shopItems.length === 0 ? (
                      <div className={styles.emptyShopState}>
                        {selectedShopFilter === 'WISHLIST'
                          ? 'Chưa có món nào trong danh sách yêu thích. Nhấn biểu tượng trái tim để lưu món bạn thích!'
                          : 'Không tìm thấy vật phẩm phù hợp. Thử xóa bộ lọc hoặc tìm từ khóa khác.'}
                      </div>
                    ) : (
                      <div className={styles.shopDisplayGrid} data-testid="shop-catalog-grid">
                        {shopItems.map((item) => {
                          const isPreviewing = companion.previewCosmetics[item.slot] === item.id
                          const isLiked = wishlistIds.has(item.id)
                          const meta = getFoxShopMeta(item.id)
                          const effectiveCoins = liveToday
                            ? liveToday.gamification.coinBalance
                            : isMockSession
                              ? mockStats.coinBalance
                              : null
                          const effectiveLevel = liveToday
                            ? liveToday.gamification.level
                            : isMockSession
                              ? mockStats.level
                              : null
                          const lowCoins =
                            meta.previewOwnership === 'AVAILABLE' &&
                            effectiveCoins !== null &&
                            effectiveCoins < meta.priceCoin
                          const levelLocked =
                            meta.previewOwnership === 'AVAILABLE' &&
                            effectiveLevel !== null &&
                            effectiveLevel < meta.requiredLevel
                          return (
                            <article
                              key={item.id}
                              className={`${styles.boutiqueCard} ${isPreviewing ? styles.itemPreviewing : ''}`.trim()}
                              data-testid="shop-item-card"
                              data-item-id={item.id}
                              data-slot={item.slot}
                            >
                              {/* Clickable Display Pedestal -> 1-click instant try-on */}
                              <div className={styles.shopDisplayStage}>
                                <button
                                  type="button"
                                  className={styles.stageTryClick}
                                  onClick={() => handleTogglePreview(item)}
                                  aria-label={
                                    isPreviewing
                                      ? `Bỏ thử ${item.displayNameVi}`
                                      : `Thử nhanh ${item.displayNameVi} trên Fox`
                                  }
                                >
                                  <CosmeticPreviewThumb
                                    kind={item.iconKind}
                                    palette={item.palette}
                                    size={60}
                                  />
                                  {isPreviewing && (
                                    <span className={styles.wearingBadge} aria-hidden="true">
                                      <Check size={11} />
                                      <span>Đang thử</span>
                                    </span>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.wishlistBtn} ${isLiked ? styles.wishlistBtnActive : ''}`.trim()}
                                  onClick={() => toggleWishlist(item.id)}
                                  aria-label={
                                    isLiked
                                      ? `Bỏ thích ${item.displayNameVi}`
                                      : `Thêm ${item.displayNameVi} vào yêu thích`
                                  }
                                  aria-pressed={isLiked}
                                >
                                  <Heart
                                    size={13}
                                    fill={isLiked ? 'currentColor' : 'none'}
                                    aria-hidden="true"
                                  />
                                </button>
                              </div>

                              <div className={styles.boutiqueBody}>
                                <div className={styles.boutiqueMetaBlock}>
                                  <div className={styles.itemName}>{item.displayNameVi}</div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexWrap: 'wrap',
                                      alignItems: 'center',
                                      gap: 5,
                                      marginTop: 3,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setInspectTarget({
                                          id: item.id,
                                          name: item.displayNameVi,
                                          categoryLabel: 'Trang phục Fox V2',
                                          description: item.subtitleVi,
                                          priceCoin: meta.priceCoin,
                                          requiredLevel: meta.requiredLevel,
                                          ownership: meta.previewOwnership,
                                          visual: (
                                            <CosmeticPreviewThumb
                                              kind={item.iconKind}
                                              palette={item.palette}
                                              size={64}
                                            />
                                          ),
                                        })
                                      }
                                      data-testid={`wardrobe-shop-inspect-${item.id}`}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 3,
                                        padding: '2px 7px',
                                        borderRadius: 999,
                                        border: '1px solid rgba(217,155,30,0.35)',
                                        background: '#FFF6E0',
                                        color: '#8A5A00',
                                        fontSize: 11,
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                      }}
                                      title="Xem chi tiết giá & trạng thái mua"
                                    >
                                      <Coins size={10} aria-hidden="true" />
                                      <span>{meta.priceCoin} Xu</span>
                                    </button>
                                    <span className={styles.themeBadge}>Cấp {meta.requiredLevel}</span>
                                    {meta.previewOwnership === 'EQUIPPED' && (
                                      <Chip tone="success">Đang mặc</Chip>
                                    )}
                                    {meta.previewOwnership === 'OWNED' && (
                                      <Chip tone="neutral">Đã sở hữu</Chip>
                                    )}
                                    {levelLocked && <Chip tone="danger">Khóa cấp</Chip>}
                                    {lowCoins && !levelLocked && (
                                      <Chip tone="danger">Thiếu Xu</Chip>
                                    )}
                                  </div>
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
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <PurchaseStateModal
        open={Boolean(inspectTarget)}
        item={inspectTarget}
        coinBalance={
          liveToday ? liveToday.gamification.coinBalance : isMockSession ? mockStats.coinBalance : null
        }
        playerLevel={
          liveToday ? liveToday.gamification.level : isMockSession ? mockStats.level : null
        }
        onClose={() => setInspectTarget(null)}
      />
    </div>
  )
}
