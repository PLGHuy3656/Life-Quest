import { eventBus } from './eventBus.js'
import { EVENT_TYPES } from './eventTypes.js'
import { notificationsService } from '../../modules/notifications/notificationsService.js'

let isRegistered = false

const safeNotify = async (userId, payload) => {
  try {
    await notificationsService.notifyUser(userId, payload)
  } catch {
    // Không làm gián đoạn luồng chính nếu tạo thông báo thất bại
  }
}

export const registerNotificationListeners = () => {
  if (isRegistered) return
  isRegistered = true

  // 1. Lời mời kết bạn
  eventBus.on(EVENT_TYPES.FRIEND_REQUEST_SENT, async ({ requesterId, receiverId, friendshipId }) => {
    await safeNotify(receiverId, {
      type: EVENT_TYPES.FRIEND_REQUEST_SENT,
      title: 'Lời mời kết bạn mới',
      body: 'Bạn vừa nhận được một lời mời kết bạn mới.',
      data: { requesterId, friendshipId }
    })
  })

  // 2. Chấp nhận lời mời kết bạn
  eventBus.on(EVENT_TYPES.FRIEND_REQUEST_ACCEPTED, async ({ requesterId, receiverId, friendshipId }) => {
    await safeNotify(requesterId, {
      type: EVENT_TYPES.FRIEND_REQUEST_ACCEPTED,
      title: 'Lời mời kết bạn được chấp nhận',
      body: 'Lời mời kết bạn của bạn đã được chấp nhận!',
      data: { receiverId, friendshipId }
    })
  })

  // 3. Poke nhắc nhở
  eventBus.on(EVENT_TYPES.POKE_SENT, async ({ senderId, receiverId, pokeId }) => {
    await safeNotify(receiverId, {
      type: EVENT_TYPES.POKE_SENT,
      title: 'Bạn bè vừa chọc (Poke) bạn!',
      body: 'Một người bạn đang nhắc bạn hoàn thành nhiệm vụ hôm nay đấy!',
      data: { senderId, pokeId }
    })
  })

  // 4. Reaction bài viết
  eventBus.on(EVENT_TYPES.POST_REACTED, async ({ postId, postOwnerId, actorId, reactionType }) => {
    if (!postOwnerId || postOwnerId === actorId) return
    await safeNotify(postOwnerId, {
      type: EVENT_TYPES.POST_REACTED,
      title: 'Tương tác mới trên bài viết',
      body: `Ai đó vừa thả cảm xúc ${reactionType} vào bài viết của bạn.`,
      data: { postId, actorId, reactionType }
    })
  })

  // 5. Bình luận bài viết
  eventBus.on(EVENT_TYPES.POST_COMMENTED, async ({ postId, postOwnerId, actorId, commentId }) => {
    if (!postOwnerId || postOwnerId === actorId) return
    await safeNotify(postOwnerId, {
      type: EVENT_TYPES.POST_COMMENTED,
      title: 'Bình luận mới',
      body: 'Có người vừa bình luận vào bài viết của bạn.',
      data: { postId, actorId, commentId }
    })
  })

  // 6. Lời mời Duo
  eventBus.on(EVENT_TYPES.DUO_INVITED, async ({ duoId, inviterId, partnerId }) => {
    await safeNotify(partnerId, {
      type: EVENT_TYPES.DUO_INVITED,
      title: 'Lời mời đồng hành Duo',
      body: 'Bạn vừa được mời tham gia một cặp đôi đồng hành (Duo)!',
      data: { duoId, inviterId }
    })
  })

  // 7. Chấp nhận lời mời Duo
  eventBus.on(EVENT_TYPES.DUO_ACCEPTED, async ({ duoId, creatorId, partnerId }) => {
    if (!creatorId || creatorId === partnerId) return
    await safeNotify(creatorId, {
      type: EVENT_TYPES.DUO_ACCEPTED,
      title: 'Lời mời Duo đã được chấp nhận',
      body: 'Đối tác đã chấp nhận lời mời Duo! Cùng nhau giữ chuỗi nhé.',
      data: { duoId, partnerId }
    })
  })

  // 8. Mất chuỗi Duo
  eventBus.on(EVENT_TYPES.DUO_STREAK_LOST, async ({ duoId, userId, previousStreak }) => {
    await safeNotify(userId, {
      type: EVENT_TYPES.DUO_STREAK_LOST,
      title: 'Chuỗi Duo đã bị gián đoạn',
      body: `Chuỗi đồng hành ${previousStreak} ngày của Duo vừa bị đặt lại về 0.`,
      data: { duoId, previousStreak }
    })
  })

  // 9. Đạt mốc Streak
  eventBus.on(EVENT_TYPES.STREAK_MILESTONE, async ({ userId, streakId, ruleId, currentCount }) => {
    await safeNotify(userId, {
      type: EVENT_TYPES.STREAK_MILESTONE,
      title: `Chúc mừng đạt mốc ${currentCount} ngày liên tiếp!`,
      body: `Tuyệt vời! Bạn đã duy trì chuỗi ${currentCount} ngày liên tục.`,
      data: { streakId, ruleId, currentCount }
    })
  })

  // 10. Nguy cơ mất chuỗi buổi tối
  eventBus.on(EVENT_TYPES.STREAK_AT_RISK, async ({ userId, streakId, ruleId, currentCount, dedupeSince }) => {
    await safeNotify(userId, {
      type: EVENT_TYPES.STREAK_AT_RISK,
      title: 'Chuỗi của bạn đang có nguy cơ bị đứt!',
      body: `Hoàn thành nhiệm vụ ngay hôm nay để bảo vệ chuỗi ${currentCount} ngày của bạn.`,
      data: { streakId, ruleId, currentCount },
      dedupeSince
    })
  })

  // 11. Tự động tiêu thụ Streak Freeze
  eventBus.on(EVENT_TYPES.STREAK_FROZEN, async ({ userId, streakId, ruleId, currentCount }) => {
    await safeNotify(userId, {
      type: EVENT_TYPES.STREAK_FROZEN,
      title: 'Đã kích hoạt Streak Freeze!',
      body: `Hệ thống đã tự động dùng 1 Streak Freeze để bảo vệ chuỗi ${currentCount} ngày của bạn.`,
      data: { streakId, ruleId, currentCount }
    })
  })

  // 12. Mất chuỗi cuối ngày
  eventBus.on(EVENT_TYPES.STREAK_LOST, async ({ userId, streakId, ruleId, previousCount }) => {
    await safeNotify(userId, {
      type: EVENT_TYPES.STREAK_LOST,
      title: 'Chuỗi ngày liên tiếp đã kết thúc',
      body: `Chuỗi ${previousCount} ngày của bạn vừa bị đặt lại về 0. Hãy bắt đầu lại hôm nay nhé!`,
      data: { streakId, ruleId, previousCount }
    })
  })

  // 13. Lời mời Challenge
  eventBus.on(EVENT_TYPES.CHALLENGE_INVITED, async ({ challengeId, challengeName, inviterId, targetUserId }) => {
    await safeNotify(targetUserId, {
      type: EVENT_TYPES.CHALLENGE_INVITED,
      title: 'Lời mời tham gia Thử thách',
      body: `Bạn vừa được mời tham gia thử thách "${challengeName}".`,
      data: { challengeId, inviterId }
    })
  })

  // 14. Hoàn thành Challenge & nhận thưởng
  eventBus.on(EVENT_TYPES.CHALLENGE_COMPLETED, async ({ challengeId, challengeName, userId, rank, rewardXp, rewardCoin }) => {
    await safeNotify(userId, {
      type: EVENT_TYPES.CHALLENGE_COMPLETED,
      title: `Hoàn thành thử thách "${challengeName}"!`,
      body: `Bạn đạt hạng #${rank} và nhận được ${rewardXp} XP, ${rewardCoin} Coin.`,
      data: { challengeId, rank, rewardXp, rewardCoin }
    })
  })
}

export default registerNotificationListeners
