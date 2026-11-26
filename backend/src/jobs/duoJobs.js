import prisma from '../config/database.js'
import { EVENT_TYPES } from '../common/events/eventTypes.js'
import { notificationsService } from '../modules/notifications/notificationsService.js'

const getUtcDayStart = (date) => {
  const d = new Date(date)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0))
}

// Kiểm tra 1 thành viên đã đạt điều kiện trong ngày hôm qua chưa
const didMemberQualifyOnDay = async (userId, ruleId, dayStart, dayEnd) => {
  if (ruleId) {
    const streak = await prisma.streak.findUnique({
      where: {
        userId_ruleId: {
          userId,
          ruleId
        }
      },
      select: { lastQualifiedDate: true }
    })

    if (streak?.lastQualifiedDate && new Date(streak.lastQualifiedDate) >= dayStart) {
      return true
    }
  }

  const completedExecution = await prisma.questExecution.findFirst({
    where: {
      userId,
      status: 'COMPLETED',
      completedAt: {
        gte: dayStart,
        lt: dayEnd
      }
    },
    select: { id: true }
  })

  return Boolean(completedExecution)
}

// Job 3: Đánh giá Duo cuối ngày & hủy lời mời Duo quá hạn
export const runDuoDailyJob = async (now = new Date(), inviteExpiryHours = 48) => {
  const expiryCutoff = new Date(now.getTime() - inviteExpiryHours * 60 * 60 * 1000)

  // A. Hủy các lời mời Duo PENDING quá hạn
  const expiredDuos = await prisma.duo.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lte: expiryCutoff }
    },
    select: { id: true }
  })

  let expiredInvitesCancelled = 0
  for (const duo of expiredDuos) {
    await prisma.$transaction(async (tx) => {
      await tx.duoMember.updateMany({
        where: {
          duoId: duo.id,
          status: 'INVITED'
        },
        data: { status: 'DECLINED' }
      })

      await tx.duo.update({
        where: { id: duo.id },
        data: { status: 'DISBANDED' }
      })
    })
    expiredInvitesCancelled += 1
  }

  // B. Đánh giá các Duo đang ACTIVE cho ngày hôm qua
  const todayStart = getUtcDayStart(now)
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000)

  const activeDuos = await prisma.duo.findMany({
    where: { status: 'ACTIVE' },
    include: {
      members: {
        where: { status: 'ACCEPTED' },
        select: { userId: true }
      }
    }
  })

  let streaksIncremented = 0
  let streaksReset = 0

  for (const duo of activeDuos) {
    if (duo.members.length < 2) continue

    const qualificationResults = await Promise.all(
      duo.members.map((m) => didMemberQualifyOnDay(m.userId, duo.ruleId, yesterdayStart, todayStart))
    )

    const allQualified = qualificationResults.every(Boolean)

    if (allQualified) {
      const nextStreak = duo.currentStreak + 1
      await prisma.duo.update({
        where: { id: duo.id },
        data: {
          currentStreak: nextStreak,
          longestStreak: Math.max(duo.longestStreak, nextStreak)
        }
      })
      streaksIncremented += 1
    } else if (duo.currentStreak > 0) {
      const previousStreak = duo.currentStreak
      await prisma.duo.update({
        where: { id: duo.id },
        data: { currentStreak: 0 }
      })
      streaksReset += 1

      for (const member of duo.members) {
        await notificationsService.notifyUser(member.userId, {
          type: EVENT_TYPES.DUO_STREAK_LOST,
          title: 'Chuỗi Duo đã bị gián đoạn',
          body: `Chuỗi đồng hành ${previousStreak} ngày của Duo vừa bị đặt lại về 0.`,
          data: {
            duoId: duo.id,
            previousStreak
          }
        })
      }
    }
  }

  return {
    expiredInvitesCancelled,
    activeEvaluated: activeDuos.length,
    streaksIncremented,
    streaksReset
  }
}
