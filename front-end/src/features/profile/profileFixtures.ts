import type { ClothColor, FoxPortraitMood, MediaVisibility, SampleIllustrationKey } from '@/features/journal/JournalPrimitives'

export type ViewerRelation =
  | 'SELF'
  | 'FRIEND'
  | 'NON_FRIEND'
  | 'PENDING_IN'
  | 'PENDING_OUT'
  | 'BLOCKED'
  | 'NOT_FOUND'

export interface ProfileBadgeItem {
  id: string
  title: string
  tier: string
  description: string
  current: number
  target: number
  earned: boolean
  tone: 'orange' | 'teal' | 'navy' | 'gold'
}

export interface ProfileDecorativeTitle {
  id: string
  name: string
  costCoins: number
  owned: boolean
  equipped: boolean
}

export interface ProfileMomentPreview {
  id: string
  caption: string
  dateLabel: string
  questTitle: string
  visibility: MediaVisibility
  illustrationKey: SampleIllustrationKey
  cheerCount: number
  cheeredByMe: boolean
}

export interface RawUserProfileRecord {
  id: string
  slug: string
  displayName: string
  username: string
  initials: string
  decorativeTitle: string
  bio: string
  joinedLabel: string
  friendCount: number
  mutualFriendsLabel?: string
  coverColor: ClothColor
  foxMood: FoxPortraitMood
  foxOutfitLabel: string
  foxEquippedItems: string[]
  level: number
  totalXp: number
  nextLevelXp: number
  streakDays: number
  completedQuests: number
  completedTasks: number
  showStreakToFriends: boolean
  showQuestCountToFriends: boolean
  pendingMessage?: string
  pendingTimeLabel?: string
  relationToViewer: Exclude<ViewerRelation, 'SELF' | 'NOT_FOUND'>
  isBlocker?: boolean
  pinnedBadgeIds: string[]
  badges: ProfileBadgeItem[]
  moments: ProfileMomentPreview[]
}

export interface ProjectedProfileView {
  relation: ViewerRelation
  isNeutralNotFound: boolean
  isBlockerView: boolean
  userId: string
  slug: string
  displayName: string
  username: string
  initials: string
  decorativeTitle: string
  bio: string | null
  joinedLabel: string | null
  friendCount: number | null
  mutualFriendsLabel: string | null
  coverColor: ClothColor
  foxMood: FoxPortraitMood
  foxOutfitLabel: string
  foxEquippedItems: string[]
  level: number
  totalXp: number | null
  nextLevelXp: number | null
  streakDays: number | null
  streakHiddenByOwner: boolean
  completedQuests: number | null
  completedTasks: number | null
  pendingMessage: string | null
  pendingTimeLabel: string | null
  badges: ProfileBadgeItem[]
  pinnedBadgesOnly: boolean
  moments: ProfileMomentPreview[]
  canViewAlbumTab: boolean
  canViewMomentsTab: boolean
}

export const DECORATIVE_TITLES_MOCK: readonly ProfileDecorativeTitle[] = [
  { id: 'dt-pine', name: 'Nhà thám hiểm Rừng Thông', costCoins: 0, owned: true, equipped: true },
  { id: 'dt-pioneer', name: 'Nhà thám hiểm tiên phong', costCoins: 0, owned: true, equipped: false },
  { id: 'dt-sunrise', name: 'Người giữ lửa trại', costCoins: 90, owned: true, equipped: false },
  { id: 'dt-mage', name: 'Pháp sư nhỏ', costCoins: 180, owned: false, equipped: false },
]

