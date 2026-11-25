import { StatusCodes } from 'http-status-codes'
import { challengesService } from './challengesService.js'

// Lấy danh sách thử thách
const getChallenges = async (req, res, next) => {
  try {
    const userId = req.user.id
    const challenges = await challengesService.getChallenges(userId, req.query)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: challenges
    })
  } catch (error) {
    next(error)
  }
}

// Tạo thử thách mới
const createChallenge = async (req, res, next) => {
  try {
    const creatorId = req.user.id
    const challenge = await challengesService.createChallenge(creatorId, req.body)
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: challenge
    })
  } catch (error) {
    next(error)
  }
}

// Chi tiết một thử thách
const getChallengeById = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { challengeId } = req.params
    const challenge = await challengesService.getChallengeById(userId, challengeId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: challenge
    })
  } catch (error) {
    next(error)
  }
}

// Cập nhật thử thách
const updateChallenge = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { challengeId } = req.params
    const updated = await challengesService.updateChallenge(userId, challengeId, req.body)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

// Hủy thử thách
const deleteChallenge = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { challengeId } = req.params
    const result = await challengesService.deleteChallenge(userId, challengeId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Tham gia thử thách
const joinChallenge = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { challengeId } = req.params
    const result = await challengesService.joinChallenge(userId, challengeId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Rời khỏi thử thách
const leaveChallenge = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { challengeId } = req.params
    const result = await challengesService.leaveChallenge(userId, challengeId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Danh sách thành viên trong thử thách
const getChallengeMembers = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { challengeId } = req.params
    const members = await challengesService.getChallengeMembers(userId, challengeId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: members
    })
  } catch (error) {
    next(error)
  }
}

// Bảng xếp hạng thử thách
const getLeaderboard = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { challengeId } = req.params
    const leaderboard = await challengesService.getLeaderboard(userId, challengeId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: leaderboard
    })
  } catch (error) {
    next(error)
  }
}

// Xem tiến độ của mình
const getMyProgress = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { challengeId } = req.params
    const progress = await challengesService.getMyProgress(userId, challengeId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: progress
    })
  } catch (error) {
    next(error)
  }
}

// Mời người bạn tham gia
const inviteMember = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { challengeId, userId: targetUserId } = req.params
    const result = await challengesService.inviteMember(userId, challengeId, targetUserId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Chấp nhận lời mời
const acceptInvitation = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { challengeId } = req.params
    const result = await challengesService.acceptInvitation(userId, challengeId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Từ chối lời mời
const declineInvitation = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { challengeId } = req.params
    const result = await challengesService.declineInvitation(userId, challengeId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const challengesController = {
  getChallenges,
  createChallenge,
  getChallengeById,
  updateChallenge,
  deleteChallenge,
  joinChallenge,
  leaveChallenge,
  getChallengeMembers,
  getLeaderboard,
  getMyProgress,
  inviteMember,
  acceptInvitation,
  declineInvitation
}
