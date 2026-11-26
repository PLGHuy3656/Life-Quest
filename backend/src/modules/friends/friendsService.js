import { friendsRepository } from './friendsRepository.js'
import ApiError from '../../common/errors/ApiError.js'
import { eventBus } from '../../common/events/eventBus.js'
import { EVENT_TYPES } from '../../common/events/eventTypes.js'

// Lấy danh sách bạn bè chính thức
const getFriends = async (userId) => {
  const friendships = await friendsRepository.findFriends(userId)

  return friendships.map((f) => {
    const friend = f.requesterId === userId ? f.receiver : f.requester
    return {
      friendshipId: f.id,
      friendId: friend.id,
      username: friend.username,
      profile: friend.profile,
      level: friend.gamification?.level || 1,
      totalXp: friend.gamification?.totalXp ? Number(friend.gamification.totalXp) : 0,
      since: f.acceptedAt
    }
  })
}

// Tìm kiếm người dùng
const searchFriends = async (queryText, currentUserId) => {
  return await friendsRepository.searchUsers(queryText, currentUserId)
}

// Lấy danh sách lời mời kết bạn
const getFriendRequests = async (userId, type) => {
  return await friendsRepository.findFriendRequests(userId, type)
}

// Gửi lời mời kết bạn
const sendFriendRequest = async (requesterId, receiverId) => {
  if (requesterId === receiverId) {
    throw new ApiError(400, 'Cannot send friend request to yourself', 'SELF_REQUEST_NOT_ALLOWED')
  }

  const existing = await friendsRepository.findRelationshipBetween(requesterId, receiverId)
  if (existing) {
    if (existing.status === 'ACCEPTED') {
      throw new ApiError(400, 'You are already friends with this user', 'ALREADY_FRIENDS')
    }
    if (existing.status === 'PENDING') {
      throw new ApiError(400, 'A pending friend request already exists', 'REQUEST_ALREADY_PENDING')
    }
    if (existing.status === 'BLOCKED') {
      throw new ApiError(403, 'Cannot interact with this user', 'BLOCKED_RELATIONSHIP')
    }

    // Nếu trước đó là DECLINED, cho phép gửi lại lời mời
    const resent = await friendsRepository.updateFriendship(existing.id, {
      requesterId,
      receiverId,
      status: 'PENDING',
      createdAt: new Date(),
      acceptedAt: null,
      blockedAt: null
    })
    try {
      eventBus.emit(EVENT_TYPES.FRIEND_REQUEST_SENT, {
        requesterId,
        receiverId,
        friendshipId: resent.id
      })
    } catch { /* ignore */ }
    return resent
  }

  const created = await friendsRepository.createFriendship(requesterId, receiverId)
  try {
    eventBus.emit(EVENT_TYPES.FRIEND_REQUEST_SENT, {
      requesterId,
      receiverId,
      friendshipId: created.id
    })
  } catch { /* ignore */ }
  return created
}

// Chấp nhận lời mời kết bạn
const acceptFriendRequest = async (userId, requestId) => {
  const request = await friendsRepository.findFriendshipById(requestId)
  if (!request || request.receiverId !== userId || request.status !== 'PENDING') {
    throw new ApiError(404, 'Friend request not found or already processed', 'REQUEST_NOT_FOUND')
  }

  const updated = await friendsRepository.updateFriendship(requestId, {
    status: 'ACCEPTED',
    acceptedAt: new Date()
  })
  try {
    eventBus.emit(EVENT_TYPES.FRIEND_REQUEST_ACCEPTED, {
      requesterId: request.requesterId,
      receiverId: userId,
      friendshipId: updated.id
    })
  } catch { /* ignore */ }
  return updated
}

// Từ chối lời mời kết bạn
const rejectFriendRequest = async (userId, requestId) => {
  const request = await friendsRepository.findFriendshipById(requestId)
  if (!request || request.receiverId !== userId || request.status !== 'PENDING') {
    throw new ApiError(404, 'Friend request not found or already processed', 'REQUEST_NOT_FOUND')
  }

  return await friendsRepository.updateFriendship(requestId, {
    status: 'DECLINED'
  })
}

// Hủy quan hệ bạn bè
const removeFriend = async (userId, friendId) => {
  const existing = await friendsRepository.findRelationshipBetween(userId, friendId)
  if (!existing || existing.status !== 'ACCEPTED') {
    throw new ApiError(404, 'Friendship not found', 'FRIENDSHIP_NOT_FOUND')
  }

  await friendsRepository.deleteFriendship(existing.id)
  return { success: true, message: 'Friend removed successfully' }
}

// Chặn người dùng
const blockUser = async (userId, targetUserId) => {
  if (userId === targetUserId) {
    throw new ApiError(400, 'Cannot block yourself', 'CANNOT_BLOCK_SELF')
  }

  const existing = await friendsRepository.findRelationshipBetween(userId, targetUserId)
  if (existing) {
    return await friendsRepository.updateFriendship(existing.id, {
      status: 'BLOCKED',
      blockedAt: new Date()
    })
  }

  return await friendsRepository.createFriendship(userId, targetUserId)
}

// Gửi Poke thúc đẩy bạn bè
const sendPoke = async (senderId, receiverId) => {
  if (senderId === receiverId) {
    throw new ApiError(400, 'Cannot poke yourself', 'CANNOT_POKE_SELF')
  }

  // Phải là bạn bè mới được Poke
  const friendship = await friendsRepository.findRelationshipBetween(senderId, receiverId)
  if (!friendship || friendship.status !== 'ACCEPTED') {
    throw new ApiError(403, 'You can only poke your accepted friends', 'NOT_FRIENDS')
  }

  // Kiểm tra Cooldown 1 giờ giữa 2 lần Poke
  const lastPoke = await friendsRepository.findLastPoke(senderId, receiverId)
  if (lastPoke) {
    const elapsedMinutes = (Date.now() - new Date(lastPoke.createdAt).getTime()) / (1000 * 60)
    if (elapsedMinutes < 60) {
      throw new ApiError(
        429,
        `Poke cooldown in effect. Please wait ${Math.ceil(60 - elapsedMinutes)} more minutes`,
        'POKE_COOLDOWN'
      )
    }
  }

  const poke = await friendsRepository.createPoke(senderId, receiverId)
  try {
    eventBus.emit(EVENT_TYPES.POKE_SENT, {
      senderId,
      receiverId,
      pokeId: poke.id
    })
  } catch { /* ignore */ }
  return poke
}

export const friendsService = {
  getFriends,
  searchFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  blockUser,
  sendPoke
}
