import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Bell,
  Calendar,
  ChevronDown,
  Home,
  Layers,
  LogIn,
  MessageCircle,
  Search,
  Settings,
  ShoppingBag,
  Sparkles
} from 'lucide-react'
import { useTodayQuery, useUserMeQuery } from '@/hooks/useDashboardData'
import { useAuthStore } from '@/stores/authStore'
import { PROFILE_AVATAR_PRESETS, useMockProfileStore } from '@/stores/mockProfileStore'
import { useUiStore } from '@/stores/uiStore'
import styles from './DesktopHeader.module.css'

const HEADER_NAV = [
  { to: '/', label: 'Trang chủ', icon: Home, end: true },
  { to: '/work', label: 'Công việc', icon: Layers, end: false },
  { to: '/calendar', label: 'Lịch', icon: Calendar, end: false },
  { to: '/wardrobe', label: 'Tủ đồ Fox', icon: ShoppingBag, end: false },
  { to: '/messages', label: 'Tin nhắn', icon: MessageCircle, end: false },
  { to: '/settings', label: 'Cài đặt', icon: Settings, end: false }
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'LQ'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export interface DesktopHeaderProps {
  onLogout: () => void
}

export function DesktopHeader({ onLogout }: DesktopHeaderProps) {
  const openSheet = useUiStore((s) => s.openSheet)
  const searchQuery = useUiStore((s) => s.searchQuery)
  const setSearchQuery = useUiStore((s) => s.setSearchQuery)

  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken.trim()))
  const authUser = useAuthStore((s) => s.user)
  const isMockSession = useMockProfileStore((s) => s.isMockSession)
  const isSignedIn = isAuthenticated || isMockSession
  const mockProfile = useMockProfileStore((s) => s.profile)
  const mockStats = useMockProfileStore((s) => s.stats)

  // Read live user identity & level only when authenticated
  const userMeQuery = useUserMeQuery()
  const todayQuery = useTodayQuery()

  const [profileOpen, setProfileOpen] = useState(false)
  const profileWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profileOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (profileWrapRef.current && !profileWrapRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [profileOpen])

  const liveUser =
    isAuthenticated && userMeQuery.data?.source === 'LIVE' ? userMeQuery.data.data : null
  const liveToday =
    isAuthenticated && todayQuery.data?.source === 'LIVE' ? todayQuery.data.data : null
  const currentLevel = isMockSession
    ? mockStats.level
    : liveToday?.gamification.level ?? 1

  const displayName = isMockSession
    ? mockProfile.displayName
    : liveUser?.profile?.displayName?.trim() ||
      liveUser?.username?.trim() ||
      authUser?.username?.trim() ||
      'Bạn'
  const initials = getInitials(displayName)
  const avatarSrc = isMockSession
    ? mockProfile.customAvatarUrl ||
      PROFILE_AVATAR_PRESETS.find((p) => p.id === mockProfile.avatarPresetId)?.src ||
      PROFILE_AVATAR_PRESETS[0].src
    : null
  const isCustomPhoto = Boolean(isMockSession && mockProfile.customAvatarUrl)
  const bubbleSubtitle = isMockSession
    ? `Cấp ${mockStats.level} · @${mockProfile.username}`
    : 'Tài khoản đã đăng nhập'

  return (
    <header className={styles.desktopHeader} data-testid="desktop-canvas-header">
      <div className={styles.grid}>
        {/* Group 1: Brand Island */}
        <Link to="/" className={styles.brandIsland} aria-label="LifeQuest – Trang chủ">
          <svg viewBox="0 0 48 40" width="32" height="27" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M6 6L16 17L7 24L6 6Z" fill="#F26B3A" />
            <path d="M42 6L32 17L41 24L42 6Z" fill="#F26B3A" />
            <ellipse cx="24" cy="23" rx="15" ry="13" fill="#F26B3A" />
            <path d="M12 25C16 21 32 21 36 25C34 32 29 36 24 36C19 36 14 32 12 25Z" fill="#FFF4E8" />
            <circle cx="19" cy="22" r="2.2" fill="#16324A" />
            <circle cx="29" cy="22" r="2.2" fill="#16324A" />
            <path d="M22 27L24 29L26 27" stroke="#16324A" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
          <span className={styles.brandText}>
            Life<span className={styles.brandQuest}>Quest</span>
          </span>
        </Link>

        {/* Group 2: Center Navigation Island */}
        <nav className={styles.navIsland} aria-label="Điều hướng nhanh">
          {HEADER_NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                aria-label={item.label}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`.trim()
                }
              >
                <Icon size={20} strokeWidth={1.85} aria-hidden="true" />
                <span className={styles.tip} aria-hidden="true">
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </nav>

        {/* Group 3: Utility Island */}
        <div className={styles.utilityIsland}>
          <label className={styles.searchBox}>
            <Search size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
            <span className="sr-only">Tìm kiếm nhiệm vụ</span>
            <input
              type="search"
              className={styles.searchInput}
              aria-label="Tìm kiếm nhiệm vụ"
              placeholder="Tìm nhiệm vụ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>

          <button
            type="button"
            className={styles.circleBtn}
            onClick={() => openSheet('notifications')}
            aria-label="Thông báo"
          >
            <Bell size={18} aria-hidden="true" />
          </button>

          {isSignedIn && (
            <Link
              to="/profile"
              className={styles.levelBadge}
              aria-label={`Cấp độ hiện tại: Lv.${currentLevel}`}
              title={`Cấp ${currentLevel}`}
              data-testid="desktop-header-level-badge"
            >
              <Sparkles size={13} aria-hidden="true" />
              <span>Lv.{currentLevel}</span>
            </Link>
          )}

          {isSignedIn ? (
            <div className={styles.profileWrap} ref={profileWrapRef}>
              <button
                type="button"
                className={styles.profileBtn}
                aria-label={`Tài khoản của ${displayName}`}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                onClick={() => setProfileOpen((v) => !v)}
                data-testid="desktop-header-profile-btn"
              >
                <span className={styles.avatar} aria-hidden="true">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt=""
                      className={isCustomPhoto ? styles.avatarImgCover : styles.avatarImgFox}
                    />
                  ) : (
                    initials
                  )}
                </span>
                <span className={styles.uname}>{displayName}</span>
                <ChevronDown size={14} color="#667085" aria-hidden="true" />
              </button>

              {profileOpen && (
                <div className={styles.bubble} role="menu" aria-label="Tài khoản">
                  <div className={styles.bubbleHead}>
                    <span className={styles.avatar} aria-hidden="true">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt=""
                          className={isCustomPhoto ? styles.avatarImgCover : styles.avatarImgFox}
                        />
                      ) : (
                        initials
                      )}
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span className={styles.bubbleName}>{displayName}</span>
                      <span className={styles.bubbleLevel}>{bubbleSubtitle}</span>
                    </span>
                  </div>

                  <nav className={styles.bubbleMenu} aria-label="Menu tài khoản">
                    <Link
                      to="/profile"
                      className={styles.bubbleLink}
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                    >
                      Trang cá nhân
                    </Link>
                    <Link
                      to="/album"
                      className={styles.bubbleLink}
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                    >
                      Sổ kỷ niệm &amp; Album
                    </Link>
                    <Link
                      to="/settings"
                      className={styles.bubbleLink}
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                    >
                      Cài đặt tài khoản
                    </Link>
                    <Link
                      to="/wardrobe"
                      className={styles.bubbleLink}
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                    >
                      Tủ đồ Fox
                    </Link>
                    <button
                      type="button"
                      className={`${styles.bubbleLink} ${styles.bubbleLogout}`}
                      role="menuitem"
                      onClick={() => {
                        setProfileOpen(false)
                        onLogout()
                      }}
                    >
                      Đăng xuất
                    </button>
                  </nav>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={styles.loginBtn}>
              <LogIn size={15} aria-hidden="true" />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
