import { Coins, Sparkles } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import type { QuestType } from '@/types/domain'
import { CONCEPT_ICONS, QUEST_TYPE_META } from './questIconMeta'

export function QuestTypeBadge({ type }: { type: QuestType }) {
  const meta = QUEST_TYPE_META[type] ?? CONCEPT_ICONS.task
  const Icon = meta.Icon
  return (
    <Chip tone={meta.tone}>
      <Icon size={12} strokeWidth={2.25} aria-hidden="true" />
      <span>{meta.label}</span>
    </Chip>
  )
}

export function RewardXpBadge({ xp }: { xp: number }) {
  return (
    <Chip tone="reward">
      <Sparkles size={12} strokeWidth={2.25} aria-hidden="true" />
      <span>+{xp} XP</span>
    </Chip>
  )
}

export function RewardCoinBadge({ coins }: { coins: number }) {
  if (coins <= 0) return null
  return (
    <Chip tone="reward">
      <Coins size={12} strokeWidth={2.25} aria-hidden="true" />
      <span>+{coins}</span>
    </Chip>
  )
}
