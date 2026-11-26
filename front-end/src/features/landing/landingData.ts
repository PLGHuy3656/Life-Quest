import { LANDING_FOX_ASSETS, type FoxAssetPair } from './landingAssets'

export interface PreviewTaskItem {
  readonly id: string
  readonly title: string
  readonly mobileTitle?: string
  readonly done: boolean
  readonly xp?: string
  readonly mobileXp?: string
  readonly time?: string
  readonly tag?: string
}

export type HabitDayStatus = 'done' | 'off' | 'today' | 'future'

export interface PreviewHabitItem {
  readonly id: string
  readonly title: string
  readonly streak: number
  readonly days: readonly HabitDayStatus[]
}

export interface PreviewEpicNode {
  readonly id: string
  readonly label: string
  readonly title: string
  readonly status: 'done' | 'active' | 'locked'
  readonly desktopLeftOffset: number
  readonly desktopTop: number
}

export interface FoxMoodItem {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly mobileDescription: string
  readonly accentColor: string
  readonly bgColor: string
  readonly asset: FoxAssetPair
  readonly alt: string
  readonly desktopLeftOffset: number
  readonly desktopTop: number
}

export interface UpcomingSocialFeature {
  readonly id: string
  readonly icon: 'users' | 'photo' | 'chat' | 'map' | 'trophy'
  readonly title: string
  readonly description: string
}

export interface FireflySpec {
  readonly left: number
  readonly top: number
  readonly fx: number
  readonly fy: number
  readonly duration: number
  readonly delay: number
}

export interface StarSpec {
  readonly left?: string
  readonly cx?: number
  readonly cy?: number
  readonly top?: number
  readonly size: number
  readonly opacity: number
  readonly delay: number
}

export const LANDING_COPY = {
  heroHeadlineLine1: 'Mỗi ngày đều là',
  heroHeadlineLine2Prefix: 'một cuộc ',
  heroHeadlineAccent: 'phiêu lưu.',
  heroSubtitle: 'Không cần hoàn hảo ngay từ đầu. Chỉ cần bắt đầu, Fox sẽ đồng hành cùng bạn.',
  heroPrimaryCta: 'Bắt đầu hành trình',
  heroSecondaryPrefix: 'Đã có tài khoản? ',
  heroSecondaryCta: 'Đăng nhập',
  headerLoginCta: 'ĐĂNG NHẬP',
} as const

export const CP1_TASKS: readonly PreviewTaskItem[] = [
  { id: 't1', title: 'Chạy bộ 20 phút', done: true, xp: '+35 XP', mobileXp: '+35' },
  { id: 't2', title: 'Đọc 15 trang sách', mobileTitle: 'Đọc 15 trang', done: true, xp: '+30 XP', mobileXp: '+30' },
  {
    id: 't3',
    title: 'Hoàn thiện slide báo cáo',
    mobileTitle: 'Slide báo cáo',
    done: false,
    time: '16:00',
    xp: '+40 XP',
    mobileXp: '+40',
  },
  { id: 't4', title: 'Gọi điện cho bà', done: false, tag: 'Gia đình' },
]

export const CP1_HABIT_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const

export const CP1_TODAY_INDEX = 3 // Thứ Năm (T5) matching "Thứ Năm, 26/11"

export const CP1_HABITS: readonly PreviewHabitItem[] = [
  {
    id: 'h1',
    title: 'Uống đủ 2 lít nước',
    streak: 5,
    days: ['done', 'done', 'done', 'today', 'future', 'future', 'future'],
  },
  {
    id: 'h2',
    title: 'Thiền 10 phút',
    streak: 3,
    days: ['done', 'off', 'done', 'today', 'future', 'future', 'future'],
  },
  {
    id: 'h3',
    title: 'Ngủ trước 23h',
    streak: 4,
    days: ['done', 'done', 'done', 'today', 'future', 'future', 'future'],
  },
]

