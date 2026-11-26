import { create } from 'zustand'
import foxHeroStatic from '@/assets/landing/fox-hero-static.webp'
import foxMoodCelebrateStatic from '@/assets/landing/fox-mood-celebrate-static.webp'
import foxMoodCheerStatic from '@/assets/landing/fox-mood-cheer-static.webp'
import foxMoodHappyStatic from '@/assets/landing/fox-mood-happy-static.webp'
import foxMoodXpStatic from '@/assets/landing/fox-mood-xp-static.webp'

export const MOCK_LOGIN_CREDENTIALS = {
  email: 'fox.demo@lifequest.vn',
  password: 'LifeQuest123!',
  userId: 'mock-user-fox-001',
} as const

export type ProfileCoverThemeId = 'sunrise' | 'forest' | 'twilight' | 'meadow'

export interface ProfileCoverTheme {
  readonly id: ProfileCoverThemeId
  readonly label: string
  readonly background: string
  readonly borderColor: string
}

export const PROFILE_COVER_THEMES: readonly ProfileCoverTheme[] = [
  {
    id: 'sunrise',
    label: 'Bình minh Cam',
    background: 'linear-gradient(135deg, #fff2e4 0%, #ffe3c7 100%)',
    borderColor: '#efcaa8',
  },
  {
    id: 'forest',
    label: 'Rừng Thông Mint',
    background: 'linear-gradient(135deg, #e7f6f1 0%, #cce9df 100%)',
    borderColor: '#a6d6c7',
  },
  {
    id: 'twilight',
    label: 'Hoàng hôn Đêm',
    background: 'linear-gradient(135deg, #1d3b54 0%, #2e5573 100%)',
    borderColor: '#3c6788',
  },
  {
    id: 'meadow',
    label: 'Nắng Mai Vàng',
    background: 'linear-gradient(135deg, #fff8df 0%, #fde9b5 100%)',
    borderColor: '#ebd08b',
  },
]

export interface ProfileAvatarPreset {
  readonly id: string
  readonly label: string
  readonly src: string
}

export const PROFILE_AVATAR_PRESETS: readonly ProfileAvatarPreset[] = [
  { id: 'fox-hero', label: 'Fox Thám hiểm', src: foxHeroStatic },
  { id: 'fox-happy', label: 'Fox Vui mừng', src: foxMoodHappyStatic },
  { id: 'fox-cheer', label: 'Fox Cổ vũ', src: foxMoodCheerStatic },
  { id: 'fox-celebrate', label: 'Fox Ăn mừng', src: foxMoodCelebrateStatic },
  { id: 'fox-xp', label: 'Fox Nhận XP', src: foxMoodXpStatic },
]

export const PROFILE_TITLE_PRESETS = [
  'Nhà thám hiểm Rừng Thông',
  'Người giữ lửa Thói quen',
  'Chiến binh Sáng sớm',
  'Đồng hành Fox V2',
  'Thợ săn Quest',
] as const

export interface MockFriend {
  readonly id: string
  readonly displayName: string
  readonly handle: string
  readonly title: string
  readonly streakDays: number
  readonly avatarSrc: string
  readonly isFollowing: boolean
  readonly isFollower: boolean
}

export interface EditableProfileData {
  displayName: string
  username: string
  title: string
  bio: string
  location: string
  focusGoal: string
  avatarPresetId: string
  customAvatarUrl: string | null
  coverTheme: ProfileCoverThemeId
  pinnedAchievementIds: string[]
  showStreakToFriends: boolean
  allowQuestInvites: boolean
}

export interface MockProfileStats {
  streakDays: number
  totalXp: number
  nextLevelXp: number
  coinBalance: number
  level: number
  completedTasks: number
  activeQuests: number
  activeHabits: number
  joinedLabel: string
}

