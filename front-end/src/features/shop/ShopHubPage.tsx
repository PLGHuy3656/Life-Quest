import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BookImage,
  Check,
  Coins,
  Lock,
  MessageSquare,
  RotateCcw,
  Search,
  ShieldAlert,
  Shirt,
  Sparkles,
  Store,
  UserCircle2,
  Wallet,
  X,
} from 'lucide-react'
import foxHeroAnim from '@/assets/landing/fox-hero-anim.webp'
import foxHeroStatic from '@/assets/landing/fox-hero-static.webp'
import { useCompanion } from '@/features/mascot/CompanionProvider'
import { CosmeticPreviewThumb } from '@/features/wardrobe/CosmeticPreviewThumb'
import { getCatalogItemById, WARDROBE_CATALOG_ITEMS } from '@/features/wardrobe/wardrobeCatalog'
import type { CosmeticSlot, OutfitId } from '@/mascot/cosmetics/cosmeticContract'
import { useTodayQuery } from '@/hooks/useDashboardData'
import { useAuthStore } from '@/stores/authStore'
import { useMockProfileStore } from '@/stores/mockProfileStore'
import { useUiStore } from '@/stores/uiStore'
import { ProfileCosmeticsView } from './ProfileCosmeticsView'
import { PurchaseStateModal, type PurchasePreviewTarget } from './PurchaseStateModal'
import {
  getFoxShopMeta,
  PHASE2_COMING_SOON_ITEMS,
  type PurchaseUiState,
  type ShopCategoryId,
} from './shopCatalog'
import { ShopWalletView } from './ShopWalletView'
import styles from './ShopPage.module.css'

type ShopRouteMode = 'hub' | 'profile' | 'wallet'

const CATEGORIES: Array<{
  id: ShopCategoryId
  label: string
  icon: typeof Shirt
  comingSoon?: boolean
}> = [
  { id: 'fox', label: 'Fox', icon: Shirt },
  { id: 'profile', label: 'Hồ sơ', icon: UserCircle2 },
  { id: 'messages', label: 'Tin nhắn', icon: MessageSquare, comingSoon: true },
  { id: 'album', label: 'Album', icon: BookImage, comingSoon: true },
]

const OUTFIT_THEMES: ReadonlyArray<{ id: string; label: string; presetId?: OutfitId }> = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'Học sinh', label: 'Học sinh', presetId: 'outfit_student' },
  { id: 'Thể thao', label: 'Thể thao', presetId: 'outfit_sports' },
  { id: 'Thám hiểm', label: 'Thám hiểm', presetId: 'outfit_explorer' },
  { id: 'Pháp sư', label: 'Pháp sư', presetId: 'outfit_mage' },
  { id: 'Ninja', label: 'Ninja', presetId: 'outfit_ninja' },
  { id: 'Tết', label: 'Tết', presetId: 'outfit_tet' },
]

const THEME_STAGE_BACKDROPS: Record<string, { bg: string; ring: string }> = {
  'Học sinh': {
    bg: 'linear-gradient(145deg, #DCEBFA 0%, #F2F7FD 55%, #FCE8D8 100%)',
    ring: 'rgba(36, 64, 107, 0.14)',
  },
  'Thể thao': {
    bg: 'linear-gradient(145deg, #D2F1E8 0%, #ECFBF6 55%, #FFF1CE 100%)',
    ring: 'rgba(22, 140, 120, 0.16)',
  },
  'Thám hiểm': {
    bg: 'linear-gradient(145deg, #E5ECD4 0%, #F7F2E1 55%, #F3DCBA 100%)',
    ring: 'rgba(139, 94, 52, 0.16)',
  },
  'Pháp sư': {
    bg: 'linear-gradient(145deg, #E5DCF7 0%, #F3EEFC 55%, #FCE8BE 100%)',
    ring: 'rgba(91, 58, 156, 0.16)',
  },
  Ninja: {
    bg: 'linear-gradient(145deg, #D7E0EC 0%, #EBF0F6 55%, #FADFD9 100%)',
    ring: 'rgba(29, 36, 51, 0.16)',
  },
  Tết: {
    bg: 'linear-gradient(145deg, #FBDCD8 0%, #FFF0E3 55%, #FDE6A8 100%)',
    ring: 'rgba(193, 18, 31, 0.16)',
  },
}

