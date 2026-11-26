import prisma from '../config/database.js'
import { EVENT_TYPES } from '../common/events/eventTypes.js'
import { notificationsService } from '../modules/notifications/notificationsService.js'

const getUtcDayStart = (date) => {
  const d = new Date(date)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0))
}

// Job 1: Nhắc nhở buổi tối khi chuỗi streak đang có nguy cơ bị đứt
export const runStreakRiskJob = async (now = new Date()) => {
  const todayStart = getUtcDayStart(now)

  const atRiskStreaks = await prisma.streak.findMany({
    where: {
      currentCount: { gt: 0 },
      rule: { isActive: true },
      OR: [
        { lastQualifiedDate: null },
        { lastQualifiedDate: { lt: todayStart } }
      ]
    },
    select: {
      id: true,
      userId: true,
      ruleId: true,
      currentCount: true
    }
  })

  let notifiedCount = 0
  for (const streak of atRiskStreaks) {
    const created = await notificationsService.notifyUser(streak.userId, {
      type: EVENT_TYPES.STREAK_AT_RISK,
      title: 'Chuỗi của bạn đang có nguy cơ bị đứt!',
      body: `Hoàn thành nhiệm vụ ngay hôm nay để bảo vệ chuỗi ${streak.currentCount} ngày của bạn.`,
      data: {
        streakId: streak.id,
        ruleId: streak.ruleId,
        currentCount: streak.currentCount
      },
      dedupeSince: todayStart
    })
    if (created) {
      notifiedCount += 1
    }
  }

  return {
    checked: atRiskStreaks.length,
    notifiedCount
  }
}

// Job 2: Chốt chuỗi cuối ngày (00:05) & tự động tiêu thụ Streak Freeze nếu có
export const runStreakDailyResetJob = async (now = new Date()) => {
  const todayStart = getUtcDayStart(now)
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000)

  const missedStreaks = await prisma.streak.findMany({
    where: {
      currentCount: { gt: 0 },
      rule: { isActive: true },
      OR: [
        { lastQualifiedDate: null },
        { lastQualifiedDate: { lt: yesterdayStart } }
      ]
    },
    select: {
      id: true,
      userId: true,
      ruleId: true,
      currentCount: true
    }
  })

  let frozenCount = 0
  let resetCount = 0

  for (const streak of missedStreaks) {
    const outcome = await prisma.$transaction(async (tx) => {
      // Tìm vật phẩm STREAK_FREEZE còn số lượng trong UserInventory
      const freezeItem = await tx.userInventory.findFirst({
        where: {
          userId: streak.userId,
          quantity: { gt: 0 },
          rewardItem: {
            isActive: true,
            OR: [
              { code: 'STREAK_FREEZE' },
              { category: 'STREAK_FREEZE' }
            ]
          }
        },
        orderBy: { purchasedAt: 'asc' }
      })

      if (freezeItem) {
        const consumed = await tx.userInventory.updateMany({
          where: {
            id: freezeItem.id,
            quantity: { gt: 0 }
          },
          data: {
            quantity: { decrement: 1 }
          }
        })

        if (consumed.count > 0) {
          await tx.streak.update({
            where: { id: streak.id },
            data: { lastQualifiedDate: yesterdayStart }
          })
          return { action: 'FROZEN' }
        }
      }

      // Không có Streak Freeze -> đặt lại chuỗi về 0
      await tx.streak.update({
        where: { id: streak.id },
        data: { currentCount: 0 }
      })
      return { action: 'RESET' }
    })

    if (outcome.action === 'FROZEN') {
      frozenCount += 1
      await notificationsService.notifyUser(streak.userId, {
        type: EVENT_TYPES.STREAK_FROZEN,
        title: 'Đã kích hoạt Streak Freeze!',
        body: `Hệ thống đã tự động dùng 1 Streak Freeze để bảo vệ chuỗi ${streak.currentCount} ngày của bạn.`,
        data: {
          streakId: streak.id,
          ruleId: streak.ruleId,
          currentCount: streak.currentCount
        }
      })
    } else {
      resetCount += 1
      await notificationsService.notifyUser(streak.userId, {
        type: EVENT_TYPES.STREAK_LOST,
        title: 'Chuỗi ngày liên tiếp đã kết thúc',
        body: `Chuỗi ${streak.currentCount} ngày của bạn vừa bị đặt lại về 0. Hãy bắt đầu lại hôm nay nhé!`,
        data: {
          streakId: streak.id,
          ruleId: streak.ruleId,
          previousCount: streak.currentCount
        }
      })
    }
  }

  return {
    checked: missedStreaks.length,
    frozenCount,
    resetCount
  }
}
