import { friendsRepository } from './friendsRepository.js'
import { usersRepository } from '../users/usersRepository.js'
import ApiError from '../../common/errors/ApiError.js'
import { eventBus } from '../../common/events/eventBus.js'
import { EVENT_TYPES } from '../../common/events/eventTypes.js'

// Hàm dùng chung cho các service khác (socialService) kiểm tra quan hệ bạn bè
export const areFriends = async (u1, u2) => {
  if (!u1 || !u2 || u1 === u2) return false
  const friendship = await friendsRepository.findFriendshipBetween(u1, u2)
  return !!friendship && friendship.status === 'ACCEPTED'
}

// Hàm dùng chung kiểm tra xem 2 user có bị chặn nhau không
export const isBlocked = async (u1, u2) => {
  if (!u1 || !u2) return false
  const friendship = await friendsRepository.findFriendshipBetween(u1, u2)
  return !!friendship && friendship.status === 'BLOCKED'
}

const getFriends = async (userId) => {
  return await friendsRepository.findAcceptedFriends(userId)
}

const searchFriends = async (currentUserId, query) => {
  const blockedIds = await friendsRepository.findBlockedUserIds(currentUserId)
  return await friendsRepository.searchUsers(query, currentUserId, blockedIds)
}

const getFriendRequests = async (userId) => {
  return await friendsRepository.findPendingFriendRequests(userId)
}

const sendFriendRequest = async (requesterId, receiverId) => {
  if (requesterId === receiverId) {
    throw new ApiError(400, 'Cannot send friend request to yourself', 'CANNOT_FRIEND_SELF')
  }

  const receiver = await usersRepository.findUserById(receiverId)
  if (!receiver || receiver.deletedAt) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
  }

  const existingFriendship = await friendsRepository.findFriendshipBetween(requesterId, receiverId)

  if (existingFriendship) {
    if (existingFriendship.status === 'ACCEPTED') {
      throw new ApiError(409, 'Users are already friends', 'ALREADY_FRIENDS')
    }
    if (existingFriendship.status === 'BLOCKED') {
      throw new ApiError(403, 'Cannot send friend request to blocked user', 'USER_BLOCKED')
    }
    if (existingFriendship.status === 'PENDING') {
      throw new ApiError(409, 'Friend request is already pending', 'FRIEND_REQUEST_PENDING')
    }
    if (existingFriendship.status === 'REJECTED') {
      // Cho phép gửi lại bằng cách cập nhật bản ghi cũ
      const updated = await friendsRepository.updateFriendship(existingFriendship.id, {
        requesterId,
        receiverId,
        status: 'PENDING',
        acceptedAt: null,
        blockedAt: null,
        blockedById: null
      })

      eventBus.emit(EVENT_TYPES.FRIEND_REQUEST_SENT, {
        requesterId,
        receiverId,
        friendshipId: updated.id
      })

      return updated
    }
  }

  const newFriendship = await friendsRepository.createFriendship({
    requesterId,
    receiverId,
    status: 'PENDING'
  })

  eventBus.emit(EVENT_TYPES.FRIEND_REQUEST_SENT, {
    requesterId,
    receiverId,
    friendshipId: newFriendship.id
  })

  return newFriendship
}

const acceptFriendRequest = async (currentUserId, requestId) => {
  const friendship = await friendsRepository.findFriendshipById(requestId)
  if (!friendship) {
    throw new ApiError(404, 'Friend request not found', 'FRIEND_REQUEST_NOT_FOUND')
  }

  if (friendship.receiverId !== currentUserId) {
    throw new ApiError(403, 'Only receiver can accept friend request', 'FORBIDDEN_REQUEST_ACTION')
  }

  if (friendship.status !== 'PENDING') {
    throw new ApiError(400, 'Friend request is not pending', 'INVALID_REQUEST_STATUS')
  }

  return await friendsRepository.updateFriendship(requestId, {
    status: 'ACCEPTED',
    acceptedAt: new Date()
  })
}

const rejectFriendRequest = async (currentUserId, requestId) => {
  const friendship = await friendsRepository.findFriendshipById(requestId)
  if (!friendship) {
    throw new ApiError(404, 'Friend request not found', 'FRIEND_REQUEST_NOT_FOUND')
  }

  if (friendship.receiverId !== currentUserId) {
    throw new ApiError(403, 'Only receiver can reject friend request', 'FORBIDDEN_REQUEST_ACTION')
  }

  if (friendship.status !== 'PENDING') {
    throw new ApiError(400, 'Friend request is not pending', 'INVALID_REQUEST_STATUS')
  }

  return await friendsRepository.updateFriendship(requestId, {
    status: 'REJECTED'
  })
}

const deleteFriend = async (currentUserId, friendId) => {
  const friendship = await friendsRepository.findFriendshipBetween(currentUserId, friendId)
  if (!friendship || friendship.status !== 'ACCEPTED') {
    throw new ApiError(404, 'Friendship not found', 'FRIENDSHIP_NOT_FOUND')
  }

  await friendsRepository.deleteFriendship(friendship.id)
  return { message: 'Friend removed successfully' }
}

const blockUser = async (currentUserId, friendId) => {
  if (currentUserId === friendId) {
    throw new ApiError(400, 'Cannot block yourself', 'CANNOT_BLOCK_SELF')
  }

  const targetUser = await usersRepository.findUserById(friendId)
  if (!targetUser || targetUser.deletedAt) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
  }

  const existingFriendship = await friendsRepository.findFriendshipBetween(currentUserId, friendId)

  if (existingFriendship) {
    return await friendsRepository.updateFriendship(existingFriendship.id, {
      status: 'BLOCKED',
      blockedById: currentUserId,
      blockedAt: new Date()
    })
  }

  return await friendsRepository.createFriendship({
    requesterId: currentUserId,
    receiverId: friendId,
    status: 'BLOCKED',
    blockedById: currentUserId,
    blockedAt: new Date()
  })
}

export const friendsService = {
  areFriends,
  isBlocked,
  getFriends,
  searchFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  deleteFriend,
  blockUser
}
