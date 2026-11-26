import cron from 'node-cron'
import { runStreakRiskJob, runStreakDailyResetJob } from './streakJobs.js'
import { runDuoDailyJob } from './duoJobs.js'
import { runChallengeCompletionJob } from './challengeJobs.js'

let scheduledTasks = []

const safeRun = async (fn) => {
  try {
    await fn()
  } catch {
    // Giữ tiến trình cron ổn định nếu 1 lượt chạy gặp lỗi tạm thời
  }
}

export const startScheduledJobs = () => {
  // Không tự bật cron khi đang chạy test để tránh treo tiến trình Jest/Vitest
  if (process.env.NODE_ENV === 'test') {
    return []
  }

  if (scheduledTasks.length > 0) {
    return scheduledTasks
  }

  const timezone = process.env.CRON_TIMEZONE || 'Asia/Ho_Chi_Minh'

  scheduledTasks = [
    // 20:00 mỗi tối: nhắc nhở nguy cơ mất chuỗi
    cron.schedule('0 20 * * *', () => safeRun(runStreakRiskJob), { timezone }),

    // 00:05 mỗi sáng: chốt chuỗi cuối ngày & tiêu thụ Streak Freeze
    cron.schedule('5 0 * * *', () => safeRun(runStreakDailyResetJob), { timezone }),

    // 00:10 mỗi sáng: đánh giá Duo cuối ngày & hủy lời mời quá hạn
    cron.schedule('10 0 * * *', () => safeRun(runDuoDailyJob), { timezone }),

    // Mỗi 5 phút: kích hoạt Challenge đến hạn & chốt BXH + trao thưởng idempotent
    cron.schedule('*/5 * * * *', () => safeRun(runChallengeCompletionJob), { timezone })
  ]

  return scheduledTasks
}

export const stopScheduledJobs = () => {
  for (const task of scheduledTasks) {
    task.stop()
  }
  scheduledTasks = []
}

export {
  runStreakRiskJob,
  runStreakDailyResetJob,
  runDuoDailyJob,
  runChallengeCompletionJob
}
