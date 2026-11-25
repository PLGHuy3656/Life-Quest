import type { SelectedDateMoment } from './CalendarDailyAgendaPanel'

/**
 * Demo Moment seed images (explicitly requested by user for visual preview while Backend Media API is pending).
 * Uses lightweight inline SVG data URIs matching LifeQuest's warm illustration palette.
 */
function svgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`
}

const MOMENT_CHART_SVG = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 140" fill="none">
  <rect width="320" height="140" rx="16" fill="#E8F1FD"/>
  <rect x="44" y="16" width="232" height="114" rx="14" fill="#FFFFFF" stroke="#C7D9F2" stroke-width="2"/>
  <rect x="76" y="68" width="24" height="44" rx="6" fill="#4B83F2"/>
  <rect x="114" y="42" width="24" height="70" rx="6" fill="#168C78"/>
  <rect x="152" y="28" width="24" height="84" rx="6" fill="#F26B3A"/>
  <rect x="196" y="42" width="52" height="10" rx="5" fill="#D5E3F6"/>
  <rect x="196" y="62" width="42" height="10" rx="5" fill="#D5E3F6"/>
  <rect x="196" y="82" width="56" height="10" rx="5" fill="#D5E3F6"/>
</svg>
`)

const MOMENT_NATURE_SVG = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 140" fill="none">
  <rect width="320" height="140" rx="16" fill="#E6F4EC"/>
  <circle cx="240" cy="36" r="18" fill="#F6C85F"/>
  <path d="M0 108 Q80 62 156 96 T320 92 L320 140 L0 140 Z" fill="#9BD1B3"/>
  <path d="M0 122 Q110 82 220 112 T320 104 L320 140 L0 140 Z" fill="#5EA884"/>
  <path d="M98 110 L114 70 L130 110 Z" fill="#168C78"/>
  <path d="M214 114 L228 78 L242 114 Z" fill="#168C78"/>
</svg>
`)

const MOMENT_STUDY_SVG = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 140" fill="none">
  <rect width="320" height="140" rx="16" fill="#EFEBFD"/>
  <rect x="74" y="34" width="84" height="76" rx="10" fill="#FFFFFF" stroke="#4F46E5" stroke-width="2.5"/>
  <rect x="162" y="34" width="84" height="76" rx="10" fill="#FFFFFF" stroke="#4F46E5" stroke-width="2.5"/>
  <line x1="90" y1="54" x2="142" y2="54" stroke="#A5B4FC" stroke-width="4" stroke-linecap="round"/>
  <line x1="90" y1="70" x2="136" y2="70" stroke="#A5B4FC" stroke-width="4" stroke-linecap="round"/>
  <line x1="90" y1="86" x2="128" y2="86" stroke="#A5B4FC" stroke-width="4" stroke-linecap="round"/>
  <line x1="178" y1="54" x2="230" y2="54" stroke="#A5B4FC" stroke-width="4" stroke-linecap="round"/>
  <line x1="178" y1="70" x2="222" y2="70" stroke="#A5B4FC" stroke-width="4" stroke-linecap="round"/>
  <circle cx="234" cy="28" r="10" fill="#F6C85F"/>
</svg>
`)

const MOMENT_DESK_SVG = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 140" fill="none">
  <rect width="320" height="140" rx="16" fill="#FEF3DC"/>
  <rect x="86" y="34" width="118" height="74" rx="12" fill="#16324A"/>
  <rect x="96" y="44" width="98" height="54" rx="7" fill="#D5ECE5"/>
  <rect x="220" y="64" width="30" height="36" rx="8" fill="#F26B3A"/>
  <path d="M250 72 H258 C262 72 262 88 258 88 H250" stroke="#F26B3A" stroke-width="4"/>
  <rect x="64" y="108" width="196" height="8" rx="4" fill="#E6C999"/>
</svg>
`)

export function getDemoMomentsForDate(
  ymd: string,
  todayYmd: string
): SelectedDateMoment[] {
  if (ymd === todayYmd) {
    return [
      {
        imageUrl: MOMENT_CHART_SVG,
        caption: 'Hoàn thành bản nháp giao diện Lịch hành trình! (Ảnh mẫu)'
      },
      {
        imageUrl: MOMENT_STUDY_SVG,
        caption: 'Rà soát xong hợp đồng API Today & Quests (Ảnh mẫu)'
      }
    ]
  }
  const day = Number(ymd.slice(8, 10))
  if (day === 14) {
    return [
      {
        imageUrl: MOMENT_NATURE_SVG,
        caption: 'Chạy bộ sáng quanh công viên 5km (Ảnh mẫu)'
      }
    ]
  }
  if (day === 8) {
    return [
      {
        imageUrl: MOMENT_STUDY_SVG,
        caption: 'Đọc xong chương kiến trúc React Query (Ảnh mẫu)'
      }
    ]
  }
  if (day === 3) {
    return [
      {
        imageUrl: MOMENT_DESK_SVG,
        caption: 'Góc học tập gọn gàng đầu tuần (Ảnh mẫu)'
      }
    ]
  }
  return []
}

export function getDemoMomentForDate(
  ymd: string,
  todayYmd: string
): SelectedDateMoment | null {
  return getDemoMomentsForDate(ymd, todayYmd)[0] ?? null
}
