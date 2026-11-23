/**
 * Timezone-safe local date utilities for Calendar & Today (YYYY-MM-DD).
 * Never uses Date.prototype.toISOString().slice(0, 10) for local dates, avoiding
 * off-by-one UTC midnight shifts in UTC+7 / UTC-N timezones.
 */

const YMD_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getTodayLocalDate(): string {
  return formatLocalDate(new Date())
}

export function parseLocalDate(ymd: string): Date {
  const match = YMD_PATTERN.exec(ymd)
  if (!match) {
    throw new Error(`Invalid YYYY-MM-DD date string: ${ymd}`)
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

export function addDaysLocal(ymd: string, deltaDays: number): string {
  const date = parseLocalDate(ymd)
  date.setDate(date.getDate() + deltaDays)
  return formatLocalDate(date)
}

export function addMonthsLocal(ymd: string, deltaMonths: number): string {
  const date = parseLocalDate(ymd)
  const targetDay = date.getDate()
  date.setDate(1)
  date.setMonth(date.getMonth() + deltaMonths)
  const maxDayInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(targetDay, maxDayInMonth))
  return formatLocalDate(date)
}

export interface CalendarCell {
  ymd: string
  dayOfMonth: number
  inCurrentMonth: boolean
  isToday: boolean
}

/**
 * Generates a 42-cell (6-week) Monday-first month calendar grid in local time.
 */
export function getMonthCalendarGrid(year: number, monthIndex: number, todayYmd = getTodayLocalDate()): CalendarCell[] {
  const firstOfMonth = new Date(year, monthIndex, 1)
  // Convert JS Sunday=0..Saturday=6 into Monday=0..Sunday=6
  const startOffset = (firstOfMonth.getDay() + 6) % 7
  const gridStart = new Date(year, monthIndex, 1 - startOffset)

  const cells: CalendarCell[] = []
  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    const ymd = formatLocalDate(cellDate)
    cells.push({
      ymd,
      dayOfMonth: cellDate.getDate(),
      inCurrentMonth: cellDate.getMonth() === monthIndex,
      isToday: ymd === todayYmd
    })
  }
  return cells
}

/**
 * Generates the 7-day Monday-first week containing the given YYYY-MM-DD date.
 */
export function getWeekDatesLocal(ymd: string, todayYmd = getTodayLocalDate()): CalendarCell[] {
  const date = parseLocalDate(ymd)
  const offsetFromMonday = (date.getDay() + 6) % 7
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - offsetFromMonday)

  const cells: CalendarCell[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    const cellYmd = formatLocalDate(d)
    cells.push({
      ymd: cellYmd,
      dayOfMonth: d.getDate(),
      inCurrentMonth: d.getMonth() === date.getMonth(),
      isToday: cellYmd === todayYmd
    })
  }
  return cells
}

/**
 * Converts a local YYYY-MM-DD date + HH:mm time into an ISO-8601 timestamp with local offset
 * preserved so Backend ISO date validation succeeds without shifting the intended date.
 */
export function combineLocalDateAndTimeToIso(ymd: string, hhmm: string): string {
  const base = parseLocalDate(ymd)
  const [hoursStr = '09', minsStr = '00'] = hhmm.split(':')
  base.setHours(Number(hoursStr), Number(minsStr), 0, 0)
  return base.toISOString()
}

export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh'
  } catch {
    return 'Asia/Ho_Chi_Minh'
  }
}
