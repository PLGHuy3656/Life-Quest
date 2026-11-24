import type { QuestType } from '@/types/domain'

/**
 * FE-04A.2 Shared Creation Contract across Fox Quick Create, DashboardSheets,
 * and Work Hub (Task / Habit / Quest).
 *
 * Entity type (TASK | HABIT | QUEST) is strictly separated from Task Category (QuestType).
 */
export type WorkEntityType = 'TASK' | 'HABIT' | 'QUEST'

export interface EntityTypeMeta {
  type: WorkEntityType
  label: string
  viLabel: string
  subtitle: string
  dotColor: string
  bg: string
  color: string
  capability: 'LIVE' | 'PENDING'
  placeholder: string
}

export const WORK_ENTITY_OPTIONS: EntityTypeMeta[] = [
  {
    type: 'TASK',
    label: 'Task',
    viLabel: 'Nhiệm vụ',
    subtitle: 'Việc làm một lần, có hạn',
    dotColor: '#2563EB',
    bg: '#EAF2FE',
    color: '#1D4ED8',
    capability: 'LIVE',
    placeholder: 'Tôi muốn làm nhiệm vụ...'
  },
  {
    type: 'HABIT',
    label: 'Habit',
    viLabel: 'Thói quen',
    subtitle: 'Lặp lại đều đặn, giữ chuỗi',
    dotColor: '#168C78',
    bg: '#E8F7F3',
    color: '#116F5F',
    capability: 'PENDING',
    placeholder: 'Thói quen mới (chờ Habit API)...'
  },
  {
    type: 'QUEST',
    label: 'Quest',
    viLabel: 'Hành trình',
    subtitle: 'Mục tiêu nhiều bước, có thưởng',
    dotColor: '#F26B3A',
    bg: '#FFF0E8',
    color: '#C84B1E',
    capability: 'LIVE',
    placeholder: 'Tên hành trình / mục tiêu mới...'
  }
]

export const TASK_CATEGORY_OPTIONS: { value: QuestType; label: string }[] = [
  { value: 'SIMPLE', label: 'Đơn giản (SIMPLE)' },
  { value: 'FOCUS', label: 'Tập trung (FOCUS)' },
  { value: 'DURATION', label: 'Thời lượng (DURATION)' },
  { value: 'QUANTITY', label: 'Số lượng (QUANTITY)' },
  { value: 'PROGRESS', label: 'Tiến độ (PROGRESS)' }
]

export function getEntityTypeMeta(type: WorkEntityType): EntityTypeMeta {
  return WORK_ENTITY_OPTIONS.find((o) => o.type === type) ?? WORK_ENTITY_OPTIONS[0]
}

export function validateCreationTitle(rawTitle: string): string | null {
  const trimmed = rawTitle.trim()
  if (trimmed.length < 3) {
    return 'Tiêu đề cần ít nhất 3 ký tự (theo Joi schema Backend).'
  }
  if (trimmed.length > 100) {
    return 'Tiêu đề không vượt quá 100 ký tự.'
  }
  return null
}