export const CP2_EPICS: readonly PreviewEpicNode[] = [
  { id: 'e1', label: 'EPIC 1', title: 'Ngữ pháp nền', status: 'done', desktopLeftOffset: -575, desktopTop: 290 },
  { id: 'e2', label: 'EPIC 2', title: 'Từ vựng 1.000 từ', status: 'done', desktopLeftOffset: -335, desktopTop: 190 },
  { id: 'e3', label: 'EPIC 3', title: 'Luyện nghe', status: 'active', desktopLeftOffset: -75, desktopTop: 280 },
  { id: 'e4', label: 'EPIC 4', title: 'Luyện nói', status: 'locked', desktopLeftOffset: 185, desktopTop: 180 },
  { id: 'e5', label: 'EPIC 5', title: 'Thi thử', status: 'locked', desktopLeftOffset: 425, desktopTop: 260 },
]

export const CP2_QUEST_TASKS: readonly PreviewTaskItem[] = [
  { id: 'qt1', title: 'Nghe 1 bài Part 2', done: true, xp: '+20 XP' },
  { id: 'qt2', title: 'Ghi 10 từ mới', done: false, xp: '+15 XP' },
]

export const CP3_FOX_MOODS: readonly FoxMoodItem[] = [
  {
    id: 'happy',
    title: 'Vui mừng',
    description: 'Khi bạn tích xong một việc.',
    mobileDescription: 'Khi bạn tích xong việc.',
    accentColor: '#127A68',
    bgColor: '#E3F3EF',
    asset: LANDING_FOX_ASSETS.moodHappy,
    alt: 'Fox V2 — Vui mừng',
    desktopLeftOffset: -520,
    desktopTop: 40,
  },
  {
    id: 'cheer',
    title: 'Cổ vũ',
    description: 'Khi chuỗi Streak cần được giữ.',
    mobileDescription: 'Khi Streak cần giữ.',
    accentColor: '#B84317',
    bgColor: '#FFF0E6',
    asset: LANDING_FOX_ASSETS.moodCheer,
    alt: 'Fox V2 — Cổ vũ',
    desktopLeftOffset: 270,
    desktopTop: 40,
  },
  {
    id: 'celebrate',
    title: 'Ăn mừng',
    description: 'Khi một Quest về đích.',
    mobileDescription: 'Khi Quest về đích.',
    accentColor: '#7A5400',
    bgColor: '#FDF3D7',
    asset: LANDING_FOX_ASSETS.moodCelebrate,
    alt: 'Fox V2 — Ăn mừng',
    desktopLeftOffset: -560,
    desktopTop: 330,
  },
  {
    id: 'xp',
    title: 'Nhận XP',
    description: 'Khi điểm kinh nghiệm được cộng.',
    mobileDescription: 'Khi điểm được cộng.',
    accentColor: '#4D6274',
    bgColor: '#EEF1F4',
    asset: LANDING_FOX_ASSETS.moodXp,
    alt: 'Fox V2 — Nhận XP',
    desktopLeftOffset: 310,
    desktopTop: 330,
  },
]

export const CP4_SOCIAL_FEATURES: readonly UpcomingSocialFeature[] = [
  { id: 'friends', icon: 'users', title: 'Bạn bè riêng tư', description: 'Chỉ người bạn chấp nhận.' },
  { id: 'moments', icon: 'photo', title: 'Moments', description: 'Khoảnh khắc chỉ gửi bạn bè.' },
  { id: 'messenger', icon: 'chat', title: 'Messenger', description: 'Nhắn tin, cổ vũ nhau.' },
  { id: 'shared-quest', icon: 'map', title: 'Quest chung', description: 'Cùng đi một hành trình.' },
  { id: 'challenge', icon: 'trophy', title: 'Thử thách', description: 'Rủ bạn thử sức cùng.' },
]

