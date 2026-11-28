export type QuestType = 'daily' | 'habit' | 'quest' | 'milestone'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'boss'
export type QuestCategory = 'fitness' | 'learning' | 'work' | 'mindfulness' | 'social'

export interface Quest {
  id: string
  title: string
  description?: string
  type: QuestType
  difficulty: Difficulty
  xpReward: number
  coinReward: number
  completed: boolean
  category: QuestCategory
  streak?: number
  positive?: boolean // For habits
  dueDate?: string
  pinned?: boolean
}

export interface PlayerStats {
  str: number // Strength / Thể lực & Vận động
  int: number // Intelligence / Học tập & Kỹ năng
  dis: number // Discipline / Kỷ luật & Thói quen
  cha: number // Charisma / Xã hội & Kết nối
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
  maxStreak: number
  stats: PlayerStats
  completedQuestsCount: number
}

export type FoxMood = 'happy' | 'focused' | 'sleepy' | 'cheering' | 'playful'

export interface FoxState {
  name: string
  mood: FoxMood
  affection: number // 0 to 100
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
  color: string
  unlocked: boolean
  equipped: boolean
  description: string
  bonusText?: string
}

export interface FocusSession {
  durationMinutes: number
  completedAt: string
  questId?: string
}