export const DEFAULT_MOCK_PROFILE: EditableProfileData = {
  displayName: 'Minh Anh',
  username: 'fox_explorer',
  title: 'Nhà thám hiểm Rừng Thông',
  bio: 'Mỗi ngày hoàn thành 3 việc nhỏ, giữ chuỗi thói quen và chinh phục IELTS 6.5 cùng Fox V2.',
  location: 'TP. Hồ Chí Minh',
  focusGoal: 'Đạt IELTS 6.5 & chạy bộ 5km đều đặn',
  avatarPresetId: 'fox-hero',
  customAvatarUrl: null,
  coverTheme: 'sunrise',
  pinnedAchievementIds: ['streak-fire', 'xp-master', 'champion'],
  showStreakToFriends: true,
  allowQuestInvites: true,
}

export const DEFAULT_MOCK_STATS: MockProfileStats = {
  streakDays: 12,
  totalXp: 1480,
  nextLevelXp: 1800,
  coinBalance: 360,
  level: 5,
  completedTasks: 48,
  activeQuests: 3,
  activeHabits: 4,
  joinedLabel: 'Tham gia từ tháng 11/2026',
}

export const DEFAULT_MOCK_FRIENDS: readonly MockFriend[] = [
  {
    id: 'fr-1',
    displayName: 'Gia Huy',
    handle: 'giahuy_quest',
    title: 'Đọc 12 cuốn sách',
    streakDays: 9,
    avatarSrc: foxMoodCheerStatic,
    isFollowing: true,
    isFollower: true,
  },
  {
    id: 'fr-2',
    displayName: 'Thu Hà',
    handle: 'thuha_run',
    title: 'Chạy bộ 5km sáng',
    streakDays: 14,
    avatarSrc: foxMoodHappyStatic,
    isFollowing: true,
    isFollower: true,
  },
  {
    id: 'fr-3',
    displayName: 'Quốc Bảo',
    handle: 'quocbao_dev',
    title: 'Tập trung sâu 2h/ngày',
    streakDays: 6,
    avatarSrc: foxMoodXpStatic,
    isFollowing: true,
    isFollower: false,
  },
  {
    id: 'fr-4',
    displayName: 'Lan Chi',
    handle: 'lanchi_mind',
    title: 'Thiền 10 phút mỗi tối',
    streakDays: 11,
    avatarSrc: foxMoodCelebrateStatic,
    isFollowing: false,
    isFollower: true,
  },
]

interface MockProfileState {
  isMockSession: boolean
  profile: EditableProfileData
  stats: MockProfileStats
  friends: MockFriend[]
  lastSavedAt: string | null
  activateMockSession: () => void
  deactivateMockSession: () => void
  updateProfile: (patch: Partial<EditableProfileData>) => void
  toggleFollowFriend: (friendId: string) => void
  resetProfile: () => void
}

export const useMockProfileStore = create<MockProfileState>((set) => ({
  isMockSession: false,
  profile: { ...DEFAULT_MOCK_PROFILE },
  stats: { ...DEFAULT_MOCK_STATS },
  friends: DEFAULT_MOCK_FRIENDS.map((f) => ({ ...f })),
  lastSavedAt: null,
  activateMockSession: () => set({ isMockSession: true }),
  deactivateMockSession: () => set({ isMockSession: false }),
  updateProfile: (patch) =>
    set((state) => ({
      profile: { ...state.profile, ...patch },
      lastSavedAt: new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    })),
  toggleFollowFriend: (friendId) =>
    set((state) => ({
      friends: state.friends.map((f) =>
        f.id === friendId ? { ...f, isFollowing: !f.isFollowing } : f,
      ),
    })),
  resetProfile: () =>
    set({
      profile: { ...DEFAULT_MOCK_PROFILE },
      friends: DEFAULT_MOCK_FRIENDS.map((f) => ({ ...f })),
      lastSavedAt: null,
    }),
}))

export function isMockLoginCredential(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === MOCK_LOGIN_CREDENTIALS.email &&
    password === MOCK_LOGIN_CREDENTIALS.password
  )
}
