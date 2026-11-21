import { StatusCodes } from 'http-status-codes'
import { friendsService } from './friendsService.js'
import { getCurrentUserId } from '../../common/utils/getCurrentUserId.js'

const getFriends = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const friends = await friendsService.getFriends(currentUserId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: friends
    })
  } catch (error) {
    next(error)
  }
}

const searchFriends = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { q } = req.query
    const results = await friendsService.searchFriends(currentUserId, q)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: results
    })
  } catch (error) {
    next(error)
  }
}

const getFriendRequests = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const requests = await friendsService.getFriendRequests(currentUserId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: requests
    })
  } catch (error) {
    next(error)
  }
}

const sendFriendRequest = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { receiverId } = req.body
    const result = await friendsService.sendFriendRequest(currentUserId, receiverId)

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

const acceptFriendRequest = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { requestId } = req.params
    const result = await friendsService.acceptFriendRequest(currentUserId, requestId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

const rejectFriendRequest = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { requestId } = req.params
    const result = await friendsService.rejectFriendRequest(currentUserId, requestId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

const deleteFriend = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { friendId } = req.params
    const result = await friendsService.deleteFriend(currentUserId, friendId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

const blockUser = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { friendId } = req.params
    const result = await friendsService.blockUser(currentUserId, friendId)

    return res.status(StatusCodes.OK).json({
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
  deleteFriend,
  blockUser
}
