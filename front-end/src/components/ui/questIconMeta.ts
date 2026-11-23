import {
  Brain,
  CheckSquare,
  Coins,
  Compass,
  Flag,
  Hash,
  Heart,
  Repeat,
  Sparkles,
  Timer,
  TrendingUp,
  type LucideIcon
} from 'lucide-react'
import type { ChipProps } from '@/components/ui/Chip'
import type { QuestType } from '@/types/domain'

export type SemanticConcept =
  | 'task'
  | 'habit'
  | 'quest'
  | 'milestone'
  | 'focus'
  | 'duration'
  | 'quantity'
  | 'progress'
  | 'reward'
  | 'xp'
  | 'activity'

export interface SemanticIconMeta {
  Icon: LucideIcon
  label: string
  tone: NonNullable<ChipProps['tone']>
  color: string
  softBg: string
}

export const CONCEPT_ICONS: Record<SemanticConcept, SemanticIconMeta> = {
  task: {
    Icon: CheckSquare,
    label: 'Nhiệm vụ',
    tone: 'neutral',
    color: '#16324A',
    softBg: '#EDF2F7'
  },
  habit: {
    Icon: Repeat,
    label: 'Thói quen',
    tone: 'success',
    color: '#168C78',
    softBg: '#E8F7F3'
  },
  quest: {
    Icon: Compass,
    label: 'Thử thách',
    tone: 'accent',
    color: '#F26B3A',
    softBg: '#FFF0E8'
  },
  milestone: {
    Icon: Flag,
    label: 'Cột mốc',
    tone: 'reward',
    color: '#9A6B00',
    softBg: '#FEF5DC'
  },
  focus: {
    Icon: Brain,
    label: 'Tập trung',
    tone: 'accent',
    color: '#D95324',
    softBg: '#FFF0E8'
  },
  duration: {
    Icon: Timer,
    label: 'Thời lượng',
    tone: 'success',
    color: '#168C78',
    softBg: '#E8F7F3'
  },
  quantity: {
    Icon: Hash,
    label: 'Số lượng',
    tone: 'reward',
    color: '#8C6200',
    softBg: '#FEF5DC'
  },
  progress: {
    Icon: TrendingUp,
    label: 'Tiến độ',
    tone: 'neutral',
    color: '#2B5B84',
    softBg: '#EBF2F8'
  },
  reward: {
    Icon: Coins,
    label: 'Xu thưởng',
    tone: 'reward',
    color: '#9A6B00',
    softBg: '#FEF5DC'
  },
  xp: {
    Icon: Sparkles,
    label: 'Kinh nghiệm',
    tone: 'reward',
    color: '#8C6200',
    softBg: '#FEF5DC'
  },
  activity: {
    Icon: Heart,
    label: 'Hoạt động',
    tone: 'accent',
    color: '#F26B3A',
    softBg: '#FFF0E8'
  }
}

export const QUEST_TYPE_META: Record<QuestType, SemanticIconMeta> = {
  FOCUS: CONCEPT_ICONS.focus,
  DURATION: CONCEPT_ICONS.duration,
  QUANTITY: CONCEPT_ICONS.quantity,
  PROGRESS: CONCEPT_ICONS.progress,
  SIMPLE: CONCEPT_ICONS.task
}
