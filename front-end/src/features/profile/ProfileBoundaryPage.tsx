import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Award,
  Backpack,
  BookOpen,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Coins,
  Compass,
  Flag,
  Flame,
  Glasses,
  HardHat,
  Heart,
  Lock,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Pin,
  Plus,
  Share2,
  Shield,
  ShieldOff,
  Shirt,
  ShoppingBag,
  Smile,
  Sparkles,
  Star,
  Sun,
  Swords,
  Timer,
  Trophy,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import {
  ClothCover,
  DecorativeLabel,
  FoxStage,
  JournalIllustration,
  MountedPhoto,
  PrivacyPill,
  type ClothColor,
} from '@/features/journal/JournalPrimitives'
import { useAlbumStore } from '@/features/album/albumStore'
import { useOptionalCompanion } from '@/features/mascot/CompanionProvider'
import { getCatalogItemById, WARDROBE_OUTFIT_PRESETS } from '@/features/wardrobe/wardrobeCatalog'
import { useTodayQuery, useUserMeQuery } from '@/hooks/useDashboardData'
import { usersApi } from '@/services/api/usersApi'
import { useAuthStore } from '@/stores/authStore'
import {
  MOCK_LOGIN_CREDENTIALS,
  PROFILE_AVATAR_PRESETS,
  useMockProfileStore,
  type EditableProfileData,
} from '@/stores/mockProfileStore'
import {
  BASE_PROFILE_BADGES,
  DECORATIVE_TITLES_MOCK,
  MOCK_OTHER_PROFILES,
  OWN_SAMPLE_MOMENTS,
  projectProfileForViewer,
  type ViewerRelation,
} from './profileFixtures'
import { ProfileEditDrawer } from './ProfileEditDrawer'
import jStyles from '@/features/journal/journal.module.css'
import styles from './AdventureProfile.module.css'

type ProfileTab = 'overview' | 'badges' | 'album' | 'moments'
type AlbumTabFilter = 'all' | 'mine' | 'group' | 'quest'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'LQ'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const BADGE_VISUALS: Record<string, { icon: typeof Trophy; bg: string; color: string }> = {
  'streak-fire': { icon: Flame, bg: '#FFF1EB', color: '#F26B3A' },
  'xp-master': { icon: Star, bg: '#FEF6E4', color: '#D99B1E' },
  champion: { icon: Trophy, bg: '#EEF2FF', color: '#3955A3' },
  'quest-voyager': { icon: Flag, bg: '#FFF1EB', color: '#E05528' },
  'early-bird': { icon: Sun, bg: '#E6F6F2', color: '#168C78' },
  'focus-keeper': { icon: Timer, bg: '#EEF2FF', color: '#16324A' },
  'coin-collector': { icon: Coins, bg: '#FEF6E4', color: '#C58716' },
  'task-finisher': { icon: CheckCircle2, bg: '#E6F6F2', color: '#168C78' },
  photographer: { icon: Camera, bg: '#FFF1EB', color: '#F26B3A' },
  'companion-duo': { icon: Users, bg: '#EEF2FF', color: '#3955A3' },
  bookworm: { icon: BookOpen, bg: '#E6F6F2', color: '#168C78' },
  trailblazer: { icon: Compass, bg: '#FEF6E4', color: '#D99B1E' },
}

const BADGE_TONE_STYLE = {
  orange: { bg: '#FFF1EB', color: '#F26B3A' },
  teal: { bg: '#E6F6F2', color: '#168C78' },
  navy: { bg: '#EEF2FF', color: '#16324A' },
  gold: { bg: '#FEF6E4', color: '#C58716' },
} as const

const PROFILE_COSMETIC_SLOT_META = [
  { slot: 'HEAD', label: 'HEAD', defaultName: null, icon: HardHat },
  { slot: 'BACK', label: 'BACK', defaultName: 'Balo mặc định', icon: Backpack },
  { slot: 'HAND_RIGHT', label: 'HAND', defaultName: null, icon: Glasses },
  { slot: 'NECK', label: 'NECK', defaultName: 'Khăn đỏ (mặc định)', icon: Sparkles },
  { slot: 'BODY', label: 'BODY', defaultName: null, icon: Shirt },
  { slot: 'FACE', label: 'FACE', defaultName: null, icon: Smile },
] as const

