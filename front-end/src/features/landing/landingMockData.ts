/**
 * Structured mock preview data for the LifeQuest Landing Page (/welcome, /index).
 * NOTE: Mobile screens & sample journey items below are intentional UI mock previews
 * until the LifeQuest Mobile app screens are finalized and connected.
 */

export const HERO_STRIP_ITEMS = [
  { id: 'task', label: 'Task rõ ràng', tone: 'blue' as const },
  { id: 'habit', label: 'Habit mỗi ngày', tone: 'teal' as const },
  { id: 'quest', label: 'Quest có cột mốc', tone: 'orange' as const },
  { id: 'fox', label: 'Cáo đồng hành 3D', tone: 'purple' as const }
] as const

export const MOCK_MOBILE_TODAY_TASKS = [
  { id: 't1', title: 'Đọc 15 trang sách kiến trúc', xp: '+30 XP', progress: 80, done: false },
  { id: 't2', title: 'Chạy bộ nhẹ buổi sáng 20 phút', xp: '+35 XP', progress: 100, done: true },
  { id: 't3', title: 'Ôn tập 20 từ vựng chuyên ngành', xp: '+25 XP', progress: 45, done: false }
] as const

export const WORK_TYPE_CARDS = [
  {
    id: 'task',
    badge: 'TASK',
    tone: 'blue' as const,
    title: 'Việc cần hoàn thành',
    tags: ['Đầu việc cụ thể', 'Hạn chót', 'Tập trung'],
    sampleTitle: 'Hoàn thiện slide báo cáo tuần',
    sampleMeta: 'Hôm nay · +40 XP'
  },
  {
    id: 'habit',
    badge: 'HABIT',
    tone: 'teal' as const,
    title: 'Nhịp điệu mỗi ngày',
    tags: ['Lặp lại', 'Chuỗi Streak', 'Nhẹ nhàng'],
    sampleTitle: 'Uống đủ 2 lít nước mỗi ngày',
    sampleMeta: 'Chuỗi 6 ngày liên tiếp'
  },
  {
    id: 'quest',
    badge: 'QUEST',
    tone: 'orange' as const,
    title: 'Mục tiêu dài hạn',
    tags: ['Nhiều cột mốc', 'Phần thưởng lớn', 'Lên cấp'],
    sampleTitle: 'Chinh phục chứng chỉ ngoại ngữ',
    sampleMeta: '3/5 cột mốc · +150 XP'
  }
] as const

export const EVIDENCE_STEPS = [
  'Chụp ảnh nhanh ngay khi hoàn thành việc',
  'Đính kèm trực tiếp vào Task hoặc Quest',
  'Chọn chế độ hiển thị: Riêng tư hoặc Bạn bè',
  'Lưu lại thành dòng thời gian hành trình',
  'Nhận XP & Xu thưởng cùng Fox ăn mừng'
] as const

export const MOCK_FRIEND_STORIES = [
  { id: 's1', author: 'Minh Anh', caption: 'Chạy bộ 5km sáng sớm', tone: 'sky' as const },
  { id: 's2', author: 'Gia Huy', caption: 'Hoàn thành 2 phiên học sâu', tone: 'warm' as const },
  { id: 's3', author: 'Thu Hà', caption: 'Đọc xong chương 4', tone: 'mint' as const }
] as const

export const MOCK_CALENDAR_HIGHLIGHTS = [
  { day: 3, label: 'Chạy bộ', tone: 'teal' as const },
  { day: 7, label: 'Quest #1', tone: 'orange' as const },
  { day: 12, label: 'Streak 7d', tone: 'purple' as const },
  { day: 18, label: 'Đọc sách', tone: 'teal' as const },
  { day: 24, label: 'Cột mốc', tone: 'blue' as const }
] as const

export const MOCK_PROGRESS_SUMMARY = [
  { num: 1, title: 'Chuỗi 14 ngày liên tiếp', sub: 'Giữ nhịp đều đặn không bỏ lỡ', tone: 'teal' as const },
  { num: 2, title: '3 Quest lớn hoàn thành', sub: 'Tích lũy hơn 480 điểm KN', tone: 'blue' as const },
  { num: 3, title: '18 phiên tập trung sâu', sub: 'Tổng 7.5 giờ không xao nhãng', tone: 'purple' as const },
  { num: 4, title: '12 ảnh minh chứng hành trình', sub: 'Lưu riêng tư theo từng cột mốc', tone: 'orange' as const },
  { num: 5, title: 'Đồng hành lên Cấp 5', sub: 'Mở khóa phụ kiện mới cho Fox V2', tone: 'navy' as const }
] as const

export const FOX_MODES_PREVIEW = [
  { id: 'ready', tag: 'Sẵn sàng', desc: 'Vẫy tay chào mỗi sáng và gợi ý việc quan trọng nhất.' },
  { id: 'focus', tag: 'Tập trung', desc: 'Ngồi yên học bài cùng bạn, không tạo thông báo làm phiền.' },
  { id: 'privacy', tag: 'Riêng tư', desc: 'Tự che mắt quay đi khi bạn nhập mật khẩu tài khoản.' }
] as const

export const ONBOARDING_STEPS_SUMMARY = [
  { num: '01', title: 'Tạo một việc', desc: 'Gõ nhanh nhiệm vụ, thói quen hoặc Quest đầu tiên trong 5 giây.' },
  { num: '02', title: 'Thực hiện cùng Fox', desc: 'Bật chế độ tập trung, check-in nhẹ nhàng và giữ lửa Streak.' },
  { num: '03', title: 'Nhìn lại hành trình', desc: 'Theo dõi lịch sử tiến bộ, nhận XP và mở khóa phụ kiện cho Fox.' }
] as const
