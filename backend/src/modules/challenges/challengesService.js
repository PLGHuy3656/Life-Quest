import { challengesRepository } from './challengesRepository.js'
import ApiError from '../../common/errors/ApiError.js'

// Format số Decimal cho thành viên Challenge
const formatMember = (member, rank) => {
  if (!member) return null
  return {
    ...member,
    progress: Number(member.progress || 0),
    finalScore: member.finalScore !== null ? Number(member.finalScore) : null,
    rank: rank !== undefined ? rank : member.rank
  }
}

// Lấy danh sách thử thách
const getChallenges = async (userId, query) => {
  return await challengesRepository.findChallenges({
    status: query.status,
    userId,
    myChallengesOnly: query.myChallengesOnly === true || query.myChallengesOnly === 'true'
  })
}

// Tạo thử thách mới
const createChallenge = async (creatorId, data) => {
  const challenge = await challengesRepository.createChallengeWithCreator(creatorId, data)
  return challenge
}

// Chi tiết thử thách theo ID
const getChallengeById = async (userId, challengeId) => {
  const challenge = await challengesRepository.findChallengeById(challengeId)
  if (!challenge) {
    throw new ApiError(404, 'Challenge not found', 'CHALLENGE_NOT_FOUND')
  }

  return {
    ...challenge,
    members: challenge.members.map((m) => formatMember(m))
  }
}

// Chỉnh sửa thông tin thử thách
const updateChallenge = async (userId, challengeId, data) => {
  const challenge = await challengesRepository.findChallengeById(challengeId)
  if (!challenge) {
    throw new ApiError(404, 'Challenge not found', 'CHALLENGE_NOT_FOUND')
  }

  if (challenge.creatorId !== userId) {
    throw new ApiError(403, 'Only the creator can edit this challenge', 'FORBIDDEN')
  }

  return await challengesRepository.updateChallenge(challengeId, data)
}

// Hủy thử thách (chuyển sang CANCELLED)
const deleteChallenge = async (userId, challengeId) => {
  const challenge = await challengesRepository.findChallengeById(challengeId)
  if (!challenge) {
    throw new ApiError(404, 'Challenge not found', 'CHALLENGE_NOT_FOUND')
  }

  if (challenge.creatorId !== userId) {
    throw new ApiError(403, 'Only the creator can cancel this challenge', 'FORBIDDEN')
  }

  await challengesRepository.updateChallenge(challengeId, { status: 'CANCELLED' })
  return { success: true, message: 'Challenge cancelled successfully' }
}

// Tham gia thử thách trực tiếp
const joinChallenge = async (userId, challengeId) => {
  const challenge = await challengesRepository.findChallengeById(challengeId)
  if (!challenge) {
    throw new ApiError(404, 'Challenge not found', 'CHALLENGE_NOT_FOUND')
  }

  if (challenge.status === 'CANCELLED' || challenge.status === 'COMPLETED') {
    throw new ApiError(400, 'Cannot join an inactive challenge', 'CHALLENGE_INACTIVE')
  }

  const existingMember = await challengesRepository.findChallengeMember(challengeId, userId)
  if (existingMember && existingMember.status === 'ACCEPTED') {
    throw new ApiError(400, 'You are already participating in this challenge', 'ALREADY_JOINED')
  }

  const member = await challengesRepository.upsertChallengeMember(challengeId, userId, {
    status: 'ACCEPTED',
    joinedAt: new Date(),
    progress: 0
  })

  return formatMember(member)
}

// Rời khỏi thử thách
const leaveChallenge = async (userId, challengeId) => {
  const member = await challengesRepository.findChallengeMember(challengeId, userId)
  if (!member || member.status !== 'ACCEPTED') {
    throw new ApiError(400, 'You are not participating in this challenge', 'NOT_PARTICIPATING')
  }

  await challengesRepository.upsertChallengeMember(challengeId, userId, {
    status: 'LEFT'
  })

  return { success: true, message: 'You have left the challenge' }
}

// Lấy danh sách thành viên trong thử thách
const getChallengeMembers = async (userId, challengeId) => {
  const members = await challengesRepository.findChallengeMembers(challengeId)
  return members.map((m) => formatMember(m))
}

// Lấy bảng xếp hạng thử thách
const getLeaderboard = async (userId, challengeId) => {
  const leaderboard = await challengesRepository.findLeaderboard(challengeId)
  return leaderboard.map((m, index) => formatMember(m, index + 1))
}

// Xem tiến độ của chính mình trong thử thách
const getMyProgress = async (userId, challengeId) => {
  const member = await challengesRepository.findChallengeMember(challengeId, userId)
  if (!member) {
    throw new ApiError(404, 'You are not a member of this challenge', 'MEMBER_NOT_FOUND')
  }

  return formatMember(member)
}

// Mời người bạn tham gia thử thách
const inviteMember = async (userId, challengeId, targetUserId) => {
  const challenge = await challengesRepository.findChallengeById(challengeId)
  if (!challenge) {
    throw new ApiError(404, 'Challenge not found', 'CHALLENGE_NOT_FOUND')
  }

  const member = await challengesRepository.upsertChallengeMember(challengeId, targetUserId, {
    status: 'INVITED'
  })

  return formatMember(member)
}

// Chấp nhận lời mời tham gia thử thách
const acceptInvitation = async (userId, challengeId) => {
  const member = await challengesRepository.findChallengeMember(challengeId, userId)
  if (!member || member.status !== 'INVITED') {
    throw new ApiError(404, 'Invitation not found or already processed', 'INVITATION_NOT_FOUND')
  }

  const updated = await challengesRepository.upsertChallengeMember(challengeId, userId, {
    status: 'ACCEPTED',
    joinedAt: new Date()
  })

  return formatMember(updated)
}

// Từ chối lời mời tham gia thử thách
const declineInvitation = async (userId, challengeId) => {
  const member = await challengesRepository.findChallengeMember(challengeId, userId)
  if (!member || member.status !== 'INVITED') {
    throw new ApiError(404, 'Invitation not found or already processed', 'INVITATION_NOT_FOUND')
  }

  await challengesRepository.upsertChallengeMember(challengeId, userId, {
    status: 'DECLINED'
  })

  return { success: true, message: 'Challenge invitation declined' }
}

export const challengesService = {
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