export function ProfileBoundaryPage() {
  const { userId: routeUserId } = useParams<{ userId?: string }>()

  const authUser = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken.trim()))
  const setSession = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)

  const isMockSession = useMockProfileStore((s) => s.isMockSession)
  const mockProfile = useMockProfileStore((s) => s.profile)
  const mockStats = useMockProfileStore((s) => s.stats)
  const lastSavedAt = useMockProfileStore((s) => s.lastSavedAt)
  const activateMockSession = useMockProfileStore((s) => s.activateMockSession)
  const deactivateMockSession = useMockProfileStore((s) => s.deactivateMockSession)
  const updateProfile = useMockProfileStore((s) => s.updateProfile)
  const resetProfile = useMockProfileStore((s) => s.resetProfile)

  const albums = useAlbumStore((s) => s.albums)
  const photos = useAlbumStore((s) => s.photos)
  const companion = useOptionalCompanion()
  const userQuery = useUserMeQuery()
  const todayQuery = useTodayQuery()

  const liveCosmeticSlots = useMemo(() => {
    const equipped = companion?.equippedCosmetics ?? {}
    return PROFILE_COSMETIC_SLOT_META.map((meta) => {
      const itemId = equipped[meta.slot]
      const catalogItem = itemId ? getCatalogItemById(itemId) : undefined
      if (catalogItem) {
        return {
          slot: meta.label,
          name: catalogItem.displayNameVi,
          icon: meta.icon,
          equipped: true,
        }
      }
      if (meta.defaultName) {
        return {
          slot: meta.label,
          name: meta.defaultName,
          icon: meta.icon,
          equipped: true,
        }
      }
      return {
        slot: meta.label,
        name: 'Trống',
        icon: meta.icon,
        equipped: false,
      }
    })
  }, [companion?.equippedCosmetics])

  const ownFoxOutfitCaption = useMemo(() => {
    const equipped = companion?.equippedCosmetics ?? {}
    const equippedIds = Object.values(equipped).filter(Boolean)
    if (equippedIds.length === 0) {
      return 'Trang phục mặc định · Khăn đỏ & Balo'
    }
    const matchedPreset = WARDROBE_OUTFIT_PRESETS.find((preset) => {
      const presetSlots = Object.entries(preset.slots)
      return (
        presetSlots.length === equippedIds.length &&
        presetSlots.every(([slot, id]) => equipped[slot as keyof typeof equipped] === id)
      )
    })
    if (matchedPreset) {
      return `Bộ ${matchedPreset.nameVi} · ${equippedIds.length} món`
    }
    return `Đang mặc ${equippedIds.length} món từ Tủ đồ`
  }, [companion?.equippedCosmetics])

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const [albumFilter, setAlbumFilter] = useState<AlbumTabFilter>('all')
  const [clothColor, setClothColor] = useState<ClothColor>('navy')
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [relationOverrides, setRelationOverrides] = useState<Record<string, ViewerRelation>>({})
  const [cheeredMoments, setCheeredMoments] = useState<Record<string, boolean>>({})
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActiveTab('overview')
    setMenuOpen(false)
  }, [routeUserId])

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const isOwnRoute = !routeUserId || routeUserId === 'me' || routeUserId === authUser?.id

  const otherProfileProjection = useMemo(() => {
    if (isOwnRoute) return null
    const raw =
      MOCK_OTHER_PROFILES.find((u) => u.slug === routeUserId || u.id === routeUserId) ?? null
    const override = raw ? relationOverrides[raw.id] : undefined
    return projectProfileForViewer(raw, override)
  }, [isOwnRoute, routeUserId, relationOverrides])

  const liveUser = userQuery.data?.source === 'LIVE' ? userQuery.data.data : null
  const liveToday = todayQuery.data?.source === 'LIVE' ? todayQuery.data.data : null
  const useMockSelf = isMockSession || !liveUser

  const ownDisplayName = useMockSelf
    ? mockProfile.displayName
    : liveUser?.profile?.displayName?.trim() || liveUser?.username || authUser?.username || 'Bạn'
  const ownHandle = useMockSelf
    ? mockProfile.username
    : liveUser?.username || authUser?.username || 'lifequest_user'
  const ownTitle = useMockSelf
    ? mockProfile.title
    : liveUser?.profile?.title?.trim() || 'Nhà thám hiểm rừng phong'
  const ownBio = useMockSelf
    ? mockProfile.bio
    : liveUser?.profile?.bio?.trim() || 'Mỗi ngày một bước nhỏ cùng Fox.'

  const ownStreak = useMockSelf ? mockStats.streakDays : liveToday?.streak.currentCount ?? 0
  const ownXp = useMockSelf ? mockStats.totalXp : liveToday?.gamification.totalXp ?? 0
  const ownLevel = useMockSelf ? mockStats.level : liveToday?.gamification.level ?? 1
  const ownNextXp = useMockSelf ? mockStats.nextLevelXp : Math.max(100, ownLevel * 200)
  const ownCoins = useMockSelf ? mockStats.coinBalance : liveToday?.gamification.coinBalance ?? 0
  const ownTasks = useMockSelf ? mockStats.completedTasks : liveToday?.summary.completedTasks ?? 0
  const ownQuests = useMockSelf ? mockStats.activeQuests : 0

  const ownAvatarSrc =
    mockProfile.customAvatarUrl ||
    PROFILE_AVATAR_PRESETS.find((p) => p.id === mockProfile.avatarPresetId)?.src ||
    null

  const handleMockLogout = () => {
    deactivateMockSession()
    clearSession()
    setToastMessage('Đã đăng xuất phiên kiểm thử Mock.')
  }

  const handleSaveProfile = async (next: EditableProfileData, nextCloth: ClothColor) => {
    setClothColor(nextCloth)
    if (!isMockSession && isAuthenticated && liveUser) {
      try {
        await usersApi.updateMe({
          displayName: next.displayName,
          title: next.title,
          bio: next.bio,
        })
        await userQuery.refetch()
      } catch {
        // Keep local preview fields updated cleanly
      }
    } else if (!isMockSession) {
      activateMockSession()
    }
    updateProfile(next)
    setSession({
      accessToken: isAuthenticated ? useAuthStore.getState().accessToken : 'mock-local-session-token',
      refreshToken: useAuthStore.getState().refreshToken,
      user: {
        id: authUser?.id || MOCK_LOGIN_CREDENTIALS.userId,
        email: authUser?.email || MOCK_LOGIN_CREDENTIALS.email,
        username: next.username,
        status: authUser?.status || 'ACTIVE',
      },
    })
    setEditDrawerOpen(false)
    setToastMessage('Đã lưu thay đổi hồ sơ thành công!')
  }

  const handleShareProfile = async (targetHandle: string) => {
    const url = `${window.location.origin}/profile/${encodeURIComponent(targetHandle)}`
    try {
      await navigator.clipboard?.writeText(url)
      setToastMessage(`Đã sao chép liên kết hồ sơ @${targetHandle}!`)
    } catch {
      setToastMessage(`Liên kết hồ sơ: ${url}`)
    }
  }

  const allAccessibleAlbumsCount = useMemo(() => {
    if (isOwnRoute) return albums.filter((a) => !a.revokedForViewer).length
    if (otherProfileProjection?.relation === 'FRIEND') {
      return albums.filter(
        (a) =>
          !a.revokedForViewer &&
          a.visibility !== 'PRIVATE' &&
          (a.ownerId === otherProfileProjection.userId || a.visibility === 'GROUP'),
      ).length
    }
    return 0
  }, [albums, isOwnRoute, otherProfileProjection])

  const photoCountByAlbum = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of photos) {
      if (p.isDeletedSource) continue
      for (const albumId of p.albumIds) {
        map.set(albumId, (map.get(albumId) ?? 0) + 1)
      }
    }
    return map
  }, [photos])

  const visibleAlbums = useMemo(() => {
    const base = isOwnRoute
      ? albums.filter((a) => !a.revokedForViewer)
      : otherProfileProjection?.relation === 'FRIEND'
        ? albums.filter(
            (a) =>
              !a.revokedForViewer &&
              a.visibility !== 'PRIVATE' &&
              (a.ownerId === otherProfileProjection.userId || a.visibility === 'GROUP'),
          )
        : []

    return base.filter((a) => {
      if (albumFilter === 'mine') return a.ownerId === (isOwnRoute ? 'self' : otherProfileProjection?.userId)
      if (albumFilter === 'group') return a.visibility === 'GROUP'
      if (albumFilter === 'quest') return Boolean(a.questTitle)
      return true
    })
  }, [albums, albumFilter, isOwnRoute, otherProfileProjection])

  const togglePinOwnBadge = (badgeId: string) => {
    const current = mockProfile.pinnedAchievementIds
    const next = current.includes(badgeId)
      ? current.filter((id) => id !== badgeId)
      : current.length < 3
        ? [...current, badgeId]
        : current
    updateProfile({ ...mockProfile, pinnedAchievementIds: next })
    setToastMessage('Đã cập nhật danh sách huy hiệu ghim (tối đa 3).')
  }

  // Neutral Not Found / Blocked Screen
  if (!isOwnRoute && otherProfileProjection?.isNeutralNotFound) {
    return (
      <div className={`${jStyles.journalSurface} ${styles.pageWrap}`} data-testid="profile-not-found">
        <section className={styles.neutralCard} aria-label="Không tìm thấy hồ sơ">
          <FoxStage mood="camp" compact caption="Hồ sơ này không khả dụng." />
          <h1 className={styles.displayName}>Không tìm thấy hồ sơ</h1>
          <p style={{ margin: 0, color: '#5A6B7A', fontSize: 13.5, maxWidth: 400 }}>
            Liên kết có thể không tồn tại, hồ sơ đang ở chế độ riêng tư hoặc bạn không có quyền xem
            trang này.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Link to="/profile" className={styles.btnPrimary}>
              Về hồ sơ của tôi
            </Link>
            <Link to="/" className={styles.btnSecondary}>
              Trang chủ
            </Link>
          </div>
        </section>
      </div>
    )
  }

  // Blocker Unblock Screen
  if (!isOwnRoute && otherProfileProjection?.isBlockerView) {
    return (
      <div className={`${jStyles.journalSurface} ${styles.pageWrap}`} data-testid="profile-blocked-view">
        <section className={styles.neutralCard} aria-label="Người dùng đã bị chặn">
          <span
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: '#fef3f2',
              color: '#b42318',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldOff size={24} aria-hidden="true" />
          </span>
          <h1 className={styles.displayName}>Bạn đã chặn {otherProfileProjection.displayName}</h1>
          <p style={{ margin: 0, color: '#5A6B7A', fontSize: 13.5, maxWidth: 420 }}>
            Họ không thể xem hồ sơ, Album hay gửi tin nhắn cho bạn. Bỏ chặn nếu bạn muốn khôi phục
            trạng thái người dùng thông thường.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button
              type="button"
              className={styles.btnPrimary}
              data-testid="profile-unblock-btn"
              onClick={() => {
                setRelationOverrides((prev) => ({
                  ...prev,
                  [otherProfileProjection.userId]: 'NON_FRIEND',
                }))
                setToastMessage(`Đã bỏ chặn ${otherProfileProjection.displayName}.`)
              }}
            >
              Bỏ chặn
            </button>
            <Link to="/profile" className={styles.btnSecondary}>
              Quay lại
            </Link>
          </div>
        </section>
      </div>
    )
  }

  const relation: ViewerRelation = isOwnRoute ? 'SELF' : otherProfileProjection!.relation
  const displayName = isOwnRoute ? ownDisplayName : otherProfileProjection!.displayName
  const handle = isOwnRoute ? ownHandle : otherProfileProjection!.username
  const decorativeTitle = isOwnRoute ? ownTitle : otherProfileProjection!.decorativeTitle
  const bio = isOwnRoute ? ownBio : otherProfileProjection!.bio
  const level = isOwnRoute ? ownLevel : otherProfileProjection!.level
  const totalXp = isOwnRoute ? ownXp : otherProfileProjection!.totalXp ?? 0
  const nextLevelXp = isOwnRoute ? ownNextXp : otherProfileProjection!.nextLevelXp ?? 100
  const xpPct = Math.min(100, Math.round((totalXp / Math.max(1, nextLevelXp)) * 100))
  const xpRemain = Math.max(0, nextLevelXp - totalXp)
  const streakDays = isOwnRoute ? ownStreak : otherProfileProjection!.streakDays
  const streakHidden = !isOwnRoute && Boolean(otherProfileProjection!.streakHiddenByOwner)
  const completedQuests = isOwnRoute ? ownQuests : otherProfileProjection!.completedQuests ?? 0
  const completedTasks = isOwnRoute ? ownTasks : otherProfileProjection!.completedTasks ?? 0
  const bannerCloth: ClothColor = isOwnRoute ? clothColor : otherProfileProjection!.coverColor
  const foxMood = isOwnRoute ? 'explorer' : otherProfileProjection!.foxMood
  const badgesList = isOwnRoute ? BASE_PROFILE_BADGES : otherProfileProjection!.badges
  const momentsList = isOwnRoute ? OWN_SAMPLE_MOMENTS : otherProfileProjection!.moments
  const canShowTabs = relation === 'SELF' || relation === 'FRIEND'

  return (
    <div
      className={`${jStyles.journalSurface} ${styles.pageWrap}`}
      data-testid="profile-page"
      data-viewer-relation={relation}
    >
      {/* Mock Session Bar (only when explicitly logged in with Mock account) */}
      {isOwnRoute && isMockSession && (
        <div className={styles.sessionStrip} data-testid="profile-mock-session-bar">
          <div className={styles.sessionLeft}>
            <span className={jStyles.previewChip}>TÀI KHOẢN MOCK</span>
            <span style={{ color: '#5A6B7A' }}>
              {MOCK_LOGIN_CREDENTIALS.email}
              {lastSavedAt ? ` · Đã lưu lúc ${lastSavedAt}` : ''}
            </span>
          </div>
          <div className={styles.sessionActions}>
            <button
              type="button"
              className={styles.btnPrimary}
              style={{ minHeight: 34, padding: '6px 12px', fontSize: 12 }}
              onClick={() => setEditDrawerOpen(true)}
              data-testid="profile-edit-btn"
            >
              <Pencil size={13} aria-hidden="true" /> Chỉnh sửa hồ sơ
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              style={{ minHeight: 34, padding: '6px 12px', fontSize: 12 }}
              onClick={handleMockLogout}
              data-testid="profile-logout-btn"
            >
              <LogOut size={13} aria-hidden="true" /> Đăng xuất
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className={styles.toastBanner} role="status" data-testid="profile-toast">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} color="#5EEAD4" aria-hidden="true" />
            {toastMessage}
          </span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Đóng thông báo"
            style={{ background: 'transparent', border: 'none', color: '#FBF7EF', cursor: 'pointer' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Top Navy Cloth Banner with Curved Dotted Route & Flags */}
      <ClothCover color={bannerCloth} bookmark={false} className={styles.journalBanner}>
        <div className={styles.bannerTopRow}>
          <span>NHẬT KÝ PHIÊU LƯU · {displayName.toUpperCase()} · 2026</span>
        </div>
        <svg className={styles.bannerRouteSvg} viewBox="0 0 960 40" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M 10 34 Q 240 6, 480 24 T 940 28"
            fill="none"
            stroke="rgba(251,247,239,0.5)"
            strokeWidth="2"
            strokeDasharray="4 7"
            strokeLinecap="round"
          />
          <line x1="220" y1="16" x2="220" y2="2" stroke="#FBF7EF" strokeWidth="1.8" />
          <polygon points="220,2 232,6 220,10" fill="#FBF7EF" opacity="0.85" />
          <line x1="530" y1="24" x2="530" y2="8" stroke="#FBF7EF" strokeWidth="1.8" />
          <polygon points="530,8 542,12 530,16" fill="#FBF7EF" opacity="0.85" />
          <line x1="820" y1="26" x2="820" y2="10" stroke="#F26B3A" strokeWidth="2" />
          <polygon points="820,10 834,15 820,20" fill="#F26B3A" />
        </svg>
      </ClothCover>

      {/* Main 2-Column Hero Overlapping Banner */}
      <div className={styles.heroGrid}>
        {/* LEFT COLUMN: Fox Companion Card */}
        <aside className={styles.foxSidebarCard} aria-label="Fox đồng hành">
          <div className={styles.foxCardHeader}>
            <span>Fox đồng hành</span>
          </div>

          <FoxStage
            mood={foxMood}
            compact
            badge={`★ Cấp ${level}`}
            caption={
              relation === 'SELF'
                ? ownFoxOutfitCaption
                : relation === 'FRIEND'
                  ? otherProfileProjection?.foxOutfitLabel
                  : 'Fox mặc định'
            }
          />

          {relation === 'SELF' && (
            <>
              <div className={styles.cosmeticGrid} aria-label="Ô trang phục Fox">
                {liveCosmeticSlots.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.slot}
                      title={`${item.slot}: ${item.name}`}
                      className={`${styles.cosmeticItem} ${!item.equipped ? styles.cosmeticItemEmpty : ''}`.trim()}
                    >
                      <span
                        className={`${styles.cosmeticIcon} ${!item.equipped ? styles.cosmeticIconEmpty : ''}`.trim()}
                        aria-hidden="true"
                      >
                        <Icon size={12} />
                      </span>
                      <span className={styles.cosmeticText}>
                        <span className={styles.cosmeticSlot}>{item.slot}</span>
                        <span className={styles.cosmeticName}>{item.name}</span>
                      </span>
                    </div>
                  )
                })}
              </div>

              <Link to="/wardrobe" className={styles.btnSecondary} style={{ width: '100%' }}>
                <ShoppingBag size={14} aria-hidden="true" /> Mở Tủ đồ Fox
              </Link>
            </>
          )}
        </aside>

        {/* RIGHT COLUMN: Identity Card + Tabs + Tab Content */}
        <div className={styles.mainColumn}>
          {/* 1. Identity Card */}
          <section className={styles.identityCard} aria-label="Thông tin nhà thám hiểm">
            <div className={styles.identityTop}>
              <div className={styles.identityLeft}>
                <div className={styles.avatarCircle} aria-hidden="true">
                  {isOwnRoute && ownAvatarSrc ? (
                    <img src={ownAvatarSrc} alt="" />
                  ) : (
                    getInitials(displayName)
                  )}
                </div>

                <div className={styles.nameBlock}>
                  <h1 className={styles.displayName} data-testid="profile-display-name">
                    {displayName}
                  </h1>

                  <div className={styles.handleRow}>
                    <span data-testid="profile-handle">@{handle}</span>
                    {decorativeTitle && (
                      <span className={styles.titleChip} data-testid="profile-title-badge">
                        <Award size={12} aria-hidden="true" />
                        <span>{decorativeTitle}</span>
                        {relation === 'SELF' && <DecorativeLabel />}
                      </span>
                    )}
                  </div>

                  {bio && (
                    <p
                      style={{ margin: '2px 0 0', fontSize: 13, lineHeight: 1.48, color: '#274258' }}
                      data-testid="profile-bio"
                    >
                      {bio}
                    </p>
                  )}

                  <div className={styles.metaRow}>
                    <span className={styles.metaItem}>
                      <Calendar size={12} aria-hidden="true" />
                      {isOwnRoute ? mockStats.joinedLabel : otherProfileProjection?.joinedLabel ?? 'Thành viên LifeQuest'}
                    </span>
                    {isOwnRoute && (
                      <>
                        <span className={styles.metaItem}>
                          <Users size={12} aria-hidden="true" /> 12 bạn bè
                        </span>
                        <span className={styles.metaItem}>
                          <Shield size={12} aria-hidden="true" /> Hồ sơ: Chỉ bạn bè
                        </span>
                      </>
                    )}
                    {!isOwnRoute && otherProfileProjection?.mutualFriendsLabel && (
                      <span className={styles.metaItem}>
                        <Users size={12} aria-hidden="true" /> {otherProfileProjection.mutualFriendsLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons by Viewer Relation */}
              <div className={styles.primaryActions}>
                {relation === 'SELF' && (
                  <>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={() => setEditDrawerOpen(true)}
                      data-testid="profile-hero-edit-btn"
                    >
                      <Pencil size={14} aria-hidden="true" /> Chỉnh sửa hồ sơ
                    </button>
                    <button
                      type="button"
                      className={styles.iconCircleBtn}
                      onClick={() => void handleShareProfile(handle)}
                      aria-label="Chia sẻ hồ sơ"
                    >
                      <Share2 size={15} aria-hidden="true" />
                    </button>
                  </>
                )}

                {relation === 'FRIEND' && otherProfileProjection && (
                  <>
                    <Link to="/messages" className={styles.btnTeal}>
                      <MessageCircle size={14} aria-hidden="true" /> Nhắn tin
                    </Link>
                    <Link to="/work/quests" className={styles.btnSecondary}>
                      <Swords size={14} aria-hidden="true" /> Thử thách
                    </Link>
                    <Link to="/album/shared/alb-books-2026" className={styles.btnSecondary}>
                      <BookOpen size={14} aria-hidden="true" /> Album
                    </Link>
                    <div ref={menuRef} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className={styles.iconCircleBtn}
                        aria-label="Tùy chọn khác"
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((v) => !v)}
                        data-testid="friend-more-btn"
                      >
                        <MoreHorizontal size={16} aria-hidden="true" />
                      </button>
                      {menuOpen && (
                        <div className={styles.overflowMenu} role="menu">
                          <button
                            type="button"
                            role="menuitem"
                            className={styles.overflowItem}
                            onClick={() => {
                              setMenuOpen(false)
                              void handleShareProfile(handle)
                            }}
                          >
                            <Share2 size={14} /> Chia sẻ liên kết
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className={styles.overflowItem}
                            onClick={() => {
                              setMenuOpen(false)
                              setRelationOverrides((p) => ({
                                ...p,
                                [otherProfileProjection.userId]: 'NON_FRIEND',
                              }))
                              setToastMessage(`Đã hủy kết bạn với ${displayName}.`)
                            }}
                          >
                            <UserMinus size={14} /> Hủy kết bạn
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className={styles.overflowItem}
                            style={{ color: '#b42318' }}
                            onClick={() => {
                              setMenuOpen(false)
                              setRelationOverrides((p) => ({
                                ...p,
                                [otherProfileProjection.userId]: 'BLOCKED',
                              }))
                            }}
                          >
                            <ShieldOff size={14} /> Chặn người dùng
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {relation === 'NON_FRIEND' && otherProfileProjection && (
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    data-testid="profile-send-request-btn"
                    onClick={() => {
                      setRelationOverrides((p) => ({
                        ...p,
                        [otherProfileProjection.userId]: 'PENDING_OUT',
                      }))
                      setToastMessage(`Đã gửi lời mời kết bạn tới ${displayName}.`)
                    }}
                  >
                    <UserPlus size={14} aria-hidden="true" /> Gửi lời mời kết bạn
                  </button>
                )}

                {relation === 'PENDING_IN' && otherProfileProjection && (
                  <>
                    <button
                      type="button"
                      className={styles.btnTeal}
                      data-testid="profile-accept-request-btn"
                      onClick={() => {
                        setRelationOverrides((p) => ({
                          ...p,
                          [otherProfileProjection.userId]: 'FRIEND',
                        }))
                        setToastMessage(`Bạn và ${displayName} đã trở thành bạn bè!`)
                      }}
                    >
                      <Check size={14} aria-hidden="true" /> Chấp nhận
                    </button>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      data-testid="profile-decline-request-btn"
                      onClick={() => {
                        setRelationOverrides((p) => ({
                          ...p,
                          [otherProfileProjection.userId]: 'NON_FRIEND',
                        }))
                        setToastMessage('Đã từ chối lời mời kết bạn.')
                      }}
                    >
                      Từ chối
                    </button>
                  </>
                )}

                {relation === 'PENDING_OUT' && otherProfileProjection && (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    data-testid="profile-cancel-request-btn"
                    onClick={() => {
                      setRelationOverrides((p) => ({
                        ...p,
                        [otherProfileProjection.userId]: 'NON_FRIEND',
                      }))
                      setToastMessage('Đã hủy lời mời kết bạn.')
                    }}
                  >
                    <UserCheck size={14} aria-hidden="true" /> Hủy lời mời đã gửi
                  </button>
                )}
              </div>
            </div>

            {(relation === 'PENDING_IN' || relation === 'PENDING_OUT') &&
              otherProfileProjection?.pendingTimeLabel && (
                <div className={styles.pendingBanner} data-testid="profile-pending-banner">
                  <strong>{otherProfileProjection.pendingTimeLabel}</strong>
                  {otherProfileProjection.pendingMessage && (
                    <span>&ldquo;{otherProfileProjection.pendingMessage}&rdquo;</span>
                  )}
                </div>
              )}
          </section>

          {/* 2. Standalone Capsule Tabs (SELF & FRIEND only) */}
          {canShowTabs && (
            <div className={styles.tabsCapsule} role="tablist" aria-label="Các mục hồ sơ">
              {(
                [
                  { id: 'overview', label: 'Tổng quan' },
                  { id: 'badges', label: 'Huy hiệu' },
                  { id: 'album', label: 'Album' },
                  { id: 'moments', label: 'Moments' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  data-testid={`profile-tab-${tab.id}`}
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`.trim()}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Non-Friend / Pending Restricted Body */}
          {!canShowTabs && (
            <>
              <section className={styles.sectionCard} aria-label="Huy hiệu ghim">
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Huy hiệu ghim</h2>
                  <span style={{ fontSize: 12, color: '#5A6B7A' }}>Công khai · Tối đa 3</span>
                </div>
                <div className={styles.badgeGrid3x3}>
                  {badgesList.map((b) => (
                    <div key={b.id} className={`${styles.badgeTile} ${styles.badgeTilePinned}`}>
                      <span className={styles.badgeIconCircle} style={{ background: '#FFF1EB', color: '#F26B3A' }}>
                        <Flame size={16} aria-hidden="true" />
                      </span>
                      <strong style={{ fontSize: 12.5 }}>{b.title}</strong>
                      <span style={{ fontSize: 11, color: '#5A6B7A' }}>{b.tier}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.sectionCard} aria-label="Album và Moments giới hạn">
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Album &amp; Moments</h2>
                </div>
                <div className={styles.lockPanel} data-testid="profile-restricted-lock">
                  <Lock size={20} aria-hidden="true" />
                  <strong>Chỉ bạn bè của {displayName} mới xem được</strong>
                  <span style={{ fontSize: 12.5 }}>
                    Kết bạn để cùng xem Album kỷ niệm và Moments chia sẻ cho bạn bè.
                  </span>
                </div>
              </section>
            </>
          )}

          {/* TAB 1: OVERVIEW (1:1 with Claude P-Own reference) */}
          {canShowTabs && activeTab === 'overview' && (
            <>
              {/* XP Level Strip */}
              <section className={styles.xpCard} aria-label="Tiến độ cấp độ và XP">
                <div className={styles.levelShield}>
                  <span className={styles.levelShieldLabel}>CẤP</span>
                  <span className={styles.levelShieldNum}>{level}</span>
                </div>
                <div className={styles.xpMiddle}>
                  <div className={styles.xpMetaRow}>
                    <strong style={{ color: '#16324A' }}>
                      {totalXp.toLocaleString('vi-VN')} / {nextLevelXp.toLocaleString('vi-VN')} XP
                    </strong>
                    <span style={{ color: '#6B7885' }}>
                      còn {xpRemain.toLocaleString('vi-VN')} XP lên Cấp {level + 1}
                    </span>
                  </div>
                  <div className={styles.xpBarTrack} role="progressbar" aria-valuenow={xpPct} aria-valuemin={0} aria-valuemax={100}>
                    <div className={styles.xpBarFill} style={{ width: `${xpPct}%` }} />
                  </div>
                </div>
                {relation === 'SELF' && (
                  <span className={styles.coinPill}>
                    <Coins size={13} aria-hidden="true" /> {ownCoins} Xu
                  </span>
                )}
              </section>

              {/* 4-Column Ticket Stats Row */}
              <div className={styles.ticketGrid}>
                {streakHidden ? (
                  <div
                    className={styles.ticketCard}
                    style={{ borderStyle: 'dashed', background: '#FBF7EF' }}
                    data-testid="ticket-stat-hidden"
                  >
                    <span className={styles.ticketTopLabel}>
                      <Lock size={11} aria-hidden="true" /> STREAK HIỆN TẠI
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7885' }}>
                      Đã ẩn bởi chủ hồ sơ
                    </span>
                  </div>
                ) : (
                  <div className={styles.ticketCard}>
                    <span className={styles.ticketTopLabel}>
                      <Flame size={12} color="#F26B3A" aria-hidden="true" /> STREAK HIỆN TẠI
                    </span>
                    <span className={styles.ticketBigVal}>{streakDays ?? 0} ngày</span>
                  </div>
                )}

                <div className={styles.ticketCard}>
                  <span className={styles.ticketTopLabel}>
                    <Flag size={12} color="#F26B3A" aria-hidden="true" /> QUEST VỀ ĐÍCH
                  </span>
                  <span className={styles.ticketBigVal}>{completedQuests}</span>
                </div>

                <div className={styles.ticketCard}>
                  <span className={styles.ticketTopLabel}>
                    <CheckCircle2 size={12} color="#168C78" aria-hidden="true" /> TASK HOÀN THÀNH
                  </span>
                  <span className={styles.ticketBigVal}>{completedTasks}</span>
                </div>

                <div className={styles.ticketCard}>
                  <span className={styles.ticketTopLabel}>
                    <Trophy size={12} color="#D99B1E" aria-hidden="true" /> HUY HIỆU
                  </span>
                  <span className={styles.ticketBigVal}>
                    {badgesList.filter((b) => b.earned).length}/{badgesList.length}
                  </span>
                </div>
              </div>

              {/* Streak & Quest Milestones (Badges, Album, and Moments live in their dedicated tabs) */}
              <section className={styles.sectionCard} aria-label="Thành tích Streak và Quest">
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Thành tích Streak &amp; Quest</h2>
                </div>
                <div className={styles.milestoneList}>
                  <div className={styles.milestoneRow}>
                    <div className={styles.milestoneCardHead}>
                      <span className={styles.badgeIconCircle} style={{ background: '#FFF1EB', color: '#F26B3A' }}>
                        <Flame size={15} aria-hidden="true" />
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7885' }}>08/11</span>
                    </div>
                    <div>
                      <strong style={{ fontSize: 12.5, display: 'block', lineHeight: 1.3 }}>
                        Chuỗi dài nhất: 24 ngày
                      </strong>
                      <span style={{ fontSize: 11, color: '#6B7885' }}>
                        {streakHidden ? 'Chuỗi hiện tại đang ẩn' : `Hiện tại ${streakDays ?? 0} ngày liên tiếp`}
                      </span>
                    </div>
                  </div>

                  <div className={styles.milestoneRow}>
                    <div className={styles.milestoneCardHead}>
                      <span className={styles.badgeIconCircle} style={{ background: '#FEF6E4', color: '#D99B1E' }}>
                        <Flag size={15} aria-hidden="true" />
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7885' }}>02/11</span>
                    </div>
                    <div>
                      <strong style={{ fontSize: 12.5, display: 'block', lineHeight: 1.3 }}>
                        Về đích &ldquo;Chạy 10km đầu tiên&rdquo;
                      </strong>
                      <span style={{ fontSize: 11, color: '#6B7885' }}>5/5 chặng · +500 XP</span>
                    </div>
                  </div>

                  <div className={styles.milestoneRow}>
                    <div className={styles.milestoneCardHead}>
                      <span className={styles.badgeIconCircle} style={{ background: '#E6F6F2', color: '#168C78' }}>
                        <Compass size={15} aria-hidden="true" />
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#168C78' }}>Đang đi</span>
                    </div>
                    <div>
                      <strong style={{ fontSize: 12.5, display: 'block', lineHeight: 1.3 }}>
                        Quest &ldquo;Đạt IELTS 6.5&rdquo;
                      </strong>
                      <span style={{ fontSize: 11, color: '#6B7885' }}>Chặng 3/5 · Luyện nghe</span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* TAB 2: BADGES */}
          {canShowTabs && activeTab === 'badges' && (
            <div className={styles.badgesSplit} data-testid="profile-badges-panel">
              <section className={styles.sectionCard} aria-label="Huy hiệu đã đạt">
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    Huy hiệu đã đạt · {badgesList.filter((b) => b.earned).length}/{badgesList.length}
                  </h2>
                  {relation === 'SELF' && (
                    <span style={{ fontSize: 11.5, color: '#5A6B7A' }}>
                      Ghim tối đa 3 ({mockProfile.pinnedAchievementIds.length}/3)
                    </span>
                  )}
                </div>
                <div className={styles.badgeGrid4x3}>
                  {badgesList.map((b) => {
                    const isPinned = mockProfile.pinnedAchievementIds.includes(b.id)
                    const pct = Math.min(100, Math.round((b.current / b.target) * 100))
                    const visual = BADGE_VISUALS[b.id]
                    const Icon = visual?.icon ?? Trophy
                    const tone = visual ?? BADGE_TONE_STYLE[b.tone]
                    return (
                      <div
                        key={b.id}
                        title={b.description}
                        className={`${styles.badgeTile} ${isPinned ? styles.badgeTilePinned : ''} ${!b.earned ? styles.badgeTileLocked : ''}`.trim()}
                      >
                        {relation === 'SELF' && b.earned && (
                          <button
                            type="button"
                            onClick={() => togglePinOwnBadge(b.id)}
                            className={`${styles.badgePinBtn} ${isPinned ? styles.badgePinBtnActive : ''}`.trim()}
                            aria-label={isPinned ? `Bỏ ghim ${b.title}` : `Ghim ${b.title}`}
                            title={isPinned ? 'Đang ghim (nhấn để bỏ)' : 'Ghim huy hiệu'}
                          >
                            <Pin size={10} aria-hidden="true" />
                          </button>
                        )}
                        <span
                          className={styles.badgeIconCircle}
                          style={{
                            width: 28,
                            height: 28,
                            background: b.earned ? tone.bg : '#EFEFEF',
                            color: b.earned ? tone.color : '#8C99A6',
                          }}
                        >
                          <Icon size={14} aria-hidden="true" />
                        </span>
                        <strong
                          style={{
                            fontSize: 11,
                            lineHeight: 1.2,
                            color: '#16324A',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                          }}
                        >
                          {b.title}
                        </strong>
                        <span style={{ fontSize: 10, color: '#5A6B7A' }}>
                          {b.earned ? b.tier : `${b.current}/${b.target}`}
                        </span>
                        {!b.earned && (
                          <div className={styles.progressTrack} aria-label={`${b.title} ${pct}%`}>
                            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className={styles.sectionCard} aria-label="Danh hiệu trang trí">
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Danh hiệu trang trí</h2>
                  <DecorativeLabel />
                </div>
                <p style={{ margin: 0, fontSize: 11.5, color: '#5A6B7A', lineHeight: 1.35 }}>
                  Danh hiệu chỉ mang tính trang trí trên hồ sơ, không ảnh hưởng điểm thưởng.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {DECORATIVE_TITLES_MOCK.map((dt) => {
                    const isEquipped = dt.name === decorativeTitle
                    return (
                      <div
                        key={dt.id}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 12,
                          background: isEquipped ? '#FFF9F2' : '#FAF8F4',
                          border: isEquipped
                            ? '1px solid rgba(242,107,58,0.28)'
                            : '1px solid rgba(22,50,74,0.09)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                      >
                        <strong style={{ fontSize: 12, color: '#16324A' }}>{dt.name}</strong>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: isEquipped ? '#B84317' : '#5A6B7A',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isEquipped ? 'Đang dùng' : dt.owned ? 'Đã sở hữu' : `${dt.costCoins} Xu`}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <Link
                  to="/wardrobe"
                  className={styles.btnSecondary}
                  style={{ width: '100%', minHeight: 32, fontSize: 12 }}
                >
                  <ShoppingBag size={13} aria-hidden="true" /> Mở Tủ đồ Fox
                </Link>
              </section>
            </div>
          )}

          {/* TAB 3: ALBUM (Matches illustrated cloth-journal reference, 1-page fit) */}
          {canShowTabs && activeTab === 'album' && (
            <section className={styles.sectionCard} data-testid="profile-album-panel">
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Các cuốn sổ</h2>
                <Link
                  to="/album"
                  style={{ fontSize: 12, fontWeight: 700, color: '#B84317', textDecoration: 'none' }}
                >
                  Mở Album đầy đủ →
                </Link>
              </div>

              <div className={styles.albumControlsRow}>
                <div className={styles.albumFilterCapsule} role="group" aria-label="Lọc album">
                  {(
                    [
                      { id: 'all', label: `Tất cả · ${allAccessibleAlbumsCount}` },
                      { id: 'mine', label: 'Của tôi' },
                      { id: 'group', label: 'Nhóm' },
                      { id: 'quest', label: 'Quest' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setAlbumFilter(f.id)}
                      className={`${styles.albumFilterBtn} ${albumFilter === f.id ? styles.albumFilterBtnActive : ''}`.trim()}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {relation === 'SELF' && (
                  <Link
                    to="/album?action=create"
                    className={styles.btnPrimary}
                    style={{ minHeight: 30, padding: '5px 12px', fontSize: 12, borderRadius: 11 }}
                  >
                    <Plus size={13} aria-hidden="true" /> Tạo album
                  </Link>
                )}
              </div>

              {visibleAlbums.length === 0 ? (
                <div className={styles.lockPanel}>
                  <BookOpen size={20} aria-hidden="true" />
                  <strong>Chưa có album phù hợp bộ lọc này</strong>
                </div>
              ) : (
                <div className={styles.albumShelfGrid}>
                  {visibleAlbums.map((alb) => {
                    const count = photoCountByAlbum.get(alb.id) ?? 0
                    const countLabel = alb.isAutoEvidence
                      ? `${count} ảnh · tự gom`
                      : alb.members?.length
                        ? `${count} ảnh · ${alb.members.length} người`
                        : `${count} ảnh`
                    return (
                      <Link
                        key={alb.id}
                        to={alb.ownerId === 'self' ? `/album/${alb.id}` : `/album/shared/${alb.id}`}
                        className={styles.albumBookItem}
                      >
                        <ClothCover
                          color={alb.coverColor}
                          bookmark={false}
                          elasticBand={false}
                          className={styles.albumBookCover}
                        >
                          <div className={styles.albumCoverFrame}>
                            <JournalIllustration kind={alb.coverIllustration} alt={alb.title} />
                          </div>
                          <h3 className={styles.albumBookTitle}>{alb.title}</h3>
                        </ClothCover>

                        <div className={styles.albumBookMeta}>
                          <span className={styles.albumCountText}>{countLabel}</span>
                          <PrivacyPill visibility={alb.visibility} />
                        </div>

                        {(alb.questTitle || alb.isAutoEvidence) && (
                          <div className={styles.albumSubTagRow}>
                            {alb.questTitle && (
                              <span className={styles.albumQuestTag}>
                                <Flag size={9} aria-hidden="true" /> Liên kết Quest
                              </span>
                            )}
                            {alb.isAutoEvidence && (
                              <span className={styles.albumPrivateTag}>
                                <Lock size={9} aria-hidden="true" /> Luôn riêng tư
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}

              <p className={styles.albumFooterNote}>
                Khách xem hồ sơ chỉ thấy album hợp với quyền của họ: bạn bè thấy album &ldquo;Bạn bè&rdquo;, thành viên nhóm thấy album &ldquo;Nhóm&rdquo;.
              </p>
            </section>
          )}

          {/* TAB 4: MOMENTS */}
          {canShowTabs && activeTab === 'moments' && (
            <section className={styles.sectionCard} data-testid="profile-moments-panel">
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Moments đã chia sẻ</h2>
                  <span style={{ fontSize: 12, color: '#5A6B7A' }}>
                    Chỉ hiển thị các khoảnh khắc chủ hồ sơ chủ động chia sẻ.
                  </span>
                </div>
                {relation === 'SELF' && (
                  <Link
                    to="/album?action=upload"
                    className={styles.btnPrimary}
                    style={{ minHeight: 34, padding: '6px 12px', fontSize: 12 }}
                  >
                    <Plus size={14} aria-hidden="true" /> Tạo Moment
                  </Link>
                )}
              </div>

              {momentsList.length === 0 ? (
                <div className={styles.lockPanel}>
                  <Sparkles size={20} aria-hidden="true" />
                  <strong>Chưa có Moment công khai nào</strong>
                </div>
              ) : (
                <div className={styles.momentsGrid}>
                  {momentsList.map((m) => {
                    const cheered = Boolean(cheeredMoments[m.id] ?? m.cheeredByMe)
                    const count =
                      m.cheerCount +
                      (cheered && !m.cheeredByMe ? 1 : !cheered && m.cheeredByMe ? -1 : 0)
                    return (
                      <article key={m.id} className={styles.momentCard}>
                        <MountedPhoto
                          illustrationKey={m.illustrationKey}
                          alt={`Khoảnh khắc: ${m.caption}`}
                          visibility={m.visibility}
                          corners={false}
                        />
                        <div className={styles.momentBody}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#168C78' }}>
                            {m.questTitle} · {m.dateLabel}
                          </span>
                          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>{m.caption}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            <span style={{ fontSize: 11, color: '#5A6B7A' }}>Dữ liệu minh họa</span>
                            <button
                              type="button"
                              className={styles.viewerPill}
                              aria-pressed={cheered}
                              onClick={() =>
                                setCheeredMoments((p) => ({ ...p, [m.id]: !cheered }))
                              }
                            >
                              <Heart
                                size={12}
                                fill={cheered ? '#F26B3A' : 'none'}
                                color={cheered ? '#F26B3A' : '#16324A'}
                                style={{ verticalAlign: '-2px', marginRight: 4 }}
                              />
                              Cổ vũ ({count})
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Right-Side Edit Profile Drawer */}
      <ProfileEditDrawer
        open={editDrawerOpen}
        initialData={mockProfile}
        achievementOptions={BASE_PROFILE_BADGES.map((a) => ({ id: a.id, title: a.title }))}
        isLiveBackend={Boolean(liveUser)}
        onSave={(next, nextCloth) => void handleSaveProfile(next, nextCloth)}
        onReset={() => {
          resetProfile()
          setToastMessage('Đã khôi phục hồ sơ Mock về mặc định.')
        }}
        onClose={() => setEditDrawerOpen(false)}
      />
    </div>
  )
}
