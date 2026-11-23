import { describe, expect, it } from 'vitest'
import {
  addDaysLocal,
  addMonthsLocal,
  formatLocalDate,
  getMonthCalendarGrid,
  getWeekDatesLocal,
  parseLocalDate
} from './date'

describe('timezone-safe local date utilities', () => {
  it('formats local dates without UTC shift near midnight', () => {
    const localEarlyMorning = new Date(2026, 10, 22, 0, 15, 0) // 2026-11-22 00:15 local
    expect(formatLocalDate(localEarlyMorning)).toBe('2026-11-22')

    const localLateNight = new Date(2026, 10, 22, 23, 59, 59) // 2026-11-22 23:59 local
    expect(formatLocalDate(localLateNight)).toBe('2026-11-22')
  })

  it('parses and steps across month and year boundaries cleanly', () => {
    expect(addDaysLocal('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDaysLocal('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDaysLocal('2024-03-01', -1)).toBe('2024-02-29')
  })

  it('clamps end-of-month dates when stepping months', () => {
    expect(addMonthsLocal('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonthsLocal('2024-01-31', 1)).toBe('2024-02-29')
  })

  it('builds a 42-cell Monday-first month grid and 7-day week', () => {
    const grid = getMonthCalendarGrid(2026, 10, '2026-11-22') // Nov 2026
    expect(grid).toHaveLength(42)
    expect(grid.find((c) => c.ymd === '2026-11-22')?.isToday).toBe(true)

    const week = getWeekDatesLocal('2026-11-22', '2026-11-22') // Sunday -> week Mon Nov 16..Sun Nov 22
    expect(week).toHaveLength(7)
    expect(week[0].ymd).toBe('2026-11-16')
    expect(week[6].ymd).toBe('2026-11-22')
  })

  it('throws on invalid date strings', () => {
    expect(() => parseLocalDate('2026/11/22')).toThrow()
  })
})
