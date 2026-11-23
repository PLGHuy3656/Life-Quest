import { todayRepository } from "./todayRepository.js";
import streaksService from "../streaks/streaksService.js";
import eventBus from "../../common/events/eventBus.js";
import { EVENT_TYPES } from "../../common/events/eventTypes.js";
import ApiError from "../../common/errors/ApiError.js";

// Lấy toàn bộ dữ liệu Today cho người dùng
const getToday = async (userId, queryDate) => {
  // 1. Lấy timezone của user
  const settings = await todayRepository.getUserSettings(userId);
  const timezone = settings?.timezone || 'UTC';

  // 2. Xác định ngày mục tiêu theo định dạng YYYY-MM-DD
  let targetDateStr;
  if (queryDate) {
    targetDateStr = queryDate;
  } else {
    try {
      targetDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());
    } catch {
      targetDateStr = new Date().toISOString().slice(0, 10);
    }
  }
  const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`);
  const targetDayOfWeek = new Date(`${targetDateStr}T12:00:00.000Z`).getUTCDay();
  const targetDayOfMonth = new Date(`${targetDateStr}T12:00:00.000Z`).getUTCDate();

  // 3. Lấy song song dữ liệu Execution, Schedules và Gamification
  const [executions, activeSchedules, gamification] = await Promise.all([todayRepository.getExecutionsByDateRange(userId, startOfDay, endOfDay), todayRepository.getActiveSchedulesForUser(userId), todayRepository.getUserGamification(userId)]);

  // 4. Lọc các schedule áp dụng cho ngày truy vấn
  const matchingSchedules = activeSchedules.filter(schedule => {
    const scheduleStart = new Date(schedule.startAt);
    const scheduleEnd = schedule.endAt ? new Date(schedule.endAt) : null;

    // Kiểm tra phạm vi hiệu lực của schedule
    if (scheduleStart > endOfDay) return false;
    if (scheduleEnd && scheduleEnd < startOfDay) return false;
    if (schedule.scheduleType === 'ONE_TIME') {
      return scheduleStart.toISOString().slice(0, 10) === targetDateStr;
    }
    if (schedule.scheduleType === 'RECURRING') {
      const rule = schedule.recurrenceRule || {};
      const frequency = rule.frequency;
      if (frequency === 'DAILY') {
        return true;
      }
      if (frequency === 'WEEKLY') {
        const days = Array.isArray(rule.daysOfWeek) ? rule.daysOfWeek : [];
        return days.includes(targetDayOfWeek);
      }
      if (frequency === 'MONTHLY') {
        return scheduleStart.getUTCDate() === targetDayOfMonth;
      }
    }
    return false;
  }).map(s => ({
    id: s.id,
    questId: s.questId,
    scheduleType: s.scheduleType,
    timeOfDay: s.recurrenceRule?.timeOfDay || s.startAt.toISOString().slice(11, 16),
    quest: s.quest
  }));

  // 5. Tính toán các chỉ số thống kê tổng hợp (Summary)
  const completedTasks = executions.filter(e => e.status === 'COMPLETED').length;
  const totalTasks = Math.max(executions.length, matchingSchedules.length);
  const completionRatePercentage = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
  const totalFocusDurationSeconds = executions.reduce((sum, e) => sum + (e.durationSeconds || 0), 0);

  // 6. Định dạng gamification
  const formattedGamification = {
    totalXp: gamification ? Number(gamification.totalXp) : 0,
    level: gamification ? gamification.level : 1,
    coinBalance: gamification ? Number(gamification.coinBalance) : 0
  };

  // 7. Định dạng streak từ UserStreak thật sự
  let currentCount = 0;
  let longestCount = 0;
  let lastQualifiedDate = completedTasks > 0 ? targetDateStr : null;
  try {
    const userStreak = await streaksService.getMyStreak(userId);
    if (userStreak) {
      currentCount = userStreak.currentStreak || 0;
      longestCount = userStreak.longestStreak || 0;
      if (userStreak.lastCompletedDate) {
        lastQualifiedDate = new Date(userStreak.lastCompletedDate).toISOString().slice(0, 10);
      }
    }
  } catch {
    // Giữ fallback an toàn nếu chưa lấy được streak
  }
  const streak = {
    currentCount,
    longestCount,
    isQualifiedToday: completedTasks > 0,
    lastQualifiedDate
  };
  return {
    date: targetDateStr,
    timezone,
    summary: {
      totalTasks,
      completedTasks,
      completionRatePercentage,
      totalFocusDurationSeconds
    },
    executions,
    schedules: matchingSchedules,
    streak,
    gamification: formattedGamification
  };
};

// Hoàn thành 1 execution và phát event QUEST_COMPLETED
const completeExecution = async (userId, executionId) => {
  const execution = await todayRepository.findExecutionById(executionId);
  if (!execution) {
    throw new ApiError(404, 'Quest execution not found', 'EXECUTION_NOT_FOUND');
  }
  if (execution.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to complete this execution', 'FORBIDDEN');
  }
  if (execution.status === 'COMPLETED') {
    return execution;
  }
  const completedAt = new Date();
  const updatedExecution = await todayRepository.completeQuestExecution(executionId, completedAt);

  // Phát event QUEST_COMPLETED với try/catch an toàn
  try {
    eventBus.emit(EVENT_TYPES.QUEST_COMPLETED, {
      userId,
      executionId: updatedExecution.id,
      questId: updatedExecution.questId,
      completedAt
    });
  } catch (eventErr) {
    console.error('[TodayService] Failed to emit QUEST_COMPLETED event:', eventErr);
  }
  return updatedExecution;
};
export const todayService = {
  getToday,
  completeExecution
};