import prisma from '../config/database.js'
import { EVENT_TYPES } from '../common/events/eventTypes.js'
import { notificationsService } from '../modules/notifications/notificationsService.js'

const parseRewardConfig = (rewardConfig) => {
  if (!rewardConfig || typeof rewardConfig !== 'object') {
    return { rewardXp: 0, rewardCoin: 0 }
  }

  const rawXp = rewardConfig.xp ?? rewardConfig.rewardXp ?? 0
  const rawCoin = rewardConfig.coin ?? rewardConfig.rewardCoin ?? 0

  return {
    rewardXp: Math.max(0, Number(rawXp) || 0),
    rewardCoin: Math.max(0, Number(rawCoin) || 0)
  }
}

// Job 4: Kích hoạt Challenge đến giờ bắt đầu & chốt bảng xếp hạng + trao thưởng idempotent khi now >= endAt
export const runChallengeCompletionJob = async (now = new Date()) => {
  // 1. Chuyển Challenge UPCOMING đã đến startAt sang ACTIVE
  const activated = await prisma.challenge.updateMany({
    where: {
      status: 'UPCOMING',
      startAt: { lte: now },
      endAt: { gt: now }
    },
    data: { status: 'ACTIVE' }
  })

  // 2. Tìm các Challenge ACTIVE đã chạm mốc kết thúc (endAt <= now)
  const endedChallenges = await prisma.challenge.findMany({
    where: {
      status: 'ACTIVE',
      endAt: { lte: now }
    },
    select: {
      id: true,
      name: true,
      rewardConfig: true
    }
  })

  let completedChallenges = 0
  let rewardedMembers = 0

  for (const challenge of endedChallenges) {
    const { rewardXp, rewardCoin } = parseRewardConfig(challenge.rewardConfig)

    const rankedNotifications = await prisma.$transaction(async (tx) => {
      // Khóa trạng thái ACTIVE -> COMPLETED để chống chạy đè đồng thời
      const lock = await tx.challenge.updateMany({
        where: {
          id: challenge.id,
          status: 'ACTIVE'
        },
        data: { status: 'COMPLETED' }
      })

      if (lock.count === 0) {
        return null
      }

      // Lấy danh sách thành viên ACCEPTED xếp hạng theo progress DESC, joinedAt ASC
      const members = await tx.challengeMember.findMany({
        where: {
          challengeId: challenge.id,
          status: 'ACCEPTED'
        },
        orderBy: [
          { progress: 'desc' },
          { joinedAt: 'asc' }
        ]
      })

      const notificationsToSend = []

      for (let i = 0; i < members.length; i++) {
        const member = members[i]
        const rank = i + 1

        await tx.challengeMember.update({
          where: { id: member.id },
          data: {
            rank,
            finalScore: member.progress,
            status: 'COMPLETED'
          }
        })

        let grantedXp = 0
        let grantedCoin = 0

        if (rewardXp > 0) {
          const xpKey = `challenge_reward:${challenge.id}:${member.userId}:xp`
          const existingXpTx = await tx.xpTransaction.findUnique({
            where: { idempotencyKey: xpKey },
            select: { id: true }
          })

          if (!existingXpTx) {
            await tx.xpTransaction.create({
              data: {
                userId: member.userId,
                amount: rewardXp,
                sourceType: 'CHALLENGE',
                sourceId: challenge.id,
                idempotencyKey: xpKey,
                description: `Reward XP for completing challenge "${challenge.name}" (Rank #${rank})`
              }
            })
            grantedXp = rewardXp
          }
        }

        if (rewardCoin > 0) {
          const coinKey = `challenge_reward:${challenge.id}:${member.userId}:coin`
          const existingCoinTx = await tx.coinTransaction.findUnique({
            where: { idempotencyKey: coinKey },
            select: { id: true }
          })

          if (!existingCoinTx) {
            await tx.coinTransaction.create({
              data: {
                userId: member.userId,
                amount: BigInt(rewardCoin),
                transactionType: 'EARNED',
                sourceType: 'CHALLENGE',
                sourceId: challenge.id,
                idempotencyKey: coinKey,
                description: `Reward Coin for completing challenge "${challenge.name}" (Rank #${rank})`
              }
            })
            grantedCoin = rewardCoin
          }
        }

        if (grantedXp > 0 || grantedCoin > 0) {
          await tx.userGamification.upsert({
            where: { userId: member.userId },
            update: {
              totalXp: { increment: BigInt(grantedXp) },
              coinBalance: { increment: BigInt(grantedCoin) }
            },
            create: {
              userId: member.userId,
              level: 1,
              totalXp: BigInt(grantedXp),
              coinBalance: BigInt(grantedCoin)
            }
          })
          rewardedMembers += 1
        }

        notificationsToSend.push({
          userId: member.userId,
          rank,
          rewardXp: grantedXp,
          rewardCoin: grantedCoin
        })
      }

      return notificationsToSend
    })

    if (!rankedNotifications) continue
    completedChallenges += 1

    for (const item of rankedNotifications) {
      await notificationsService.notifyUser(item.userId, {
        type: EVENT_TYPES.CHALLENGE_COMPLETED,
        title: `Hoàn thành thử thách "${challenge.name}"!`,
        body: `Bạn đạt hạng #${item.rank} và nhận được ${item.rewardXp} XP, ${item.rewardCoin} Coin.`,
        data: {
          challengeId: challenge.id,
          rank: item.rank,
          rewardXp: item.rewardXp,
          rewardCoin: item.rewardCoin
        }
      })
    }
  }

  return {
    activatedChallenges: activated.count,
    completedChallenges,
    rewardedMembers
  }
}
