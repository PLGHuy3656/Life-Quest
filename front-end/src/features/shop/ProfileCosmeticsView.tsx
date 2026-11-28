import { useEffect, useState } from 'react'
import { Check, Coins, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import { DecorativeLabel } from '@/features/journal/JournalPrimitives'
import { PROFILE_AVATAR_PRESETS, useMockProfileStore } from '@/stores/mockProfileStore'
import type { PurchasePreviewTarget } from './PurchaseStateModal'
import {
  PHASE2_COMING_SOON_ITEMS,
  PROFILE_AVATAR_FRAMES,
  PROFILE_DECORATIVE_TITLES,
  type AvatarFrameItem,
  type DecorativeTitleItem,
} from './shopCatalog'
import styles from './ShopPage.module.css'

type ProfileItemTypeFilter = 'ALL' | 'FRAME' | 'TITLE' | 'POSE'

export function ProfileCosmeticsView({
  coinBalance,
  playerLevel,
  onInspectItem,
}: {
  coinBalance: number | null
  playerLevel: number | null
  onInspectItem: (target: PurchasePreviewTarget) => void
}) {
  const mockProfile = useMockProfileStore((s) => s.profile)
  const [previewFrameId, setPreviewFrameId] = useState<string>(PROFILE_AVATAR_FRAMES[0].id)
  const [previewTitleId, setPreviewTitleId] = useState<string>(PROFILE_DECORATIVE_TITLES[0].id)
  const [itemFilter, setItemFilter] = useState<ProfileItemTypeFilter>('ALL')
  const [onlyOwned, setOnlyOwned] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 36)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const activeFrame =
    PROFILE_AVATAR_FRAMES.find((f) => f.id === previewFrameId) ?? PROFILE_AVATAR_FRAMES[0]
  const activeTitle =
    PROFILE_DECORATIVE_TITLES.find((t) => t.id === previewTitleId) ?? PROFILE_DECORATIVE_TITLES[0]
  const avatarSrc =
    PROFILE_AVATAR_PRESETS.find((p) => p.id === mockProfile.avatarPresetId)?.src ??
    PROFILE_AVATAR_PRESETS[0].src

  const profilePhase2 = PHASE2_COMING_SOON_ITEMS.filter((i) => i.category === 'profile')

  const openFrameModal = (frame: AvatarFrameItem) => {
    onInspectItem({
      id: frame.id,
      name: frame.name,
      categoryLabel: 'Khung đại diện tĩnh',
      description: frame.description,
      priceCoin: frame.priceCoin,
      requiredLevel: frame.requiredLevel,
      ownership: frame.previewOwnership,
      visual: (
        <div
          className={styles.modalFramePreviewRing}
          style={{ background: frame.ringGradient }}
        >
          <div className={styles.modalFramePreviewInner}>
            <img src={avatarSrc} alt="" />
          </div>
          <span className={styles.frameCornerGlyph} style={{ background: frame.accentHex }}>
            {frame.badgeGlyph}
          </span>
        </div>
      ),
    })
  }

  const openTitleModal = (item: DecorativeTitleItem) => {
    onInspectItem({
      id: item.id,
      name: item.titleText,
      categoryLabel: 'Danh hiệu Hồ sơ',
      description: item.description,
      priceCoin: item.priceCoin,
      requiredLevel: item.requiredLevel,
      ownership: item.previewOwnership,
      isDecorativeTitle: true,
      visual: (
        <span
          className={styles.titlePillSample}
          style={{ background: item.toneBg, color: item.toneColor }}
        >
          <Sparkles size={13} aria-hidden="true" /> {item.titleText}
        </span>
      ),
    })
  }

  const visibleFrames = onlyOwned
    ? PROFILE_AVATAR_FRAMES.filter((f) => f.previewOwnership !== 'AVAILABLE')
    : PROFILE_AVATAR_FRAMES
  const visibleTitles = onlyOwned
    ? PROFILE_DECORATIVE_TITLES.filter((t) => t.previewOwnership !== 'AVAILABLE')
    : PROFILE_DECORATIVE_TITLES

  return (
    <div className={styles.profileShopWrap} data-testid="shop-profile-cosmetics-view">
      {/* Synced Item-Type Filter Bar for Profile Cosmetics */}
      <div className={styles.itemFilterBar}>
        <div className={styles.itemFilterPills} role="group" aria-label="Lọc theo loại vật phẩm Hồ sơ">
          {(
            [
              {
                id: 'ALL',
                label: 'Tất cả',
                count:
                  PROFILE_AVATAR_FRAMES.length +
                  PROFILE_DECORATIVE_TITLES.length +
                  profilePhase2.length,
              },
              { id: 'FRAME', label: 'Khung đại diện', count: PROFILE_AVATAR_FRAMES.length },
              { id: 'TITLE', label: 'Danh hiệu', count: PROFILE_DECORATIVE_TITLES.length },
              { id: 'POSE', label: 'Tư thế (Sắp ra mắt)', count: profilePhase2.length },
            ] as const
          ).map((f) => {
            const active = itemFilter === f.id
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => setItemFilter(f.id)}
                className={`${styles.itemTypeBtn} ${active ? styles.itemTypeBtnActive : ''}`.trim()}
                data-testid={`shop-profile-type-${f.id.toLowerCase()}`}
              >
                <span>{f.label}</span>
                <span className={styles.itemTypeCount}>{f.count}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          aria-pressed={onlyOwned}
          onClick={() => setOnlyOwned((v) => !v)}
          className={`${styles.itemTypeBtn} ${onlyOwned ? styles.itemTypeBtnActive : ''}`.trim()}
        >
          <span>Chỉ hiện đã sở hữu</span>
        </button>
      </div>

      {/* Section 1: Static Avatar Frames */}
      {(itemFilter === 'ALL' || itemFilter === 'FRAME') && (
      <section className={styles.catalogSection}>
        <div className={styles.sectionHeadRow}>
          <div>
            <h2 className={styles.sectionTitle}>Khung ảnh đại diện tĩnh</h2>
            <p className={styles.sectionSub}>
              Chọn khung để xem trước trực tiếp trên ảnh đại diện của bạn.
            </p>
          </div>
        </div>

        <div className={styles.cosmeticGrid}>
          {visibleFrames.map((frame) => {
            const isPreviewing = previewFrameId === frame.id
            const levelLocked = playerLevel !== null && playerLevel < frame.requiredLevel
            const lowCoins =
              frame.previewOwnership === 'AVAILABLE' &&
              coinBalance !== null &&
              coinBalance < frame.priceCoin

            return (
              <article
                key={frame.id}
                className={`${styles.itemCard} ${isPreviewing ? styles.itemCardActive : ''}`.trim()}
                data-testid={`shop-frame-card-${frame.id}`}
              >
                <div
                  className={styles.frameStage}
                  style={{
                    background: `radial-gradient(circle at 50% 42%, ${frame.accentHex}24 0%, #fbf7ef 74%)`,
                  }}
                >
                  <span
                    className={styles.pedestalHalo}
                    style={{ borderColor: `${frame.accentHex}30` }}
                    aria-hidden="true"
                  />
                  <div className={styles.pedestalItemFloat}>
                    <div
                      className={styles.frameRingThumb}
                      style={{ background: frame.ringGradient }}
                    >
                      <div className={styles.frameRingInner}>
                        <img src={avatarSrc} alt="" />
                      </div>
                      <span
                        className={styles.frameCornerGlyph}
                        style={{ background: frame.accentHex }}
                        aria-hidden="true"
                      >
                        {frame.badgeGlyph}
                      </span>
                    </div>
                  </div>
                  <span className={styles.pedestalShadow} aria-hidden="true" />
                  <span className={styles.pedestalPriceTag}>
                    <Coins size={11} aria-hidden="true" /> {frame.priceCoin} Xu
                  </span>
                  <div className={styles.cardCornerStatus}>
                    {frame.previewOwnership === 'EQUIPPED' && (
                      <span className={styles.badgeEquipped}>Đang dùng</span>
                    )}
                    {frame.previewOwnership === 'OWNED' && (
                      <span className={styles.badgeOwned}>Đã sở hữu</span>
                    )}
                    {levelLocked && frame.previewOwnership === 'AVAILABLE' && (
                      <span className={styles.badgeLocked}>
                        <Lock size={10} aria-hidden="true" /> Cấp {frame.requiredLevel}
                      </span>
                    )}
                    {lowCoins && !levelLocked && frame.previewOwnership === 'AVAILABLE' && (
                      <span className={styles.badgeLocked}>Thiếu Xu</span>
                    )}
                  </div>
                </div>

                <div className={styles.itemCardBody}>
                  <strong className={styles.itemCardName}>{frame.name}</strong>
                  <p className={styles.itemCardDesc}>
                    Yêu cầu Cấp {frame.requiredLevel} · {frame.description}
                  </p>
                  <div className={styles.itemCardActions}>
                    <button
                      type="button"
                      className={isPreviewing ? styles.btnPreviewActive : styles.btnSecondary}
                      onClick={() => setPreviewFrameId(frame.id)}
                      data-testid={`preview-frame-btn-${frame.id}`}
                    >
                      {isPreviewing ? (
                        <>
                          <Check size={13} aria-hidden="true" /> Đang thử
                        </>
                      ) : (
                        'Xem thử'
                      )}
                    </button>
                    <button
                      type="button"
                      className={styles.btnGhostLock}
                      onClick={() => openFrameModal(frame)}
                      data-testid={`inspect-frame-btn-${frame.id}`}
                    >
                      <Lock size={12} aria-hidden="true" /> Chi tiết
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
      )}

      {/* Section 2: Decorative Profile Titles */}
      {(itemFilter === 'ALL' || itemFilter === 'TITLE') && (
      <section className={styles.catalogSection}>
        <div className={styles.sectionHeadRow}>
          <div>
            <h2 className={styles.sectionTitle}>Danh hiệu Hồ sơ</h2>
            <p className={styles.sectionSub}>
              Mọi danh hiệu mua bằng Xu đều hiển thị nhãn TRANG TRÍ để phân biệt với Huy hiệu thành
              tích.
            </p>
          </div>
        </div>

        <div className={styles.cosmeticGrid}>
          {visibleTitles.map((item) => {
            const isPreviewing = previewTitleId === item.id
            const levelLocked = playerLevel !== null && playerLevel < item.requiredLevel
            const lowCoins =
              item.previewOwnership === 'AVAILABLE' &&
              coinBalance !== null &&
              coinBalance < item.priceCoin

            return (
              <article
                key={item.id}
                className={`${styles.itemCard} ${isPreviewing ? styles.itemCardActive : ''}`.trim()}
                data-testid={`shop-title-card-${item.id}`}
              >
                <div className={styles.titleStage}>
                  <div className={styles.titleStageInner}>
                    <span
                      className={styles.titlePillSample}
                      style={{ background: item.toneBg, color: item.toneColor }}
                    >
                      <Sparkles size={12} aria-hidden="true" />
                      <span>{item.titleText}</span>
                    </span>
                    <DecorativeLabel />
                  </div>
                  <span className={styles.pedestalPriceTag}>
                    <Coins size={11} aria-hidden="true" /> {item.priceCoin} Xu
                  </span>
                  <div className={styles.cardCornerStatus}>
                    {item.previewOwnership === 'EQUIPPED' && (
                      <span className={styles.badgeEquipped}>Đang dùng</span>
                    )}
                    {item.previewOwnership === 'OWNED' && (
                      <span className={styles.badgeOwned}>Đã sở hữu</span>
                    )}
                    {levelLocked && item.previewOwnership === 'AVAILABLE' && (
                      <span className={styles.badgeLocked}>
                        <Lock size={10} aria-hidden="true" /> Cấp {item.requiredLevel}
                      </span>
                    )}
                    {lowCoins && !levelLocked && item.previewOwnership === 'AVAILABLE' && (
                      <span className={styles.badgeLocked}>Thiếu Xu</span>
                    )}
                  </div>
                </div>

                <div className={styles.itemCardBody}>
                  <strong className={styles.itemCardName}>{item.titleText}</strong>
                  <p className={styles.itemCardDesc}>
                    Yêu cầu Cấp {item.requiredLevel} · {item.description}
                  </p>
                  <div className={styles.itemCardActions}>
                    <button
                      type="button"
                      className={isPreviewing ? styles.btnPreviewActive : styles.btnSecondary}
                      onClick={() => setPreviewTitleId(item.id)}
                      data-testid={`preview-title-btn-${item.id}`}
                    >
                      {isPreviewing ? (
                        <>
                          <Check size={13} aria-hidden="true" /> Đang thử
                        </>
                      ) : (
                        'Xem thử'
                      )}
                    </button>
                    <button
                      type="button"
                      className={styles.btnGhostLock}
                      onClick={() => openTitleModal(item)}
                      data-testid={`inspect-title-btn-${item.id}`}
                    >
                      <Lock size={12} aria-hidden="true" /> Chi tiết
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
      )}

      {/* Section 3: Phase 2 Profile Showcase Poses (Coming Soon) */}
      {(itemFilter === 'ALL' || itemFilter === 'POSE') && !onlyOwned && (
      <section className={styles.catalogSection}>
        <div className={styles.sectionHeadRow}>
          <h2 className={styles.sectionTitle}>Tư thế trưng bày Hồ sơ</h2>
          <span className={styles.comingSoonPill}>Sắp ra mắt · Giai đoạn 2</span>
        </div>
        <div className={styles.comingSoonGrid}>
          {profilePhase2.map((item) => (
            <article key={item.id} className={styles.comingSoonCard}>
              <div
                className={styles.comingSoonBanner}
                style={{ background: item.accentGradient }}
              >
                <div className={styles.miniPoseBadge} aria-hidden="true">
                  <img src={avatarSrc} alt="" />
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

      {/* Sticky Bottom Frosted-Glass Live Profile Preview Dock */}
      <section
        className={`${styles.profilePreviewDock} ${isScrolled ? styles.atelierDockScrolled : ''}`.trim()}
        aria-label="Xem trước giao diện Hồ sơ"
      >
        <div className={styles.profileDockIdentity}>
          <div
            className={styles.previewAvatarDock}
            style={{ background: activeFrame.ringGradient }}
            data-testid="profile-preview-frame"
            data-frame-id={activeFrame.id}
          >
            <div className={styles.previewAvatarInner}>
              <img src={avatarSrc} alt={`Ảnh đại diện ${mockProfile.displayName}`} />
            </div>
            <span
              className={styles.frameCornerGlyph}
              style={{ background: activeFrame.accentHex }}
              aria-hidden="true"
            >
              {activeFrame.badgeGlyph}
            </span>
          </div>

          <div className={styles.profilePreviewText}>
            <div className={styles.profileNameLine}>
              <strong className={styles.previewDisplayNameDock}>{mockProfile.displayName}</strong>
              <span className={styles.previewHandleText}>@{mockProfile.username}</span>
            </div>
            <div className={styles.previewTitleRow} data-testid="profile-preview-title">
              <span
                className={styles.titlePillSample}
                style={{ background: activeTitle.toneBg, color: activeTitle.toneColor }}
              >
                <Sparkles size={12} aria-hidden="true" />
                <span>{activeTitle.titleText}</span>
              </span>
              <DecorativeLabel />
            </div>
            <span className={styles.previewFrameCaption}>
              Đang thử: <strong>{activeFrame.name}</strong>
            </span>
          </div>
        </div>

        <div className={styles.achievementGuardDock} role="note" data-testid="achievement-separation-note">
          <ShieldCheck size={15} color="#168C78" aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>
            <strong>Huy hiệu thành tích không bán bằng Xu</strong> · Danh hiệu luôn gắn nhãn{' '}
            <strong>TRANG TRÍ</strong>.
          </span>
        </div>
      </section>
    </div>
  )
}
