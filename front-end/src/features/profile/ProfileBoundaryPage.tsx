import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  Coins,
  Flame,
  Heart,
  MailPlus,
  Pencil,
  Search,
  Sparkles,
  Trophy,
  Users,
  Zap
} from 'lucide-react'
import { useTodayQuery, useUserMeQuery } from '@/hooks/useDashboardData'
import { useAuthStore } from '@/stores/authStore'
import styles from './ProfilePage.module.css'

export function ProfileBoundaryPage() {
  const authUser = useAuthStore((s) => s.user)
  const userQuery = useUserMeQuery()
  const todayQuery = useTodayQuery()

  const [followTab, setFollowTab] = useState<'following' | 'followers'>('following')
  const [showAllAchievements, setShowAllAchievements] = useState(false)
  const [friendNotice, setFriendNotice] = useState<string | null>(null)

  const user = userQuery.data?.data
  const liveToday = todayQuery.data?.source === 'LIVE' ? todayQuery.data.data : null

  const displayName =
    user?.profile?.displayName?.trim() ||
    user?.username ||
    authUser?.username ||
    'Thành viên LifeQuest'
  const handle = user?.username || authUser?.username || 'lifequest_user'
  const userTitle = user?.profile?.title?.trim() || 'Nhà thám hiểm LifeQuest'

  const streakDays = liveToday?.streak.currentCount ?? 0
  const totalXp = liveToday?.gamification.totalXp ?? 0
  const coinBalance = liveToday?.gamification.coinBalance ?? 0
  const level = liveToday?.gamification.level ?? 1

  const achievements = [
    {
      id: 'streak-fire',
      title: 'Lửa rừng',
      tier: 'CẤP 1',
      current: Math.min(streakDays, 3),
      target: 3,
      desc: 'Đạt chuỗi 3 ngày streak liên tiếp',
      tone: 'badgeFire' as const,
      icon: Flame
    },
    {
      id: 'xp-master',
      title: 'Cao nhân',
      tier: 'CẤP 1',
      current: Math.min(totalXp, 100),
      target: 100,
      desc: 'Tích lũy đủ 100 điểm KN (XP)',
      tone: 'badgeSage' as const,
      icon: Sparkles
    },
    {
      id: 'champion',
      title: 'Quán quân',
      tier: 'CẤP 1',
      current: Math.min(level, 3),
      target: 3,
      desc: 'Đạt Cấp độ 3 đồng hành cùng Fox V2',
      tone: 'badgeCrown' as const,
      icon: Trophy
    },
    {
      id: 'coin-collector',
      title: 'Kho báu Fox',
      tier: 'CẤP 1',
      current: Math.min(coinBalance, 200),
      target: 200,
      desc: 'Tích lũy 200 Xu thưởng LifeQuest',
      tone: 'badgeGold' as const,
      icon: Coins
    }
  ]

  const visibleAchievements = showAllAchievements ? achievements : achievements.slice(0, 3)

  const handleFindFriends = () => {
    setFriendNotice('Tính năng tìm kiếm bạn bè sẽ được kích hoạt ngay khi Social API hoàn tất.')
  }

  const handleInviteFriends = async () => {
    try {
      await navigator.clipboard?.writeText(`${window.location.origin}/register`)
      setFriendNotice('Đã sao chép liên kết mời tham gia LifeQuest!')
    } catch {
      setFriendNotice('Chia sẻ đường dẫn /register để mời bạn bè cùng chinh phục Quest nhé!')
    }
  }

  return (
    <div className={styles.layout} data-testid="profile-page">
      {/* Left Main Column: Hero + Stats + Achievements */}
      <div className={styles.mainCol}>
        <section className={styles.heroCard} aria-label="Thông tin hồ sơ">
          <div className={styles.coverBanner}>
            <img
              src="/fox_poster.png"
              alt="Ảnh đại diện Fox V2 LifeQuest"
              className={styles.avatarFigure}
              draggable={false}
            />
            <Link
              to="/settings"
              className={styles.editBannerBtn}
              aria-label="Chỉnh sửa hồ sơ"
              title="Chỉnh sửa hồ sơ"
            >
              <Pencil size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.identityBlock}>
            <h1 className={styles.displayName}>{displayName}</h1>
            <span className={styles.handleText}>@{handle}</span>
            <p className={styles.joinedText}>Thành viên LifeQuest · Đồng hành cùng Fox V2</p>

            <div className={styles.followStatsRow}>
              <div className={styles.followLinks}>
                <span>Đang theo dõi 0</span>
                <span>0 Người theo dõi</span>
              </div>
              <span className={styles.titleBadge}>{userTitle}</span>
            </div>
          </div>
        </section>

        {/* 2x2 Stats Grid */}
        <section className={styles.sectionBlock} aria-label="Thống kê">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Thống kê</h2>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={`${styles.statIcon} ${styles.iconStreak}`} aria-hidden="true">
                <Flame size={20} />
              </span>
              <div className={styles.statText}>
                <span className={styles.statValue}>{streakDays}</span>
                <span className={styles.statLabel}>Ngày streak</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <span className={`${styles.statIcon} ${styles.iconXp}`} aria-hidden="true">
                <Zap size={20} />
              </span>
              <div className={styles.statText}>
                <span className={styles.statValue}>{totalXp}</span>
                <span className={styles.statLabel}>Tổng điểm KN</span>
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
                <span className={styles.statLabel}>Cấp độ hiện tại</span>
              </div>
            </div>
          </div>
        </section>

        {/* Achievements List */}
        <section className={styles.sectionBlock} aria-label="Thành tích">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Thành tích</h2>
            <button
              type="button"
              className={styles.seeAllBtn}
              onClick={() => setShowAllAchievements((v) => !v)}
            >
              {showAllAchievements ? 'Thu gọn' : 'Xem tất cả'}
            </button>
          </div>

          <div className={styles.achievementsCard}>
            {visibleAchievements.map((ach) => {
              const Icon = ach.icon
              const pct = Math.min(100, Math.round((ach.current / ach.target) * 100))
              return (
                <div key={ach.id} className={styles.achievementRow}>
                  <div className={`${styles.achBadge} ${styles[ach.tone]}`} aria-hidden="true">
                    <Icon size={24} />
                    <span className={styles.achTier}>{ach.tier}</span>
                  </div>
                  <div className={styles.achBody}>
                    <div className={styles.achTop}>
                      <h3 className={styles.achTitle}>{ach.title}</h3>
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
              aria-selected={followTab === 'following'}
              className={`${styles.followTab} ${followTab === 'following' ? styles.followTabActive : ''}`.trim()}
              onClick={() => setFollowTab('following')}
            >
              Đang theo dõi
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={followTab === 'followers'}
              className={`${styles.followTab} ${followTab === 'followers' ? styles.followTabActive : ''}`.trim()}
              onClick={() => setFollowTab('followers')}
            >
              Người theo dõi
            </button>
          </div>

          <div className={styles.followEmpty}>
            <span className={styles.followEmptyIcon} aria-hidden="true">
              <Users size={26} />
            </span>
            <p className={styles.followEmptyText}>
              {followTab === 'following'
                ? 'Kết nối bạn bè giúp duy trì thói quen vui và hiệu quả hơn.'
                : 'Chưa có người theo dõi — hãy chia sẻ hồ sơ LifeQuest của bạn nhé!'}
            </p>
            <span className={styles.pendingChip}>Social API đang hoàn thiện</span>
          </div>
        </div>

        <div className={styles.sideCard}>
          <div className={styles.friendsCardInner}>
            <h2 className={styles.friendsHeading}>Thêm bạn bè</h2>
            <button
              type="button"
              className={styles.friendActionBtn}
              onClick={handleFindFriends}
            >
              <span className={styles.friendActionLeft}>
                <Search size={17} color="#F26733" aria-hidden="true" />
                <span>Tìm bạn bè</span>
              </span>
              <ChevronRight size={17} color="#8C7B6B" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.friendActionBtn}
              onClick={handleInviteFriends}
            >
              <span className={styles.friendActionLeft}>
                <MailPlus size={17} color="#168C78" aria-hidden="true" />
                <span>Mời bạn bè</span>
              </span>
              <ChevronRight size={17} color="#8C7B6B" aria-hidden="true" />
            </button>

            {friendNotice && (
              <p className={styles.friendNotice} role="status">
                {friendNotice}
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