const DEFAULT_STAGE_BACKDROP = {
  bg: 'linear-gradient(145deg, #EFE9DC 0%, #FBF7EF 60%, #FCE9D6 100%)',
  ring: 'rgba(22, 50, 74, 0.12)',
}

const FOX_ITEM_TYPE_FILTERS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'HAT', label: 'Mũ' },
  { id: 'OUTFIT', label: 'Trang phục' },
  { id: 'BACKPACK', label: 'Balo' },
  { id: 'ACCESSORY', label: 'Phụ kiện' },
] as const

export function ShopHubPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const companion = useCompanion()
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken.trim()))
  const isMockSession = useMockProfileStore((s) => s.isMockSession)
  const mockStats = useMockProfileStore((s) => s.stats)
  const reducedMotion = useUiStore((s) => s.reducedMotion)
  const todayQuery = useTodayQuery()

  const mode: ShopRouteMode = location.pathname.startsWith('/shop/wallet')
    ? 'wallet'
    : location.pathname.startsWith('/shop/profile')
      ? 'profile'
      : 'hub'

  const [activeCategory, setActiveCategory] = useState<ShopCategoryId>('fox')
  const [selectedTheme, setSelectedTheme] = useState<string>('ALL')
  const [selectedItemType, setSelectedItemType] = useState<string>('ALL')
  const [foxSearch, setFoxSearch] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [inspectTarget, setInspectTarget] = useState<PurchasePreviewTarget | null>(null)
  const [inspectInitialState, setInspectInitialState] = useState<PurchaseUiState | undefined>(
    undefined,
  )

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 36)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const liveToday =
    isAuthenticated && todayQuery.data?.source === 'LIVE' ? todayQuery.data.data : null
  const coinBalance = liveToday
    ? liveToday.gamification.coinBalance
    : isMockSession
      ? mockStats.coinBalance
      : null
  const playerLevel = liveToday
    ? liveToday.gamification.level
    : isMockSession
      ? mockStats.level
      : null

  const filteredFoxItems = useMemo(() => {
    const q = foxSearch.trim().toLowerCase()
    return WARDROBE_CATALOG_ITEMS.filter((i) => {
      if (selectedTheme !== 'ALL' && i.outfitThemeVi !== selectedTheme) return false
      if (selectedItemType !== 'ALL' && i.category !== selectedItemType) return false
      if (
        q &&
        !i.displayNameVi.toLowerCase().includes(q) &&
        !(i.outfitThemeVi?.toLowerCase().includes(q) ?? false)
      ) {
        return false
      }
      return true
    })
  }, [selectedTheme, selectedItemType, foxSearch])

  const previewEquippedItems = useMemo(() => {
    return (Object.entries(companion.previewCosmetics) as Array<[CosmeticSlot, string | undefined]>)
      .map(([slot, id]) => {
        if (!id) return null
        const item = getCatalogItemById(id as Parameters<typeof getCatalogItemById>[0])
        return item ? { slot, item } : null
      })
      .filter((x): x is { slot: CosmeticSlot; item: NonNullable<ReturnType<typeof getCatalogItemById>> } => Boolean(x))
  }, [companion.previewCosmetics])

  const activeThemeDef = useMemo(
    () => OUTFIT_THEMES.find((t) => t.id === selectedTheme) ?? OUTFIT_THEMES[0],
    [selectedTheme],
  )

  const foxPhase2 = useMemo(
    () => PHASE2_COMING_SOON_ITEMS.filter((i) => i.category === 'fox'),
    [],
  )
  const messagesPhase2 = useMemo(
    () => PHASE2_COMING_SOON_ITEMS.filter((i) => i.category === 'messages'),
    [],
  )
  const albumPhase2 = useMemo(
    () => PHASE2_COMING_SOON_ITEMS.filter((i) => i.category === 'album'),
    [],
  )

  const openModal = (target: PurchasePreviewTarget, forcedState?: PurchaseUiState) => {
    setInspectTarget(target)
    setInspectInitialState(forcedState)
  }

  return (
    <div className={styles.shopWrap} data-testid="experience-shop-page">
      {/* Clean 2-Row Header & Unified Toolbar (synced with Album/Profile) */}
      <header className={styles.shopHeader}>
        <div className={styles.shopHeadTop}>
          <div>
            <h1 className={styles.shopTitle}>Tiệm LifeQuest</h1>
            <p className={styles.shopSubtitle}>
              Đổi trang phục Fox V2, khung đại diện và danh hiệu trang trí bằng Xu thưởng.
            </p>
          </div>

          <div className={styles.shopHeadRight}>
            <Link
              to="/shop/wallet"
              className={styles.coinWalletPill}
              data-testid="shop-header-wallet-pill"
              aria-label={`Ví Xu: ${coinBalance !== null ? `${coinBalance} Xu` : 'Chưa đồng bộ'}`}
            >
              <Coins size={15} aria-hidden="true" />
              <strong>{coinBalance !== null ? `${coinBalance.toLocaleString('vi-VN')} Xu` : '— Xu'}</strong>
            </Link>

            <Link
              to="/wardrobe/shop"
              className={styles.btnPrimary}
              data-testid="shop-open-wardrobe-3d-btn"
            >
              <Shirt size={15} aria-hidden="true" />
              <span>Phòng thử đồ 3D</span>
            </Link>
          </div>
        </div>

        {/* Single Unified Toolbar Row */}
        <div className={styles.shopNavStrip}>
          <div className={styles.shopNavLeft}>
            <nav className={styles.modeCapsule} aria-label="Khu vực Tiệm LifeQuest">
              <Link
                to="/shop"
                className={`${styles.modeTab} ${mode === 'hub' ? styles.modeTabActive : ''}`.trim()}
                data-testid="shop-nav-hub"
              >
                <Store size={14} aria-hidden="true" /> Cửa hàng
              </Link>
              <Link
                to="/shop/profile"
                className={`${styles.modeTab} ${mode === 'profile' ? styles.modeTabActive : ''}`.trim()}
                data-testid="shop-nav-profile"
              >
                <UserCircle2 size={14} aria-hidden="true" /> Hồ sơ
              </Link>
              <Link
                to="/shop/wallet"
                className={`${styles.modeTab} ${mode === 'wallet' ? styles.modeTabActive : ''}`.trim()}
                data-testid="shop-nav-wallet"
              >
                <Wallet size={14} aria-hidden="true" /> Ví Xu
              </Link>
            </nav>

            {mode === 'hub' && (
              <>
                <span className={styles.toolbarDivider} aria-hidden="true" />
                <div className={styles.inlineCategoryBar} role="tablist" aria-label="Danh mục Tiệm LifeQuest">
                  {CATEGORIES.map((cat) => {
                    const active = activeCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`${styles.catChipBtn} ${active ? styles.catChipActive : ''}`.trim()}
                        data-testid={`shop-category-${cat.id}`}
                      >
                        <span>{cat.label}</span>
                        {cat.comingSoon && <span className={styles.catSoonTag}>Sắp ra mắt</span>}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            className={styles.apiLockPill}
            data-testid="shop-api-lock-banner"
            title="Chế độ xem trước — Mua thật đang tạm khóa chờ Backend R1–R3"
            onClick={() =>
              openModal(
                {
                  id: 'shop-api-notice',
                  name: 'Mũ Safari Thám hiểm',
                  categoryLabel: 'Trang phục Fox V2',
                  description:
                    'Chức năng mua thật đang tạm khóa an toàn trong khi Backend hoàn tất bảo vệ số dư R1–R3.',
                  priceCoin: 240,
                  requiredLevel: 4,
                  ownership: 'AVAILABLE',
                },
                'api_unavailable',
              )
            }
          >
            <ShieldAlert size={13} aria-hidden="true" />
            <span>Xem trước</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {mode === 'wallet' ? (
        <ShopWalletView
          coinBalance={coinBalance}
          isLiveBackend={isAuthenticated && Boolean(liveToday)}
          isMockSession={isMockSession}
        />
      ) : mode === 'profile' ? (
        <ProfileCosmeticsView
          coinBalance={coinBalance}
          playerLevel={playerLevel}
          onInspectItem={(t) => openModal(t)}
        />
      ) : (
        <div className={styles.hubContent} data-testid="shop-hub-view">
          {activeCategory === 'fox' && (
            <div className={styles.categoryPanel} data-testid="shop-panel-fox">
              {/* Synced Item-Type Filter & Search Strip */}
              <div className={styles.itemFilterBar}>
                <div className={styles.itemFilterPills} role="group" aria-label="Lọc theo loại vật phẩm Fox">
                  {FOX_ITEM_TYPE_FILTERS.map((f) => {
                    const count =
                      f.id === 'ALL'
                        ? WARDROBE_CATALOG_ITEMS.length
                        : WARDROBE_CATALOG_ITEMS.filter((i) => i.category === f.id).length
                    const active = selectedItemType === f.id
                    return (
                      <button
                        key={f.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedItemType(f.id)}
                        className={`${styles.itemTypeBtn} ${active ? styles.itemTypeBtnActive : ''}`.trim()}
                        data-testid={`shop-fox-type-${f.id.toLowerCase()}`}
                      >
                        <span>{f.label}</span>
                        <span className={styles.itemTypeCount}>{count}</span>
                      </button>
                    )
                  })}
                </div>

                <label className={styles.shopSearchPill}>
                  <Search size={14} color="#6B7885" aria-hidden="true" />
                  <input
                    type="search"
                    value={foxSearch}
                    onChange={(e) => setFoxSearch(e.target.value)}
                    placeholder="Tìm mũ, áo, balo..."
                    aria-label="Tìm nhanh vật phẩm Fox"
                  />
                </label>
              </div>

              {filteredFoxItems.length === 0 ? (
                <div className={styles.walletStateBox}>
                  <strong>Không tìm thấy vật phẩm phù hợp</strong>
                  <p>Thử đổi loại vật phẩm hoặc bộ sưu tập để xem thêm món đồ cho Fox.</p>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => {
                      setSelectedItemType('ALL')
                      setSelectedTheme('ALL')
                      setFoxSearch('')
                    }}
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              ) : (
                <div className={styles.cosmeticGrid}>
                {filteredFoxItems.map((item) => {
                  const meta = getFoxShopMeta(item.id)
                  const isPreviewing = companion.previewCosmetics[item.slot] === item.id
                  const levelLocked = playerLevel !== null && playerLevel < meta.requiredLevel
                  const lowCoins =
                    meta.previewOwnership === 'AVAILABLE' &&
                    coinBalance !== null &&
                    coinBalance < meta.priceCoin

                  const backdrop =
                    (item.outfitThemeVi && THEME_STAGE_BACKDROPS[item.outfitThemeVi]) ||
                    DEFAULT_STAGE_BACKDROP

                  return (
                    <article
                      key={item.id}
                      className={`${styles.itemCard} ${isPreviewing ? styles.itemCardActive : ''}`.trim()}
                      data-testid={`hub-fox-item-${item.id}`}
                    >
                      <div
                        className={styles.foxThumbStage}
                        style={{ background: backdrop.bg }}
                      >
                        <span
                          className={styles.pedestalHalo}
                          style={{ borderColor: backdrop.ring }}
                          aria-hidden="true"
                        />
                        <span className={styles.pedestalSparkleA} aria-hidden="true" />
                        <span className={styles.pedestalSparkleB} aria-hidden="true" />
                        <div className={styles.pedestalItemFloat}>
                          <div className={styles.pedestalMedallion}>
                            <CosmeticPreviewThumb
                              kind={item.iconKind}
                              palette={item.palette}
                              size={58}
                            />
                          </div>
                        </div>
                        <span className={styles.pedestalShadow} aria-hidden="true" />

                        <span className={styles.pedestalPriceTag}>
                          <Coins size={11} aria-hidden="true" /> {meta.priceCoin} Xu
                        </span>

                        <div className={styles.cardCornerStatus}>
                          {isPreviewing && (
                            <span className={styles.badgeEquipped}>Đang thử</span>
                          )}
                          {!isPreviewing && meta.previewOwnership === 'EQUIPPED' && (
                            <span className={styles.badgeEquipped}>Đang mặc</span>
                          )}
                          {!isPreviewing && meta.previewOwnership === 'OWNED' && (
                            <span className={styles.badgeOwned}>Đã sở hữu</span>
                          )}
                          {!isPreviewing && levelLocked && meta.previewOwnership === 'AVAILABLE' && (
                            <span className={styles.badgeLocked}>
                              <Lock size={10} aria-hidden="true" /> Cấp {meta.requiredLevel}
                            </span>
                          )}
                          {!isPreviewing && lowCoins && !levelLocked && meta.previewOwnership === 'AVAILABLE' && (
                            <span className={styles.badgeLocked}>Thiếu Xu</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.itemCardBody}>
                        <strong className={styles.itemCardName}>{item.displayNameVi}</strong>
                        <p className={styles.itemCardDesc}>
                          {item.outfitThemeVi ? `Bộ ${item.outfitThemeVi}` : 'Phụ kiện Fox'} · Cấp{' '}
                          {meta.requiredLevel}
                        </p>
                        <div className={styles.itemCardActions}>
                          <button
                            type="button"
                            className={isPreviewing ? styles.btnPreviewActive : styles.btnSecondary}
                            data-testid={`hub-fox-try-${item.id}`}
                            onClick={() => {
                              if (isPreviewing) companion.unequipSlot(item.slot)
                              else companion.equipCosmetic(item.id)
                            }}
                          >
                            {isPreviewing ? (
                              <>
                                <Check size={13} aria-hidden="true" /> Bỏ thử
                              </>
                            ) : (
                              'Mặc thử'
                            )}
                          </button>
                          <button
                            type="button"
                            className={styles.btnGhostLock}
                            data-testid={`hub-fox-inspect-${item.id}`}
                            onClick={() =>
                              openModal({
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
                          >
                            <Lock size={12} aria-hidden="true" /> Chi tiết
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
                </div>
              )}

              {/* Phase 2 Fox Effects (Coming Soon) */}
              <section className={styles.catalogSection}>
                <div className={styles.sectionHeadRow}>
                  <h2 className={styles.sectionTitle}>Hiệu ứng Fox</h2>
                  <span className={styles.comingSoonPill}>Sắp ra mắt · Giai đoạn 2</span>
                </div>
                <div className={styles.comingSoonGrid}>
                  {foxPhase2.map((item) => (
                    <article key={item.id} className={styles.comingSoonCard}>
                      <div
                        className={styles.comingSoonBanner}
                        style={{ background: item.accentGradient }}
                      >
                        <span className={styles.comingSoonPillDark}>Sắp ra mắt</span>
                      </div>
                      <div className={styles.comingSoonBody}>
                        <span className={styles.comingSoonSub}>{item.subType}</span>
                        <strong>{item.name}</strong>
                        <p>{item.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Sticky Bottom Frosted-Glass Fox Try-On Dock */}
              <section
                className={`${styles.atelierBottomDock} ${isScrolled ? styles.atelierDockScrolled : ''}`.trim()}
                aria-label="Thanh mặc thử Fox Atelier"
                data-testid="shop-fox-tryon-dock"
              >
                <div className={styles.dockLeftCol}>
                  <div className={styles.dockTopLine}>
                    <span className={styles.atelierTag}>
                      <Sparkles size={12} aria-hidden="true" /> FOX ATELIER · MẶC THỬ NHANH
                    </span>
                    {activeThemeDef.presetId && (
                      <button
                        type="button"
                        className={styles.dockPresetBtn}
                        onClick={() => companion.applyOutfit(activeThemeDef.presetId!)}
                      >
                        Mặc cả bộ {activeThemeDef.label}
                      </button>
                    )}
                  </div>
                  <div className={styles.themePillRow} role="group" aria-label="Lọc theo bộ trang phục">
                    {OUTFIT_THEMES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={selectedTheme === t.id}
                        onClick={() => setSelectedTheme(t.id)}
                        className={`${styles.themePillBtn} ${selectedTheme === t.id ? styles.themePillActive : ''}`.trim()}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.dockRightCol}>
                  <div className={styles.dockEquippedList}>
                    {previewEquippedItems.length === 0 ? (
                      <span className={styles.dockEmptyHint}>
                        Bấm <strong>Mặc thử</strong> trên món đồ bất kỳ để phối đồ cho Fox
                      </span>
                    ) : (
                      <>
                        {previewEquippedItems.map(({ slot, item }) => (
                          <button
                            key={slot}
                            type="button"
                            className={styles.dockEquippedChip}
                            title={`Tháo ${item.displayNameVi}`}
                            onClick={() => companion.unequipSlot(slot)}
                          >
                            <CosmeticPreviewThumb
                              kind={item.iconKind}
                              palette={item.palette}
                              size={20}
                            />
                            <span>{item.displayNameVi}</span>
                            <X size={11} aria-hidden="true" />
                          </button>
                        ))}
                        <button
                          type="button"
                          className={styles.dockResetBtn}
                          onClick={() => {
                            previewEquippedItems.forEach(({ slot }) => companion.unequipSlot(slot))
                          }}
                          title="Tháo toàn bộ đồ đang thử"
                        >
                          <RotateCcw size={12} aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    className={styles.dockFoxBtn}
                    onClick={() => navigate('/wardrobe/shop')}
                    title="Mở Phòng thử đồ 3D với bộ đồ đang phối"
                  >
                    <img
                      src={reducedMotion ? foxHeroStatic : foxHeroAnim}
                      alt="Fox đồng hành"
                      className={styles.dockFoxImg}
                      draggable={false}
                    />
                    {previewEquippedItems.length > 0 && (
                      <span className={styles.dockCountBadge}>{previewEquippedItems.length}</span>
                    )}
                  </button>
                </div>
              </section>
            </div>
          )}

          {activeCategory === 'profile' && (
            <ProfileCosmeticsView
              coinBalance={coinBalance}
              playerLevel={playerLevel}
              onInspectItem={(t) => openModal(t)}
            />
          )}

          {activeCategory === 'messages' && (
            <section className={styles.comingSoonSection} data-testid="shop-panel-messages">
              <div className={styles.comingSoonHeaderBox}>
                <div>
                  <span className={styles.comingSoonPill}>Sắp ra mắt · Giai đoạn 2</span>
                  <h2>Trang trí Tin nhắn</h2>
                  <p>
                    Hình nền khung chat và kiểu bong bóng trò chuyện sẽ mở bán bằng Xu ở Giai đoạn 2
                    sau khi hoàn thiện đồng bộ Messenger.
                  </p>
                </div>
              </div>
              <div className={styles.comingSoonGrid}>
                {messagesPhase2.map((item) => (
                  <article key={item.id} className={styles.comingSoonCard}>
                    <div
                      className={styles.comingSoonBanner}
                      style={{ background: item.accentGradient }}
                    >
                      <div className={styles.miniChatPreview} aria-hidden="true">
                        <span className={styles.miniBubbleLeft}>Chào Fox!</span>
                        <span className={styles.miniBubbleRight}>Cùng chạy Quest nhé ✨</span>
                      </div>
                      <span className={styles.comingSoonPillDark}>Sắp ra mắt</span>
                    </div>
                    <div className={styles.comingSoonBody}>
                      <span className={styles.comingSoonSub}>{item.subType}</span>
                      <strong>{item.name}</strong>
                      <p>{item.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeCategory === 'album' && (
            <section className={styles.comingSoonSection} data-testid="shop-panel-album">
              <div className={styles.comingSoonHeaderBox}>
                <div>
                  <span className={styles.comingSoonPill}>Sắp ra mắt · Giai đoạn 2</span>
                  <h2>Khung ảnh Album &amp; Moment</h2>
                  <p>
                    Các bộ khung ảnh trang trí cho Sổ kỷ niệm và bài đăng Moment sẽ mở khóa ở Giai
                    đoạn 2 sau khi Backend hoàn thiện Album API.
                  </p>
                </div>
              </div>
              <div className={styles.comingSoonGrid}>
                {albumPhase2.map((item) => (
                  <article key={item.id} className={styles.comingSoonCard}>
                    <div
                      className={styles.comingSoonBanner}
                      style={{ background: item.accentGradient }}
                    >
                      <div className={styles.miniPolaroidPreview} aria-hidden="true">
                        <span className={styles.miniPolaroidSky} />
                      </div>
                      <span className={styles.comingSoonPillDark}>Sắp ra mắt</span>
                    </div>
                    <div className={styles.comingSoonBody}>
                      <span className={styles.comingSoonSub}>{item.subType}</span>
                      <strong>{item.name}</strong>
                      <p>{item.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <PurchaseStateModal
        open={Boolean(inspectTarget)}
        item={inspectTarget}
        coinBalance={coinBalance}
        playerLevel={playerLevel}
        initialState={inspectInitialState}
        onClose={() => {
          setInspectTarget(null)
          setInspectInitialState(undefined)
        }}
      />
    </div>
  )
}
