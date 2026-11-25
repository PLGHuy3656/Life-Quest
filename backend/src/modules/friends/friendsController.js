import { StatusCodes } from 'http-status-codes'
import { friendsService } from './friendsService.js'

// Lấy danh sách bạn bè
const getFriends = async (req, res, next) => {
  try {
    const userId = req.user.id
    const friends = await friendsService.getFriends(userId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: friends
    })
  } catch (error) {
    next(error)
  }
}

// Tìm kiếm người dùng
const searchFriends = async (req, res, next) => {
  try {
    const currentUserId = req.user.id
    const { q } = req.query
    const results = await friendsService.searchFriends(q, currentUserId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: results
    })
  } catch (error) {
    next(error)
  }
}

// Lấy danh sách yêu cầu kết bạn
const getFriendRequests = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { type } = req.query
    const requests = await friendsService.getFriendRequests(userId, type)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: requests
    })
  } catch (error) {
    next(error)
  }
}

// Gửi lời mời kết bạn
const sendFriendRequest = async (req, res, next) => {
  try {
    const requesterId = req.user.id
    const { receiverId } = req.body
    const result = await friendsService.sendFriendRequest(requesterId, receiverId)
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Chấp nhận lời mời kết bạn
const acceptFriendRequest = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { requestId } = req.params
    const result = await friendsService.acceptFriendRequest(userId, requestId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Từ chối lời mời kết bạn
const rejectFriendRequest = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { requestId } = req.params
    const result = await friendsService.rejectFriendRequest(userId, requestId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Hủy quan hệ bạn bè
const removeFriend = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { friendId } = req.params
    const result = await friendsService.removeFriend(userId, friendId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Chặn người dùng
const blockUser = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { friendId } = req.params
    const result = await friendsService.blockUser(userId, friendId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Gửi Poke
const sendPoke = async (req, res, next) => {
  try {
    const senderId = req.user.id
    const { receiverId } = req.body
    const result = await friendsService.sendPoke(senderId, receiverId)
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const friendsController = {
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