export const BASE_PROFILE_BADGES: readonly ProfileBadgeItem[] = [
  {
    id: 'streak-fire',
    title: 'Lửa rừng',
    tier: 'CẤP 2',
    description: 'Đạt chuỗi 7 ngày liên tiếp cùng Fox V2',
    current: 7,
    target: 7,
    earned: true,
    tone: 'orange',
  },
  {
    id: 'xp-master',
    title: 'Cao nhân',
    tier: 'CẤP 2',
    description: 'Tích lũy đủ 1.000 điểm KN (XP)',
    current: 1000,
    target: 1000,
    earned: true,
    tone: 'gold',
  },
  {
    id: 'champion',
    title: 'Quán quân',
    tier: 'CẤP 1',
    description: 'Đạt Cấp độ 5 đồng hành cùng Fox V2',
    current: 5,
    target: 5,
    earned: true,
    tone: 'navy',
  },
  {
    id: 'quest-voyager',
    title: 'Chinh phục Quest',
    tier: 'CẤP 1',
    description: 'Hoàn thành 3 Quest trên hành trình',
    current: 3,
    target: 3,
    earned: true,
    tone: 'orange',
  },
  {
    id: 'early-bird',
    title: 'Dậy sớm',
    tier: 'CẤP 1',
    description: 'Hoàn thành 10 nhiệm vụ trước 7h sáng',
    current: 10,
    target: 10,
    earned: true,
    tone: 'teal',
  },
  {
    id: 'focus-keeper',
    title: 'Giữ nhịp tập trung',
    tier: 'CẤP 1',
    description: 'Hoàn thành 15 phiên Tập trung cùng Fox',
    current: 15,
    target: 15,
    earned: true,
    tone: 'navy',
  },
  {
    id: 'coin-collector',
    title: 'Kho báu Fox',
    tier: 'CẤP 1',
    description: 'Tích lũy 500 Xu thưởng LifeQuest',
    current: 360,
    target: 500,
    earned: false,
    tone: 'gold',
  },
  {
    id: 'task-finisher',
    title: 'Người hoàn thành',
    tier: 'CẤP 2',
    description: 'Hoàn thành 50 Task trên hành trình',
    current: 48,
    target: 50,
    earned: false,
    tone: 'teal',
  },
  {
    id: 'photographer',
    title: 'Nhiếp ảnh gia',
    tier: 'CẤP 1',
    description: 'Lưu 20 khoảnh khắc vào Sổ kỷ niệm',
    current: 14,
    target: 20,
    earned: false,
    tone: 'orange',
  },
  {
    id: 'companion-duo',
    title: 'Bạn đồng hành',
    tier: 'CẤP 1',
    description: 'Hoàn thành 3 Quest chung cùng bạn bè',
    current: 1,
    target: 3,
    earned: false,
    tone: 'navy',
  },
  {
    id: 'bookworm',
    title: 'Mọt sách Fox',
    tier: 'CẤP 1',
    description: 'Ghi chép 12 cuốn sách đã đọc',
    current: 4,
    target: 12,
    earned: false,
    tone: 'teal',
  },
  {
    id: 'trailblazer',
    title: 'Người mở đường',
    tier: 'CẤP 1',
    description: 'Hoàn thành 5 cột mốc hành trình',
    current: 2,
    target: 5,
    earned: false,
    tone: 'gold',
  },
]

export const OWN_SAMPLE_MOMENTS: readonly ProfileMomentPreview[] = [
  {
    id: 'mom-1',
    caption: 'Hoàn thành chặng 5km sáng nay lúc 6h15 — trời mát và không bỏ nhịp nào!',
    dateLabel: 'Hôm qua · 06:24',
    questTitle: 'Chạy 10km đầu tiên',
    visibility: 'FRIENDS',
    illustrationKey: 'sunrise-run',
    cheerCount: 8,
    cheeredByMe: false,
  },
  {
    id: 'mom-2',
    caption: 'Xong chương 4 cuốn Atomic Habits, ghi chú lại 3 thói quen nhỏ cho tuần mới.',
    dateLabel: '16/11 · 21:10',
    questTitle: 'Đọc 12 cuốn sách 2026',
    visibility: 'FRIENDS',
    illustrationKey: 'book-shelf',
    cheerCount: 5,
    cheeredByMe: true,
  },
  {
    id: 'mom-3',
    caption: 'Buổi chạy cuối tuần cùng cả nhóm Q7, ai cũng về đích đúng giờ!',
    dateLabel: '12/11 · 07:45',
    questTitle: 'Nhóm Chạy bộ Q7',
    visibility: 'GROUP',
    illustrationKey: 'group-run',
    cheerCount: 11,
    cheeredByMe: false,
  },
]