export const FINALE_STARS: readonly StarSpec[] = [
  { cx: 120, cy: 80, size: 2, opacity: 0.7, delay: 0.4 },
  { cx: 300, cy: 150, size: 1.6, opacity: 0.5, delay: 2.4 },
  { cx: 520, cy: 60, size: 2, opacity: 0.6, delay: 0.8 },
  { cx: 860, cy: 110, size: 1.6, opacity: 0.5, delay: 2.4 },
  { cx: 1040, cy: 50, size: 2.2, opacity: 0.7, delay: 1.6 },
  { cx: 1260, cy: 140, size: 1.8, opacity: 0.6, delay: 0 },
  { cx: 1380, cy: 70, size: 1.4, opacity: 0.5, delay: 0.4 },
  { cx: 700, cy: 180, size: 1.4, opacity: 0.4, delay: 0 },
  { cx: 200, cy: 220, size: 1.4, opacity: 0.5, delay: 1.6 },
  { cx: 960, cy: 200, size: 1.6, opacity: 0.5, delay: 0.4 },
]

export const FOOTER_STARS: readonly StarSpec[] = [
  { left: '8%', top: 30, size: 2, opacity: 0.6, delay: 0 },
  { left: '22%', top: 70, size: 2, opacity: 0.6, delay: 0.4 },
  { left: '37%', top: 24, size: 3, opacity: 0.6, delay: 0.7 },
  { left: '55%', top: 50, size: 2, opacity: 0.6, delay: 1.1 },
  { left: '68%', top: 18, size: 2, opacity: 0.6, delay: 1.5 },
  { left: '83%', top: 60, size: 3, opacity: 0.6, delay: 1.9 },
  { left: '93%', top: 34, size: 2, opacity: 0.6, delay: 2.2 },
  { left: '47%', top: 96, size: 2, opacity: 0.6, delay: 2.6 },
]

export const DESKTOP_FIREFLIES: readonly FireflySpec[] = [
  { left: 487, top: 123, fx: 7, fy: -20, duration: 7.5, delay: 0.4 },
  { left: 26, top: 297, fx: -7, fy: -15, duration: 5.9, delay: 6.0 },
  { left: 963, top: 300, fx: 10, fy: -41, duration: 5.9, delay: 0.9 },
  { left: 1071, top: 256, fx: -39, fy: -46, duration: 5.6, delay: 5.7 },
  { left: 87, top: 211, fx: -37, fy: -33, duration: 6.9, delay: 4.3 },
  { left: 793, top: 275, fx: 10, fy: -22, duration: 8.9, delay: 0.8 },
  { left: 748, top: 106, fx: -36, fy: -42, duration: 7.0, delay: 1.5 },
  { left: 1376, top: 280, fx: 40, fy: -31, duration: 6.7, delay: 5.0 },
  { left: 1175, top: 236, fx: 28, fy: -24, duration: 7.3, delay: 5.4 },
  { left: 1396, top: 71, fx: -5, fy: -40, duration: 7.8, delay: 2.0 },
  { left: 1109, top: 110, fx: -13, fy: -33, duration: 6.1, delay: 0.4 },
  { left: 1308, top: 304, fx: -29, fy: -28, duration: 8.2, delay: 2.5 },
  { left: 308, top: 67, fx: -3, fy: -23, duration: 8.1, delay: 5.2 },
  { left: 90, top: 80, fx: 8, fy: -29, duration: 7.2, delay: 5.5 },
]

export const MOBILE_FIREFLIES: readonly FireflySpec[] = [
  { left: 165, top: 83, fx: 10, fy: -47, duration: 5.3, delay: 3.2 },
  { left: 187, top: 194, fx: -33, fy: -18, duration: 5.9, delay: 0.5 },
  { left: 214, top: 62, fx: -10, fy: -45, duration: 7.2, delay: 0.4 },
  { left: 289, top: 76, fx: -12, fy: -47, duration: 7.3, delay: 2.4 },
  { left: 113, top: 56, fx: 31, fy: -42, duration: 6.2, delay: 0.9 },
  { left: 60, top: 191, fx: -1, fy: -15, duration: 8.3, delay: 1.1 },
  { left: 297, top: 191, fx: -16, fy: -27, duration: 5.4, delay: 4.3 },
  { left: 288, top: 60, fx: 39, fy: -37, duration: 7.0, delay: 3.2 },
]
