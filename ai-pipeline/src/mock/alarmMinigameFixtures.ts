import type { AlarmTriggerSnapshot } from '../domain/types.js'

/**
 * 14-day mock Alarm & AlarmTrigger history aligned with Branch 4 (alarms-and-minigames).
 * Simulates a user struggling with 06:30 MATH (EASY) alarm (4 MISSED, avg 2.3 snoozes)
 * so AI Alarm Coach recommends switching to MEMORY_SEQUENCE (MEDIUM) + morning quest link.
 */
export function getMockAlarmTriggers14d(): AlarmTriggerSnapshot[] {
  return [
    { alarmId: 'mock-alarm-0630', label: 'Dậy sớm học & chạy bộ', timeOfDay: '06:30', miniGameType: 'MATH', difficulty: 'EASY', status: 'DISMISSED', snoozeCount: 2, attempts: 1, linkedQuestId: 'mock-quest-reading-01', linkedQuestTitle: 'Đọc 30 trang sách chuyên ngành buổi tối' },
    { alarmId: 'mock-alarm-0630', label: 'Dậy sớm học & chạy bộ', timeOfDay: '06:30', miniGameType: 'MATH', difficulty: 'EASY', status: 'MISSED', snoozeCount: 3, attempts: 0 },
    { alarmId: 'mock-alarm-0630', label: 'Dậy sớm học & chạy bộ', timeOfDay: '06:30', miniGameType: 'MATH', difficulty: 'EASY', status: 'DISMISSED', snoozeCount: 2, attempts: 1 },
    { alarmId: 'mock-alarm-0630', label: 'Dậy sớm học & chạy bộ', timeOfDay: '06:30', miniGameType: 'MATH', difficulty: 'EASY', status: 'MISSED', snoozeCount: 3, attempts: 1 },
    { alarmId: 'mock-alarm-0630', label: 'Dậy sớm học & chạy bộ', timeOfDay: '06:30', miniGameType: 'MATH', difficulty: 'EASY', status: 'DISMISSED', snoozeCount: 3, attempts: 2 },
    { alarmId: 'mock-alarm-0630', label: 'Dậy sớm học & chạy bộ', timeOfDay: '06:30', miniGameType: 'MATH', difficulty: 'EASY', status: 'MISSED', snoozeCount: 3, attempts: 0 },
    { alarmId: 'mock-alarm-0630', label: 'Dậy sớm học & chạy bộ', timeOfDay: '06:30', miniGameType: 'MATH', difficulty: 'EASY', status: 'DISMISSED', snoozeCount: 1, attempts: 1 },
    { alarmId: 'mock-alarm-0630', label: 'Dậy sớm học & chạy bộ', timeOfDay: '06:30', miniGameType: 'MATH', difficulty: 'EASY', status: 'MISSED', snoozeCount: 2, attempts: 0 },
    { alarmId: 'mock-alarm-0630', label: 'Dậy sớm học & chạy bộ', timeOfDay: '06:30', miniGameType: 'MATH', difficulty: 'EASY', status: 'DISMISSED', snoozeCount: 2, attempts: 1 },
    { alarmId: 'mock-alarm-0630', label: 'Dậy sớm học & chạy bộ', timeOfDay: '06:30', miniGameType: 'MATH', difficulty: 'EASY', status: 'DISMISSED', snoozeCount: 2, attempts: 1 }
  ]
}
