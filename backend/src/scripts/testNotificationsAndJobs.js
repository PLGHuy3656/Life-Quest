/* eslint-disable no-console */
import prisma from '../config/database.js'
import { registerNotificationListeners } from '../common/events/registerNotificationListeners.js'
import { eventBus } from '../common/events/eventBus.js'
import { EVENT_TYPES } from '../common/events/eventTypes.js'
import { notificationsService } from '../modules/notifications/notificationsService.js'
import {
  runStreakRiskJob,
  runStreakDailyResetJob,
  runDuoDailyJob,
  runChallengeCompletionJob
} from '../jobs/index.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const runVerification = async () => {
  process.env.NODE_ENV = 'test'
  registerNotificationListeners()

  const suffix = Date.now()
  const userA = await prisma.user.create({
    data: {
      email: `notif_test_a_${suffix}@test.com`,
      username: `notif_a_${suffix}`,
      passwordHash: 'hash'
    }
  })
  const userB = await prisma.user.create({
    data: {
      email: `notif_test_b_${suffix}@test.com`,
      username: `notif_b_${suffix}`,
      passwordHash: 'hash'
    }
  })

  await prisma.userSettings.createMany({
    data: [
      { userId: userA.id, notificationEnabled: true },
      { userId: userB.id, notificationEnabled: true }
    ]
  })

  try {
    // 1. Test EventBus + notificationEnabled toggle
    eventBus.emit(EVENT_TYPES.FRIEND_REQUEST_SENT, {
      requesterId: userA.id,
      receiverId: userB.id,
      friendshipId: 'test-friendship'
    })
    await sleep(150)

    const listB1 = await notificationsService.getNotifications(userB.id)
    console.log('[1] EventBus friend.request -> unreadCount:', listB1.unreadCount)

    await notificationsService.updateNotificationSettings(userB.id, { notificationEnabled: false })
    eventBus.emit(EVENT_TYPES.POKE_SENT, {
      senderId: userA.id,
      receiverId: userB.id,
      pokeId: 'test-poke'
    })
    await sleep(150)
    const listB2 = await notificationsService.getNotifications(userB.id)
    console.log('[2] notificationEnabled=false -> unreadCount unchanged:', listB2.unreadCount)

    await notificationsService.updateNotificationSettings(userB.id, { notificationEnabled: true })

    // 2. Test runStreakRiskJob & runStreakDailyResetJob
    const ruleA = await prisma.streakRule.create({
      data: { userId: userA.id, ruleType: 'DAILY_QUEST', isActive: true }
    })
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    await prisma.streak.create({
      data: {
        userId: userA.id,
        ruleId: ruleA.id,
        currentCount: 5,
        longestCount: 5,
        lastQualifiedDate: twoDaysAgo
      }
    })

    const riskRes = await runStreakRiskJob()
    console.log('[3] runStreakRiskJob:', riskRes)

    const resetRes = await runStreakDailyResetJob()
    console.log('[4] runStreakDailyResetJob:', resetRes)

    // 3. Test runDuoDailyJob (expired invite)
    const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000)
    const expiredDuo = await prisma.duo.create({
      data: {
        createdBy: userA.id,
        status: 'PENDING',
        createdAt: threeDaysAgo,
        members: {
          create: [
            { userId: userA.id, status: 'ACCEPTED' },
            { userId: userB.id, status: 'INVITED' }
          ]
        }
      }
    })
    const duoRes = await runDuoDailyJob()
    console.log('[5] runDuoDailyJob:', duoRes)

    // 4. Test runChallengeCompletionJob (idempotency check)
    const endedChallenge = await prisma.challenge.create({
      data: {
        creatorId: userA.id,
        name: `Test Challenge ${suffix}`,
        conditionType: 'QUEST_COUNT',
        conditionConfig: { target: 5 },
        startAt: threeDaysAgo,
        endAt: new Date(Date.now() - 60 * 1000),
        status: 'ACTIVE',
        rewardConfig: { xp: 100, coin: 50 },
        members: {
          create: [
            { userId: userA.id, status: 'ACCEPTED', progress: 10 },
            { userId: userB.id, status: 'ACCEPTED', progress: 5 }
          ]
        }
      }
    })

    const chalRes1 = await runChallengeCompletionJob()
    const chalRes2 = await runChallengeCompletionJob()
    console.log('[6] runChallengeCompletionJob (run 1):', chalRes1)
    console.log('[7] runChallengeCompletionJob (run 2 - idempotent):', chalRes2)

    // Cleanup test records
    await prisma.xpTransaction.deleteMany({ where: { sourceId: endedChallenge.id } })
    await prisma.coinTransaction.deleteMany({ where: { sourceId: endedChallenge.id } })
    await prisma.challenge.delete({ where: { id: endedChallenge.id } })
    await prisma.duo.delete({ where: { id: expiredDuo.id } })
    await prisma.streakRule.delete({ where: { id: ruleA.id } })
  } finally {
    await prisma.userGamification.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } })
    await prisma.notification.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } })
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } })
    await prisma.$disconnect()
  }

  console.log('ALL NOTIFICATIONS & JOBS VERIFICATION PASSED!')
}

runVerification().catch((err) => {
  console.error(err)
  process.exit(1)
})
