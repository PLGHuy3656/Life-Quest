import dashboardJson from '@dialogues/dashboard.json'
import deadlineJson from '@dialogues/deadline.json'
import encouragementJson from '@dialogues/encouragement.json'
import idleJson from '@dialogues/idle.json'
import sceneJson from '@dialogues/scene.json'
import socialJson from '@dialogues/social.json'
import systemJson from '@dialogues/system.json'
import taskJson from '@dialogues/task.json'
import touchJson from '@dialogues/touch.json'
import { WARDROBE_DIALOGUE_COLLECTION } from './wardrobeDialogues'
import type {
  DialogueCategory,
  DialogueCollectionFile,
  DialogueEmotion,
  DialogueEventType,
  DialogueTimeOfDay,
  RawDialogueEntry
} from './types'

const VALID_EMOTIONS: ReadonlySet<DialogueEmotion> = new Set([
  'neutral',
  'happy',
  'curious',
  'encouraging',
  'playful',
  'alert',
  'panic',
  'calm'
])

const MIN_CATEGORY_COUNTS: Record<DialogueCategory, number> = {
  idle: 30,
  encouragement: 20,
  dashboard: 20,
  social: 20,
  task: 25,
  deadline: 20,
  system: 10,
  touch: 30,
  scene: 18
}

export const ALL_DIALOGUE_COLLECTIONS: DialogueCollectionFile[] = [
  idleJson as DialogueCollectionFile,
  encouragementJson as DialogueCollectionFile,
  dashboardJson as DialogueCollectionFile,
  socialJson as DialogueCollectionFile,
  taskJson as DialogueCollectionFile,
  deadlineJson as DialogueCollectionFile,
  systemJson as DialogueCollectionFile,
  touchJson as DialogueCollectionFile,
  sceneJson as DialogueCollectionFile,
  WARDROBE_DIALOGUE_COLLECTION
]

export interface CatalogValidationReport {
  valid: boolean
  totalEntries: number
  countsByCategory: Record<DialogueCategory, number>
  errors: string[]
}

export function validateDialogueCatalog(
  collections: DialogueCollectionFile[] = ALL_DIALOGUE_COLLECTIONS
): CatalogValidationReport {
  const errors: string[] = []
  const seenIds = new Set<string>()
  const seenTexts = new Set<string>()
  const countsByCategory: Record<DialogueCategory, number> = {
    idle: 0,
    encouragement: 0,
    dashboard: 0,
    social: 0,
    task: 0,
    deadline: 0,
    system: 0,
    touch: 0,
    scene: 0
  }

  let totalEntries = 0

  for (const col of collections) {
    countsByCategory[col.category] = (countsByCategory[col.category] ?? 0) + col.entries.length
    for (const entry of col.entries) {
      totalEntries += 1
      if (!entry.id || seenIds.has(entry.id)) {
        errors.push(`Duplicate or empty dialogue id: "${entry.id}"`)
      }
      seenIds.add(entry.id)

      const trimmed = entry.text.trim()
      if (trimmed.length < 4 || trimmed.length > 140) {
        errors.push(`Invalid text length for "${entry.id}": ${trimmed.length}`)
      }
      if (seenTexts.has(trimmed)) {
        errors.push(`Duplicate dialogue text for "${entry.id}"`)
      }
      seenTexts.add(trimmed)

      if (!VALID_EMOTIONS.has(entry.emotion)) {
        errors.push(`Invalid emotion "${entry.emotion}" for "${entry.id}"`)
      }
    }
  }

  for (const [cat, min] of Object.entries(MIN_CATEGORY_COUNTS) as [DialogueCategory, number][]) {
    if (countsByCategory[cat] < min) {
      errors.push(`Category "${cat}" has ${countsByCategory[cat]} lines (min ${min})`)
    }
  }

  if (totalEntries < 145) {
    errors.push(`Total dialogue lines ${totalEntries} is below required 145`)
  }

  return {
    valid: errors.length === 0,
    totalEntries,
    countsByCategory,
    errors
  }
}

export const ALL_DIALOGUE_ENTRIES: RawDialogueEntry[] = ALL_DIALOGUE_COLLECTIONS.flatMap(
  (c) => c.entries
)

export function getTimeOfDayFromHour(hour: number): Exclude<DialogueTimeOfDay, 'any'> {
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export function getEntriesForEvent(
  event: DialogueEventType,
  hour: number = new Date().getHours()
): RawDialogueEntry[] {
  const tod = getTimeOfDayFromHour(hour)
  const matching = ALL_DIALOGUE_ENTRIES.filter((e) => e.event === event)
  const todScoped = matching.filter((e) => !e.timeOfDay || e.timeOfDay === 'any' || e.timeOfDay === tod)
  return todScoped.length > 0 ? todScoped : matching
}
