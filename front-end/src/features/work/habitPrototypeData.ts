export type HabitDayCellState = 'done' | 'missed' | 'today' | 'future'

export interface PrototypeHabit {
  id: string
  title: string
  cadence: string
  shortCadence: string
  reminderText: string
  linkedQuest: string
  category: 'health' | 'focus' | 'mind'
  plannedDays: boolean[]
  /** Visual prototype preview stats — clearly labeled as PENDING Habit API. */
  previewCurrentStreak: number
  previewBestStreak: number
  previewWeekDone: number
  previewWeekTarget: number
  previewXp: number
  /** 28 cells (4 weeks × 7 days, T2..CN) for visual prototype heatmap. */
  previewFourWeeks: HabitDayCellState[]
}

export const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const

// Isolated visual-only reference items — clearly labeled PROTOTYPE • PENDING API.
export const PROTOTYPE_HABITS: PrototypeHabit[] = [
  {
    id: 'hab-proto-1',
    title: 'Uống 2 lít nước chia 4 mốc trong ngày',
    cadence: 'Hằng ngày • Sáng / Trưa / Chiều / Tối',
    shortCadence: 'Hằng ngày · Cả ngày',
    reminderText: 'Hằng ngày · Nhắc lúc 09:00 · Không có hạn chót',
    linkedQuest: 'Duy trì sức khỏe & thể lực buổi sáng',
    category: 'health',
    plannedDays: [true, true, true, true, true, true, true],
    previewCurrentStreak: 12,
    previewBestStreak: 21,
    previewWeekDone: 5,
    previewWeekTarget: 7,
    previewXp: 15,
    previewFourWeeks: [
      'done', 'done', 'done', 'done', 'missed', 'done', 'done',
      'done', 'done', 'missed', 'done', 'done', 'done', 'done',
      'missed', 'done', 'done', 'done', 'done', 'missed', 'done',
      'done', 'done', 'done', 'done', 'done', 'today', 'future'
    ]
  },
  {
    id: 'hab-proto-2',
    title: 'Chạy bộ nhẹ hoặc giãn cơ 20 phút',
    cadence: 'Thứ 2, 4, 6, CN • 06:30',
    shortCadence: '4 lần/tuần · 06:30',
    reminderText: '4 buổi/tuần · Nhắc lúc 06:30 · Không có hạn chót',
    linkedQuest: 'Duy trì sức khỏe & thể lực buổi sáng',
    category: 'health',
    plannedDays: [true, false, true, false, true, false, true],
    previewCurrentStreak: 6,
    previewBestStreak: 14,
    previewWeekDone: 3,
    previewWeekTarget: 4,
    previewXp: 20,
    previewFourWeeks: [
      'done', 'missed', 'done', 'missed', 'done', 'missed', 'done',
      'done', 'missed', 'done', 'missed', 'missed', 'missed', 'done',
      'done', 'missed', 'done', 'missed', 'done', 'missed', 'done',
      'done', 'missed', 'done', 'missed', 'done', 'today', 'future'
    ]
  },
  {
    id: 'hab-proto-3',
    title: 'Phiên tập trung sâu 25 phút không thông báo',
    cadence: 'Thứ 2 – Thứ 6 • 09:00',
    shortCadence: 'T2 – T6 · 09:00',
    reminderText: 'Thứ 2 – Thứ 6 · Nhắc lúc 09:00 · Không có hạn chót',
    linkedQuest: 'Hoàn thành đồ án LifeQuest',
    category: 'focus',
    plannedDays: [true, true, true, true, true, false, false],
    previewCurrentStreak: 9,
    previewBestStreak: 18,
    previewWeekDone: 5,
    previewWeekTarget: 5,
    previewXp: 25,
    previewFourWeeks: [
      'done', 'done', 'done', 'done', 'done', 'missed', 'missed',
      'done', 'missed', 'done', 'done', 'done', 'missed', 'missed',
      'done', 'done', 'done', 'done', 'done', 'missed', 'missed',
      'done', 'done', 'done', 'done', 'done', 'today', 'future'
    ]
  },
  {
    id: 'hab-proto-4',
    title: 'Đọc 15 trang tài liệu kỹ thuật trước khi ngủ',
    cadence: 'Hằng ngày • 21:30',
    shortCadence: 'Hằng ngày · 21:30',
    reminderText: 'Hằng ngày · Nhắc lúc 21:30 · Không có hạn chót',
    linkedQuest: 'Hoàn thành đồ án LifeQuest',
    category: 'mind',
    plannedDays: [true, true, true, true, true, true, true],
    previewCurrentStreak: 12,
    previewBestStreak: 21,
    previewWeekDone: 5,
    previewWeekTarget: 7,
    previewXp: 15,
    previewFourWeeks: [
      'done', 'done', 'done', 'done', 'missed', 'done', 'done',
      'done', 'done', 'missed', 'done', 'done', 'done', 'done',
      'missed', 'done', 'done', 'done', 'done', 'missed', 'done',
      'done', 'done', 'done', 'done', 'done', 'today', 'future'
    ]
  }
]