export const MOCK_OTHER_PROFILES: readonly RawUserProfileRecord[] = [
  {
    id: 'user-giahuy',
    slug: 'gia-huy',
    displayName: 'Gia Huy',
    username: 'giahuy.books',
    initials: 'GH',
    decorativeTitle: 'Pháp sư nhỏ',
    bio: 'Đọc 20 trang mỗi tối và luyện chạy bền cuối tuần.',
    joinedLabel: 'Đồng hành từ 08/2026',
    friendCount: 18,
    mutualFriendsLabel: '4 bạn chung · Minh Anh, Thu Hà',
    coverColor: 'teal',
    foxMood: 'happy',
    foxOutfitLabel: 'Bộ Pháp sư · 2 món',
    foxEquippedItems: ['Mũ Pháp sư', 'Khăn choàng Xanh'],
    level: 9,
    totalXp: 2450,
    nextLevelXp: 2800,
    streakDays: 19,
    completedQuests: 6,
    completedTasks: 82,
    showStreakToFriends: false,
    showQuestCountToFriends: true,
    relationToViewer: 'FRIEND',
    pinnedBadgeIds: ['streak-fire', 'xp-master', 'champion'],
    badges: [...BASE_PROFILE_BADGES],
    moments: [
      {
        id: 'gh-mom-1',
        caption: 'Chinh phục đỉnh Bà Đen cùng nhóm, kỷ niệm đáng nhớ nhất tháng 11!',
        dateLabel: '18/11 · 09:30',
        questTitle: 'Leo núi cuối tuần',
        visibility: 'FRIENDS',
        illustrationKey: 'mountain-summit',
        cheerCount: 14,
        cheeredByMe: false,
      },
    ],
  },
  {
    id: 'user-thuha',
    slug: 'thu-ha',
    displayName: 'Thu Hà',
    username: 'thuha.run',
    initials: 'TH',
    decorativeTitle: 'Người giữ lửa trại',
    bio: 'Chạy bộ sáng sớm và ghi lại từng chặng nhỏ.',
    joinedLabel: 'Đồng hành từ 10/2026',
    friendCount: 9,
    mutualFriendsLabel: '1 bạn chung · Gia Huy',
    coverColor: 'rust',
    foxMood: 'cheer',
    foxOutfitLabel: 'Fox mặc định',
    foxEquippedItems: [],
    level: 6,
    totalXp: 1120,
    nextLevelXp: 1400,
    streakDays: 8,
    completedQuests: 2,
    completedTasks: 29,
    showStreakToFriends: true,
    showQuestCountToFriends: true,
    pendingMessage: 'Mình cũng đang chạy Quest 10km nè, cùng tập nhé!',
    pendingTimeLabel: 'Thu Hà đã gửi lời mời kết bạn · 2 giờ trước',
    relationToViewer: 'PENDING_IN',
    pinnedBadgeIds: ['streak-fire', 'xp-master', 'champion'],
    badges: [...BASE_PROFILE_BADGES],
    moments: [],
  },
  {
    id: 'user-minhkhoi',
    slug: 'minh-khoi',
    displayName: 'Minh Khôi',
    username: 'minhkhoi.dev',
    initials: 'MK',
    decorativeTitle: 'Thợ săn Quest',
    bio: 'Học tiếng Nhật N3 và hoàn thiện dự án cá nhân.',
    joinedLabel: 'Đồng hành từ 09/2026',
    friendCount: 11,
    mutualFriendsLabel: '2 bạn chung',
    coverColor: 'navy',
    foxMood: 'explorer',
    foxOutfitLabel: 'Fox mặc định',
    foxEquippedItems: [],
    level: 7,
    totalXp: 1640,
    nextLevelXp: 2000,
    streakDays: 15,
    completedQuests: 4,
    completedTasks: 55,
    showStreakToFriends: true,
    showQuestCountToFriends: true,
    relationToViewer: 'NON_FRIEND',
    pinnedBadgeIds: ['streak-fire', 'xp-master', 'champion'],
    badges: [...BASE_PROFILE_BADGES],
    moments: [],
  },
  {
    id: 'user-lanchi',
    slug: 'lan-chi',
    displayName: 'Lan Chi',
    username: 'lanchi.notes',
    initials: 'LC',
    decorativeTitle: 'Nhà thám hiểm tiên phong',
    bio: 'Ghi chép mỗi ngày và vẽ minh họa.',
    joinedLabel: 'Đồng hành từ 11/2026',
    friendCount: 5,
    coverColor: 'plum',
    foxMood: 'explorer',
    foxOutfitLabel: 'Fox mặc định',
    foxEquippedItems: [],
    level: 4,
    totalXp: 680,
    nextLevelXp: 1000,
    streakDays: 5,
    completedQuests: 1,
    completedTasks: 19,
    showStreakToFriends: true,
    showQuestCountToFriends: true,
    pendingTimeLabel: 'Bạn đã gửi lời mời kết bạn · Đang chờ phản hồi',
    relationToViewer: 'PENDING_OUT',
    pinnedBadgeIds: ['streak-fire', 'champion'],
    badges: [...BASE_PROFILE_BADGES],
    moments: [],
  },
  {
    id: 'user-annguyen',
    slug: 'an-nguyen',
    displayName: 'An Nguyễn',
    username: 'an.nguyen',
    initials: 'AN',
    decorativeTitle: 'Đồng hành Fox V2',
    bio: 'Hồ sơ đã bị chặn.',
    joinedLabel: 'Đồng hành từ 07/2026',
    friendCount: 3,
    coverColor: 'sand',
    foxMood: 'camp',
    foxOutfitLabel: 'Fox mặc định',
    foxEquippedItems: [],
    level: 3,
    totalXp: 420,
    nextLevelXp: 700,
    streakDays: 2,
    completedQuests: 0,
    completedTasks: 9,
    showStreakToFriends: false,
    showQuestCountToFriends: false,
    relationToViewer: 'BLOCKED',
    isBlocker: true,
    pinnedBadgeIds: [],
    badges: [],
    moments: [],
  },
]

