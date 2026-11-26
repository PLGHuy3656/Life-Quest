import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  Calendar,
  CheckCircle2,
  Coins,
  Compass,
  Flame,
  Heart,
  LogIn,
  LogOut,
  MailPlus,
  MapPin,
  PawPrint,
  Pencil,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'
import { useTodayQuery, useUserMeQuery } from '@/hooks/useDashboardData'
import { useAuthStore } from '@/stores/authStore'
import {
  MOCK_LOGIN_CREDENTIALS,
  PROFILE_AVATAR_PRESETS,
  PROFILE_COVER_THEMES,
  useMockProfileStore,
  type EditableProfileData,
} from '@/stores/mockProfileStore'
import { ProfileEditModal } from './ProfileEditModal'
import styles from './ProfilePage.module.css'

type AchievementFilter = 'all' | 'unlocked' | 'in_progress'

export function ProfileBoundaryPage() {
  const authUser = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken.trim()))
  const setSession = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)

  const isMockSession = useMockProfileStore((s) => s.isMockSession)
  const mockProfile = useMockProfileStore((s) => s.profile)
  const mockStats = useMockProfileStore((s) => s.stats)
  const mockFriends = useMockProfileStore((s) => s.friends)
  const lastSavedAt = useMockProfileStore((s) => s.lastSavedAt)
  const activateMockSession = useMockProfileStore((s) => s.activateMockSession)
  const deactivateMockSession = useMockProfileStore((s) => s.deactivateMockSession)
  const updateProfile = useMockProfileStore((s) => s.updateProfile)
  const toggleFollowFriend = useMockProfileStore((s) => s.toggleFollowFriend)
  const resetProfile = useMockProfileStore((s) => s.resetProfile)

  const userQuery = useUserMeQuery()
  const todayQuery = useTodayQuery()

  const [followTab, setFollowTab] = useState<'following' | 'followers'>('following')
  const [friendSearchOpen, setFriendSearchOpen] = useState(false)
  const [friendQuery, setFriendQuery] = useState('')
  const [achFilter, setAchFilter] = useState<AchievementFilter>('all')
  const [showAllAchievements, setShowAllAchievements] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [friendNotice, setFriendNotice] = useState<string | null>(null)

  const user = userQuery.data?.data
  const liveToday = todayQuery.data?.source === 'LIVE' ? todayQuery.data.data : null
  const useMockData = isMockSession || (!user && !liveToday && isAuthenticated)

  const displayName = useMockData
    ? mockProfile.displayName
    : user?.profile?.displayName?.trim() ||
      user?.username ||
      authUser?.username ||
      'Thành viên LifeQuest'
  const handle = useMockData
    ? mockProfile.username
    : user?.username || authUser?.username || 'lifequest_user'
  const userTitle = useMockData
    ? mockProfile.title
    : user?.profile?.title?.trim() || 'Nhà thám hiểm LifeQuest'
  const bio = useMockData
    ? mockProfile.bio
    : 'Chưa có mô tả cá nhân. Đăng nhập tài khoản Mock hoặc kết nối Backend để chỉnh sửa hồ sơ.'
  const location = useMockData ? mockProfile.location : ''
  const focusGoal = useMockData ? mockProfile.focusGoal : ''
  const joinedLabel = useMockData ? mockStats.joinedLabel : 'Thành viên LifeQuest · Đồng hành cùng Fox V2'

  const coverTheme =
    PROFILE_COVER_THEMES.find((t) => t.id === (useMockData ? mockProfile.coverTheme : 'sunrise')) ??
    PROFILE_COVER_THEMES[0]
  const isDarkBanner = coverTheme.id === 'twilight'

  const avatarSrc = useMockData
    ? mockProfile.customAvatarUrl ||
      PROFILE_AVATAR_PRESETS.find((p) => p.id === mockProfile.avatarPresetId)?.src ||
      PROFILE_AVATAR_PRESETS[0].src
    : '/fox_poster.png'
  const isCustomPhoto = Boolean(useMockData && mockProfile.customAvatarUrl)

  const streakDays = useMockData ? mockStats.streakDays : liveToday?.streak.currentCount ?? 0
  const totalXp = useMockData ? mockStats.totalXp : liveToday?.gamification.totalXp ?? 0
  const nextLevelXp = useMockData ? mockStats.nextLevelXp : Math.max(100, (liveToday?.gamification.level ?? 1) * 350)
  const coinBalance = useMockData ? mockStats.coinBalance : liveToday?.gamification.coinBalance ?? 0
  const level = useMockData ? mockStats.level : liveToday?.gamification.level ?? 1
  const completedTasks = useMockData ? mockStats.completedTasks : 0
  const activeQuests = useMockData ? mockStats.activeQuests : 0
  const activeHabits = useMockData ? mockStats.activeHabits : 0

  const achievements = useMemo(
    () => [
      {
        id: 'streak-fire',
        title: 'Lửa rừng',
        tier: 'CẤP 2',
        current: Math.min(streakDays, 7),
        target: 7,
        desc: 'Đạt chuỗi 7 ngày liên tiếp cùng Fox V2',
        tone: 'badgeFire' as const,
        icon: Flame,
      },
      {
        id: 'xp-master',
        title: 'Cao nhân',
        tier: 'CẤP 2',
        current: Math.min(totalXp, 1000),
        target: 1000,
        desc: 'Tích lũy đủ 1.000 điểm KN (XP)',
        tone: 'badgeSage' as const,
        icon: Sparkles,
      },
      {
        id: 'champion',
        title: 'Quán quân',
        tier: 'CẤP 1',
        current: Math.min(level, 5),
        target: 5,
        desc: 'Đạt Cấp độ 5 đồng hành cùng Fox V2',
        tone: 'badgeCrown' as const,
        icon: Trophy,
      },
      {
        id: 'coin-collector',
        title: 'Kho báu Fox',
        tier: 'CẤP 1',
        current: Math.min(coinBalance, 500),
        target: 500,
        desc: 'Tích lũy 500 Xu thưởng LifeQuest',
        tone: 'badgeGold' as const,
        icon: Coins,
      },
      {
        id: 'task-finisher',
        title: 'Người hoàn thành',
        tier: 'CẤP 2',
        current: Math.min(completedTasks, 50),
        target: 50,
        desc: 'Hoàn thành 50 Task trên hành trình',
        tone: 'badgeSage' as const,
        icon: CheckCircle2,
      },
      {
        id: 'quest-voyager',
        title: 'Nhà chinh phục Quest',
        tier: 'CẤP 1',
        current: Math.min(activeQuests, 3),
        target: 3,
        desc: 'Khởi động ít nhất 3 Quest dài hạn',
        tone: 'badgeCrown' as const,
        icon: Compass,
      },
    ],
    [streakDays, totalXp, level, coinBalance, completedTasks, activeQuests],
  )

  const filteredAchievements = achievements.filter((ach) => {
    const unlocked = ach.current >= ach.target
    if (achFilter === 'unlocked') return unlocked
    if (achFilter === 'in_progress') return !unlocked
    return true
  })

  const visibleAchievements = showAllAchievements
    ? filteredAchievements
    : filteredAchievements.slice(0, 3)

  const pinnedAchievements = achievements.filter((ach) =>
    (useMockData ? mockProfile.pinnedAchievementIds : ['streak-fire']).includes(ach.id),
  )

  const followingFriends = useMemo(
    () => (useMockData ? mockFriends.filter((f) => f.isFollowing) : []),
    [useMockData, mockFriends],
  )
  const followerFriends = useMemo(
    () => (useMockData ? mockFriends.filter((f) => f.isFollower) : []),
    [useMockData, mockFriends],
  )

  const displayedFriends = useMemo(() => {
    if (!useMockData) return []
    const baseList = friendSearchOpen
      ? mockFriends
      : followTab === 'following'
        ? followingFriends
        : followerFriends
    const q = friendQuery.trim().toLowerCase()
    if (!q) return baseList
    return baseList.filter(
      (f) =>
        f.displayName.toLowerCase().includes(q) ||
        f.handle.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q),
    )
  }, [useMockData, friendSearchOpen, mockFriends, followTab, followingFriends, followerFriends, friendQuery])

  const showToast = (msg: string) => {
    setToastMessage(msg)
  }

  const handleQuickMockLogin = () => {
    activateMockSession()
    setSession({
      accessToken: 'mock-local-session-token',
      refreshToken: null,
      user: {
        id: MOCK_LOGIN_CREDENTIALS.userId,
        email: MOCK_LOGIN_CREDENTIALS.email,
        username: mockProfile.username,
        status: 'ACTIVE',
      },
    })
    showToast(`Đã đăng nhập tài khoản Mock (${MOCK_LOGIN_CREDENTIALS.email}). Bạn có thể chỉnh sửa hồ sơ ngay!`)
  }

  const handleMockLogout = () => {
    deactivateMockSession()
    clearSession()
    showToast('Đã đăng xuất phiên kiểm thử Mock.')
  }

  const handleSaveProfile = (next: EditableProfileData) => {
    if (!isMockSession) {
      activateMockSession()
    }
    updateProfile(next)
    setSession({
      accessToken: isAuthenticated ? useAuthStore.getState().accessToken : 'mock-local-session-token',
      refreshToken: null,
      user: {
        id: authUser?.id || MOCK_LOGIN_CREDENTIALS.userId,
        email: authUser?.email || MOCK_LOGIN_CREDENTIALS.email,
        username: next.username,
        status: authUser?.status || 'ACTIVE',
      },
    })
    setEditModalOpen(false)
    showToast('Đã lưu thay đổi hồ sơ thành công!')
  }

  const handleShareProfile = async () => {
    const shareUrl = `${window.location.origin}/profile?u=${encodeURIComponent(handle)}`
    try {
      await navigator.clipboard?.writeText(shareUrl)
      showToast(`Đã sao chép liên kết hồ sơ @${handle}!`)
    } catch {
      showToast(`Liên kết hồ sơ của bạn: ${shareUrl}`)
    }
  }

  const handleInviteFriends = async () => {
    try {
      await navigator.clipboard?.writeText(`${window.location.origin}/register`)
      setFriendNotice('Đã sao chép liên kết mời tham gia LifeQuest!')
    } catch {
      setFriendNotice('Chia sẻ đường dẫn /register để mời bạn bè cùng chinh phục Quest nhé!')
    }
  }

  const levelPct = Math.min(100, Math.round((totalXp / nextLevelXp) * 100))

  return (
    <div className={styles.layout} data-testid="profile-page">
      {/* Left Main Column: Session Bar + Hero + Activity + Stats + Achievements */}
      <div className={styles.mainCol}>
        {/* Mock / Auth Session Bar */}
        {isMockSession ? (
          <div className={styles.sessionBar} data-testid="profile-mock-session-bar">
            <div className={styles.sessionBarLeft}>
              <span className={styles.mockPill}>TÀI KHOẢN MOCK</span>
              <span className={styles.sessionEmail}>
                {MOCK_LOGIN_CREDENTIALS.email}
                {lastSavedAt ? ` · Đã lưu lúc ${lastSavedAt}` : ''}
              </span>
            </div>
            <div className={styles.sessionBarActions}>
              <button
                type="button"
                className={styles.sessionEditBtn}
                onClick={() => setEditModalOpen(true)}
                data-testid="profile-edit-btn"
              >
                <Pencil size={14} aria-hidden="true" />
                <span>Chỉnh sửa hồ sơ</span>
              </button>
              <button
                type="button"
                className={styles.sessionLogoutBtn}
                onClick={handleMockLogout}
                data-testid="profile-logout-btn"
              >
                <LogOut size={14} aria-hidden="true" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.sessionBarGuest} data-testid="profile-guest-bar">
            <div className={styles.sessionBarLeft}>
              <span className={styles.guestPill}>CHẾ ĐỘ XEM</span>
              <span className={styles.sessionEmail}>
                Đăng nhập tài khoản Mock (<code>{MOCK_LOGIN_CREDENTIALS.email}</code> /{' '}
                <code>{MOCK_LOGIN_CREDENTIALS.password}</code>) để sửa &amp; kiểm thử hồ sơ.
              </span>
            </div>
            <div className={styles.sessionBarActions}>
              <button
                type="button"
                className={styles.sessionEditBtn}
                onClick={handleQuickMockLogin}
                data-testid="profile-quick-mock-login"
              >
                <LogIn size={14} aria-hidden="true" />
                <span>Đăng nhập Mock ngay</span>
              </button>
              <Link to="/login?redirect=%2Fprofile" className={styles.sessionLogoutBtn}>
                Trang Đăng nhập
              </Link>
            </div>
          </div>
        )}

        {toastMessage && (
          <div className={styles.toastBanner} role="status" data-testid="profile-toast">
            <CheckCircle2 size={16} color="#168C78" aria-hidden="true" />
            <span>{toastMessage}</span>
            <button
              type="button"
              className={styles.toastDismiss}
              onClick={() => setToastMessage(null)}
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        )}

        {/* Profile Hero Card */}
        <section className={styles.heroCard} aria-label="Thông tin hồ sơ">
          <div
            className={styles.coverBanner}
            style={{
              background: coverTheme.background,
              borderColor: coverTheme.borderColor,
            }}
          >
            <img
              src={avatarSrc}
              alt={`Ảnh đại diện ${displayName}`}
              className={isCustomPhoto ? styles.avatarPhoto : styles.avatarFigure}
              draggable={false}
            />
            <span className={styles.levelBannerChip}>Cấp {level}</span>
            <div className={styles.bannerActionGroup}>
              <button
                type="button"
                className={styles.editBannerBtn}
                onClick={handleShareProfile}
                aria-label="Chia sẻ hồ sơ"
                title="Chia sẻ hồ sơ"
              >
                <Share2 size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.editBannerBtn}
                onClick={() => setEditModalOpen(true)}
                aria-label="Chỉnh sửa hồ sơ"
                title="Chỉnh sửa hồ sơ"
                data-testid="profile-hero-edit-btn"
              >
                <Pencil size={16} aria-hidden="true" />
              </button>
            </div>
            {isDarkBanner && <span className={styles.bannerStars} aria-hidden="true" />}
          </div>

          <div className={styles.identityBlock}>
            <div className={styles.nameRow}>
              <div>
                <h1 className={styles.displayName} data-testid="profile-display-name">
                  {displayName}
                </h1>
                <span className={styles.handleText} data-testid="profile-handle">
                  @{handle}
                </span>
              </div>
              <span className={styles.titleBadge} data-testid="profile-title-badge">
                <Award size={14} aria-hidden="true" />
                {userTitle}
              </span>
            </div>

            {bio && (
              <p className={styles.bioText} data-testid="profile-bio">
                {bio}
              </p>
            )}

            <div className={styles.metaList}>
              <span className={styles.metaItem}>
                <Calendar size={14} aria-hidden="true" />
                <span>{joinedLabel}</span>
              </span>
              {location && (
                <span className={styles.metaItem} data-testid="profile-location">
                  <MapPin size={14} aria-hidden="true" />
                  <span>{location}</span>
                </span>
              )}
              {focusGoal && (
                <span className={styles.metaItem} data-testid="profile-focus-goal">
                  <Target size={14} aria-hidden="true" />
                  <span>{focusGoal}</span>
                </span>
              )}
            </div>

            <div className={styles.followStatsRow}>
              <div className={styles.followLinks}>
                <button
                  type="button"
                  className={styles.followLinkBtn}
                  onClick={() => {
                    setFriendSearchOpen(false)
                    setFollowTab('following')
                  }}
                >
                  Đang theo dõi {followingFriends.length}
                </button>
                <button
                  type="button"
                  className={styles.followLinkBtn}
                  onClick={() => {
                    setFriendSearchOpen(false)
                    setFollowTab('followers')
                  }}
                >
                  {followerFriends.length} Người theo dõi
                </button>
              </div>
              <span className={styles.privacyStatusChip}>
                <ShieldCheck size={13} aria-hidden="true" />
                {useMockData && mockProfile.showStreakToFriends
                  ? 'Hiện streak với bạn bè'
                  : 'Ẩn streak cá nhân'}
              </span>
            </div>

            {/* Pinned Showcase Badges */}
            {pinnedAchievements.length > 0 && (
              <div className={styles.pinnedRow} aria-label="Huy hiệu trưng bày">
                <span className={styles.pinnedLabel}>Huy hiệu trưng bày:</span>
                {pinnedAchievements.map((ach) => {
                  const Icon = ach.icon
                  return (
                    <span key={ach.id} className={styles.pinnedChip}>
                      <Icon size={13} aria-hidden="true" />
                      <span>{ach.title}</span>
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Journey Activity Strip */}
        <section className={styles.activityStrip} aria-label="Tóm tắt hành trình">
          <div className={styles.activityItem}>
            <span className={styles.activityNum}>{completedTasks}</span>
            <span className={styles.activityLabel}>Task hoàn thành</span>
          </div>
          <div className={styles.activityDivider} aria-hidden="true" />
          <div className={styles.activityItem}>
            <span className={styles.activityNum}>{activeQuests}</span>
            <span className={styles.activityLabel}>Quest đang đi</span>
          </div>
          <div className={styles.activityDivider} aria-hidden="true" />
          <div className={styles.activityItem}>
            <span className={styles.activityNum}>{activeHabits}</span>
            <span className={styles.activityLabel}>Thói quen duy trì</span>
          </div>
        </section>

        {/* 2x2 Stats Grid (synced with HabitsPage PawPrint streak icon) */}
        <section className={styles.sectionBlock} aria-label="Thống kê">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Thống kê</h2>
            <span className={styles.levelProgressLabel}>
              {totalXp}/{nextLevelXp} XP tới Cấp {level + 1} ({levelPct}%)
            </span>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={`${styles.statIcon} ${styles.iconStreak}`} aria-hidden="true">
                <PawPrint size={20} />
              </span>
              <div className={styles.statText}>
                <span className={styles.statValue}>{streakDays}</span>
                <span className={styles.statLabel}>Ngày liên tiếp</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <span className={`${styles.statIcon} ${styles.iconXp}`} aria-hidden="true">
                <Zap size={20} />
              </span>
              <div className={styles.statText}>
                <span className={styles.statValue}>{totalXp.toLocaleString('vi-VN')}</span>
                <span className={styles.statLabel}>Tổng điểm KN (XP)</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <span className={`${styles.statIcon} ${styles.iconCoins}`} aria-hidden="true">
                <Coins size={20} />
              </span>
              <div className={styles.statText}>
                <span className={styles.statValue}>{coinBalance}</span>
                <span className={styles.statLabel}>Xu thưởng hiện có</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <span className={`${styles.statIcon} ${styles.iconHeart}`} aria-hidden="true">
                <Heart size={20} />
              </span>
              <div className={styles.statText}>
                <span className={styles.statValue}>Cấp {level}</span>
                <span className={styles.statLabel}>Đồng hành Fox V2</span>
              </div>
            </div>
          </div>
        </section>

        {/* Achievements List */}
        <section className={styles.sectionBlock} aria-label="Thành tích">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Thành tích</h2>
            <div className={styles.achControls}>
              <div className={styles.filterPills} role="tablist" aria-label="Lọc thành tích">
                {(
                  [
                    { id: 'all', label: 'Tất cả' },
                    { id: 'unlocked', label: 'Đã đạt' },
                    { id: 'in_progress', label: 'Đang đi' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={achFilter === tab.id}
                    className={`${styles.filterPill} ${achFilter === tab.id ? styles.filterPillActive : ''}`.trim()}
                    onClick={() => setAchFilter(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={styles.seeAllBtn}
                onClick={() => setShowAllAchievements((v) => !v)}
              >
                {showAllAchievements ? 'Thu gọn' : 'Xem tất cả'}
              </button>
            </div>
          </div>

          <div className={styles.achievementsCard}>
            {visibleAchievements.map((ach) => {
              const Icon = ach.icon
              const pct = Math.min(100, Math.round((ach.current / ach.target) * 100))
              const unlocked = ach.current >= ach.target
              return (
                <div key={ach.id} className={styles.achievementRow}>
                  <div className={`${styles.achBadge} ${styles[ach.tone]}`} aria-hidden="true">
                    <Icon size={24} />
                    <span className={styles.achTier}>{ach.tier}</span>
                  </div>
                  <div className={styles.achBody}>
                    <div className={styles.achTop}>
                      <h3 className={styles.achTitle}>
                        {ach.title}
                        {unlocked && <span className={styles.unlockedTag}>Đã đạt</span>}
                      </h3>
                      <span className={styles.achCount}>
                        {ach.current}/{ach.target}
                      </span>
                    </div>
                    <div
                      className={styles.achTrack}
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={ach.title}
                    >
                      <div className={styles.achFill} style={{ width: `${pct}%` }} />
                    </div>
                    <p className={styles.achDesc}>{ach.desc}</p>
                  </div>
                </div>
              )
            })}
            {visibleAchievements.length === 0 && (
              <p className={styles.emptyAchText}>Chưa có thành tích nào ở mục này.</p>
            )}
          </div>
        </section>
      </div>

      {/* Right Column: Followers/Following + Add Friends */}
      <aside className={styles.sideCol} aria-label="Kết nối bạn bè">
        <div className={styles.sideCard}>
          <div className={styles.followTabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!friendSearchOpen && followTab === 'following'}
              className={`${styles.followTab} ${!friendSearchOpen && followTab === 'following' ? styles.followTabActive : ''}`.trim()}
              onClick={() => {
                setFriendSearchOpen(false)
                setFollowTab('following')
              }}
            >
              Đang theo dõi ({followingFriends.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!friendSearchOpen && followTab === 'followers'}
              className={`${styles.followTab} ${!friendSearchOpen && followTab === 'followers' ? styles.followTabActive : ''}`.trim()}
              onClick={() => {
                setFriendSearchOpen(false)
                setFollowTab('followers')
              }}
            >
              Theo dõi ({followerFriends.length})
            </button>
          </div>

          {useMockData ? (
            <div className={styles.friendListWrap}>
              {friendSearchOpen && (
                <div className={styles.friendSearchBox}>
                  <Search size={14} color="#7c6d5f" aria-hidden="true" />
                  <input
                    type="search"
                    value={friendQuery}
                    onChange={(e) => setFriendQuery(e.target.value)}
                    placeholder="Tìm theo tên hoặc @handle..."
                    className={styles.friendSearchInput}
                    aria-label="Tìm bạn bè"
                  />
                </div>
              )}

              {displayedFriends.length > 0 ? (
                <ul className={styles.friendList}>
                  {displayedFriends.map((friend) => (
                    <li key={friend.id} className={styles.friendRow}>
                      <img
                        src={friend.avatarSrc}
                        alt={friend.displayName}
                        className={styles.friendAvatar}
                      />
                      <div className={styles.friendInfo}>
                        <strong className={styles.friendName}>{friend.displayName}</strong>
                        <span className={styles.friendMeta}>
                          @{friend.handle} ·{' '}
                          <PawPrint size={11} color="#F26B2E" style={{ verticalAlign: '-1px' }} aria-hidden="true" />{' '}
                          {friend.streakDays}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={
                          friend.isFollowing ? styles.friendFollowingBtn : styles.friendFollowBtn
                        }
                        onClick={() => toggleFollowFriend(friend.id)}
                        aria-label={
                          friend.isFollowing
                            ? `Bỏ theo dõi ${friend.displayName}`
                            : `Theo dõi ${friend.displayName}`
                        }
                      >
                        {friend.isFollowing ? (
                          <UserCheck size={14} aria-hidden="true" />
                        ) : (
                          <UserPlus size={14} aria-hidden="true" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.followEmpty}>
                  <p className={styles.followEmptyText}>Không tìm thấy bạn bè phù hợp.</p>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.followEmpty}>
              <span className={styles.followEmptyIcon} aria-hidden="true">
                <Users size={26} />
              </span>
              <p className={styles.followEmptyText}>
                {followTab === 'following'
                  ? 'Đăng nhập tài khoản Mock để xem & quản lý danh sách bạn bè mẫu.'
                  : 'Chưa có người theo dõi — hãy chia sẻ hồ sơ LifeQuest của bạn nhé!'}
              </p>
              <span className={styles.pendingChip}>Social API đang hoàn thiện</span>
            </div>
          )}
        </div>

        <div className={styles.sideCard}>
          <div className={styles.friendsCardInner}>
            <h2 className={styles.friendsHeading}>Thêm bạn bè</h2>
            <button
              type="button"
              className={styles.friendActionBtn}
              onClick={() => {
                if (useMockData) {
                  setFriendSearchOpen((v) => !v)
                  setFriendNotice(null)
                } else {
                  setFriendNotice('Đăng nhập tài khoản Mock ở phía trên để thử tìm kiếm bạn bè.')
                }
              }}
            >
              <span className={styles.friendActionLeft}>
                <Search size={17} color="#F26733" aria-hidden="true" />
                <span>{friendSearchOpen ? 'Đóng tìm bạn bè' : 'Tìm bạn bè'}</span>
              </span>
            </button>
            <button type="button" className={styles.friendActionBtn} onClick={handleInviteFriends}>
              <span className={styles.friendActionLeft}>
                <MailPlus size={17} color="#168C78" aria-hidden="true" />
                <span>Mời bạn bè</span>
              </span>
            </button>

            {friendNotice && (
              <p className={styles.friendNotice} role="status">
                {friendNotice}
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Edit Profile Modal */}
      <ProfileEditModal
        open={editModalOpen}
        initialData={mockProfile}
        achievementOptions={achievements.map((a) => ({ id: a.id, title: a.title }))}
        onSave={handleSaveProfile}
        onReset={() => {
          resetProfile()
          showToast('Đã khôi phục hồ sơ Mock về mặc định.')
        }}
        onClose={() => setEditModalOpen(false)}
      />
    </div>
  )
}
