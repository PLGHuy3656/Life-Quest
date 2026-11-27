export type TabId = 'dashboard' | 'messages' | 'calendar' | 'tasks' | 'wardrobe' | 'profile' | 'focus' | 'work' | 'social'

export type ScreenId =
  | '01_loading'
  | '02_welcome'
  | '03_login'
  | '04_register'
  | '05_dashboard'
  | '06_tasks'
  | '07_task_detail'
  | '08_focus'
  | '09_habits'
  | '10_quests'
  | '11_quest_detail'
  | '12_create_sheet'
  | '13_calendar'
  | '14_messages'
  | '15_chat'
  | '16_wardrobe'
  | '17_profile'
  | '18_settings'

export type WorkSubTab = 'tasks' | 'habits' | 'quests' | 'completed'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'boss'
export type Category = 'fitness' | 'learning' | 'work' | 'mindfulness' | 'social'

export interface TaskItem {
  id: string
  title: string
  description?: string
  completed: boolean
  dueDate?: string
  priority: Priority
  category: Category
  xpReward: number
  coinReward: number
  isPinned?: boolean
}

export interface HabitItem {
  id: string
  title: string
  category: Category
  streak: number
  targetDaysPerWeek: number
  positiveCount: number
  negativeCount: number
  isPositiveOnly?: boolean
  xpReward: number
}

export interface MilestoneItem {
  id: string
  title: string
  completed: boolean
  xpReward: number
}

export interface QuestItem {
  id: string
  title: string
  description: string
  difficulty: QuestDifficulty
  category: Category
  progressPercent: number
  xpReward: number
  coinReward: number
  milestones: MilestoneItem[]
  isPinned?: boolean
  badgeIcon: string
}

export interface ScheduleItem {
  id: string
  time: string
  title: string
  category: Category
  completed: boolean
}

export interface SocialFeedPost {
  id: string
  userName: string
  userAvatar: string
  actionText: string
  targetTitle: string
  timeAgo: string
  likes: number
  cheers: number
  isLiked?: boolean
  isCheered?: boolean
}

export interface FoxState {
  name: string
  mood: 'happy' | 'focused' | 'sleepy' | 'cheering' | 'playful'
  affection: number // 0-100
  speechBubble: string
  equippedHat: string | null
  equippedOutfit: string | null
  equippedAccessory: string | null
}

export interface WardrobeItem {
  id: string
  name: string
  category: 'hat' | 'outfit' | 'accessory' | 'theme'
  price: number
  icon: string
  unlocked: boolean
  equipped: boolean
  description: string
  buffText: string
}

export interface PlayerStats {
  str: number
  int: number
  dis: number
  cha: number
}

export interface Player {
  id: string
  username: string
  displayName: string
  avatar: string
  level: number
  totalXp: number
  currentLevelXp: number
  nextLevelXp: number
  coins: number
  streak: number
  stats: PlayerStats
  theme: 'light' | 'dark'
}
