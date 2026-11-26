import prisma from '../../config/database.js'

// Ghi nhận sự kiện hành vi
const createBehaviorEvent = async (userId, data) => {
  return await prisma.behaviorEvent.create({
    data: {
      userId,
      eventType: data.eventType,
      source: data.source || null,
      entityType: data.entityType || null,
      entityId: data.entityId || null,
      metadata: data.metadata || null,
      occurredAt: new Date()
    }
  })
}

// Lấy danh sách sự kiện hành vi
const findBehaviorEvents = async (userId, { eventType, skip = 0, take = 20 } = {}) => {
  const where = { userId }
  if (eventType) {
    where.eventType = eventType
  }

  const [events, total] = await Promise.all([
    prisma.behaviorEvent.findMany({
      where,
      skip,
      take,
      orderBy: { occurredAt: 'desc' }
    }),
    prisma.behaviorEvent.count({ where })
  ])

  return { events, total }
}

// Thống kê tổng quan Overview
const getOverviewMetrics = async (userId) => {
  const [completedExecutions, gamification, streaks, focusSessions] = await Promise.all([
    prisma.questExecution.count({
      where: { userId, status: 'COMPLETED' }
    }),
    prisma.userGamification.findUnique({
      where: { userId }
    }),
    prisma.streak.findMany({
      where: { userId }
    }),
    prisma.focusSession.findMany({
      where: {
        execution: { userId },
        status: 'COMPLETED'
      },
      select: { durationSeconds: true }
    })
  ])

  const totalFocusSeconds = focusSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0)
  const maxStreak = streaks.reduce((max, s) => Math.max(max, s.longestCount || 0), 0)
  const currentMaxStreak = streaks.reduce((max, s) => Math.max(max, s.currentCount || 0), 0)

  return {
    completedQuests: completedExecutions,
    totalFocusMinutes: Math.round(totalFocusSeconds / 60),
    level: gamification?.level || 1,
    totalXp: gamification?.totalXp !== undefined ? Number(gamification.totalXp) : 0,
    coinBalance: gamification?.coinBalance !== undefined ? Number(gamification.coinBalance) : 0,
    currentStreak: currentMaxStreak,
    longestStreak: maxStreak
  }
}

// Thống kê theo tuần (7 ngày gần nhất)
const getWeeklyMetrics = async (userId) => {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const executions = await prisma.questExecution.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      completedAt: { gte: sevenDaysAgo }
    },
    select: { completedAt: true }
  })

  const focusSessions = await prisma.focusSession.findMany({
    where: {
      execution: { userId },
      status: 'COMPLETED',
      completedAt: { gte: sevenDaysAgo }
    },
    select: { completedAt: true, durationSeconds: true }
  })

  // Nhóm theo từng ngày trong 7 ngày
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]

    const completedOnDay = executions.filter(
      (e) => e.completedAt && e.completedAt.toISOString().startsWith(dateStr)
    ).length

    const focusSecondsOnDay = focusSessions
      .filter((s) => s.completedAt && s.completedAt.toISOString().startsWith(dateStr))
      .reduce((sum, s) => sum + (s.durationSeconds || 0), 0)

    days.push({
      date: dateStr,
      completedQuests: completedOnDay,
      focusMinutes: Math.round(focusSecondsOnDay / 60)
    })
  }

  return days
}

// Thống kê nhiệm vụ
const getQuestMetrics = async (userId) => {
  const [totalQuests, completedQuests, priorityGroups] = await Promise.all([
    prisma.quest.count({ where: { userId } }),
    prisma.questExecution.count({ where: { userId, status: 'COMPLETED' } }),
    prisma.quest.groupBy({
      by: ['priority'],
      where: { userId },
      _count: true
    })
  ])

  return {
    totalQuests,
    completedExecutions: completedQuests,
    completionRate: totalQuests > 0 ? Number(((completedQuests / totalQuests) * 100).toFixed(1)) : 0,
    byPriority: priorityGroups.map((p) => ({ priority: p.priority, count: p._count }))
  }
}

// Thống kê phiên tập trung
const getFocusMetrics = async (userId) => {
  const [totalSessions, completedSessions, interruptions] = await Promise.all([
    prisma.focusSession.count({ where: { execution: { userId } } }),
    prisma.focusSession.count({ where: { execution: { userId }, status: 'COMPLETED' } }),
    prisma.focusInterruption.count({
      where: { focusSession: { execution: { userId } } }
    })
  ])

  return {
    totalSessions,
    completedSessions,
    completionRate: totalSessions > 0 ? Number(((completedSessions / totalSessions) * 100).toFixed(1)) : 0,
    totalInterruptions: interruptions
  }
}

// Thống kê chuỗi liên tục
const getStreakMetrics = async (userId) => {
  const streaks = await prisma.streak.findMany({
    where: { userId },
    include: { rule: true }
  })

  return streaks.map((s) => ({
    ruleId: s.ruleId,
    ruleType: s.rule.ruleType,
    frequency: s.rule.frequency,
    currentCount: s.currentCount,
    longestCount: s.longestCount,
    lastQualifiedDate: s.lastQualifiedDate
  }))
}

export const analyticsRepository = {
  createBehaviorEvent,
  findBehaviorEvents,
  getOverviewMetrics,
  getWeeklyMetrics,
  getQuestMetrics,
  getFocusMetrics,
  getStreakMetrics
}