/**
 * Strict server-style projection helper.
 * Ensures private or unauthorized fields are NEVER placed into the rendered view model.
 */
export function projectProfileForViewer(
  raw: RawUserProfileRecord | null,
  relationOverride?: ViewerRelation,
): ProjectedProfileView {
  if (!raw || relationOverride === 'NOT_FOUND') {
    return {
      relation: 'NOT_FOUND',
      isNeutralNotFound: true,
      isBlockerView: false,
      userId: 'unknown',
      slug: 'unknown',
      displayName: '',
      username: '',
      initials: '',
      decorativeTitle: '',
      bio: null,
      joinedLabel: null,
      friendCount: null,
      mutualFriendsLabel: null,
      coverColor: 'navy',
      foxMood: 'camp',
      foxOutfitLabel: '',
      foxEquippedItems: [],
      level: 1,
      totalXp: null,
      nextLevelXp: null,
      streakDays: null,
      streakHiddenByOwner: false,
      completedQuests: null,
      completedTasks: null,
      pendingMessage: null,
      pendingTimeLabel: null,
      badges: [],
      pinnedBadgesOnly: true,
      moments: [],
      canViewAlbumTab: false,
      canViewMomentsTab: false,
    }
  }

  const relation = relationOverride ?? raw.relationToViewer

  // Blocked by the other user -> identical neutral "not found" screen (zero info leak)
  if (relation === 'BLOCKED' && !raw.isBlocker) {
    return projectProfileForViewer(null, 'NOT_FOUND')
  }

  // Blocker view -> only shows Unblock card, zero private stats/albums/moments
  if (relation === 'BLOCKED' && raw.isBlocker) {
    return {
      relation: 'BLOCKED',
      isNeutralNotFound: false,
      isBlockerView: true,
      userId: raw.id,
      slug: raw.slug,
      displayName: raw.displayName,
      username: raw.username,
      initials: raw.initials,
      decorativeTitle: '',
      bio: null,
      joinedLabel: null,
      friendCount: null,
      mutualFriendsLabel: null,
      coverColor: 'navy',
      foxMood: 'camp',
      foxOutfitLabel: '',
      foxEquippedItems: [],
      level: 1,
      totalXp: null,
      nextLevelXp: null,
      streakDays: null,
      streakHiddenByOwner: false,
      completedQuests: null,
      completedTasks: null,
      pendingMessage: null,
      pendingTimeLabel: null,
      badges: [],
      pinnedBadgesOnly: true,
      moments: [],
      canViewAlbumTab: false,
      canViewMomentsTab: false,
    }
  }

  const pinnedBadges = raw.badges.filter((b) => raw.pinnedBadgeIds.includes(b.id)).slice(0, 3)

  if (relation === 'NON_FRIEND' || relation === 'PENDING_IN' || relation === 'PENDING_OUT') {
    return {
      relation,
      isNeutralNotFound: false,
      isBlockerView: false,
      userId: raw.id,
      slug: raw.slug,
      displayName: raw.displayName,
      username: raw.username,
      initials: raw.initials,
      decorativeTitle: raw.decorativeTitle,
      bio: null,
      joinedLabel: null,
      friendCount: null,
      mutualFriendsLabel: raw.mutualFriendsLabel ?? null,
      coverColor: raw.coverColor,
      foxMood: 'explorer',
      foxOutfitLabel: 'Fox mặc định (chưa kết bạn)',
      foxEquippedItems: [],
      level: raw.level,
      totalXp: null,
      nextLevelXp: null,
      streakDays: null,
      streakHiddenByOwner: false,
      completedQuests: null,
      completedTasks: null,
      pendingMessage: relation === 'PENDING_IN' ? raw.pendingMessage ?? null : null,
      pendingTimeLabel: raw.pendingTimeLabel ?? null,
      badges: pinnedBadges,
      pinnedBadgesOnly: true,
      moments: [],
      canViewAlbumTab: false,
      canViewMomentsTab: false,
    }
  }

  // FRIEND view
  return {
    relation: 'FRIEND',
    isNeutralNotFound: false,
    isBlockerView: false,
    userId: raw.id,
    slug: raw.slug,
    displayName: raw.displayName,
    username: raw.username,
    initials: raw.initials,
    decorativeTitle: raw.decorativeTitle,
    bio: raw.bio,
    joinedLabel: raw.joinedLabel,
    friendCount: raw.friendCount,
    mutualFriendsLabel: raw.mutualFriendsLabel ?? null,
    coverColor: raw.coverColor,
    foxMood: raw.foxMood,
    foxOutfitLabel: raw.foxOutfitLabel,
    foxEquippedItems: raw.foxEquippedItems,
    level: raw.level,
    totalXp: raw.totalXp,
    nextLevelXp: raw.nextLevelXp,
    streakDays: raw.showStreakToFriends ? raw.streakDays : null,
    streakHiddenByOwner: !raw.showStreakToFriends,
    completedQuests: raw.showQuestCountToFriends ? raw.completedQuests : null,
    completedTasks: raw.completedTasks,
    pendingMessage: null,
    pendingTimeLabel: null,
    badges: raw.badges.filter((b) => b.earned),
    pinnedBadgesOnly: false,
    moments: raw.moments.filter((m) => m.visibility !== 'PRIVATE'),
    canViewAlbumTab: true,
    canViewMomentsTab: true,
  }
}
