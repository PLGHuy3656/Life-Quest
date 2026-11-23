import { challengesRepository } from './challengesRepository.js'
import ApiError from '../../common/errors/ApiError.js'
import { eventBus } from '../../common/events/eventBus.js'
import { EVENT_TYPES } from '../../common/events/eventTypes.js'
import prisma from '../../config/database.js'

const getChallenges = async (userId = null) => {
  const challenges = await challengesRepository.findActiveChallenges()
  const challengeIds = challenges.map((c) => c.id)

  const participations = userId
    ? await challengesRepository.findUserParticipations(userId, challengeIds)
    : []

  return challenges.map((c) => {
    const part = participations.find((p) => p.challengeId === c.id)
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      type: c.type,
      targetMetric: c.targetMetric,
      targetValue: c.targetValue,
      rewardXp: c.rewardXp,
      rewardCoins: c.rewardCoins,
      startAt: c.startAt,
      endAt: c.endAt,
      isActive: c.isActive,
      isJoined: Boolean(part),
      myProgress: part ? part.currentProgress : 0,
      isCompleted: Boolean(part?.isCompleted),
      rewardClaimed: Boolean(part?.rewardClaimed)
    }
  })
}

const createChallenge = async (data) => {
  const startAt = new Date(data.startAt)
  const endAt = new Date(data.endAt)

  if (startAt >= endAt) {
    throw new ApiError(400, 'Start date must be before end date', 'INVALID_DATE_RANGE')
  }

  return await challengesRepository.createChallenge({
    title: data.title,
    description: data.description,
    type: data.type || 'COMMUNITY',
    targetMetric: data.targetMetric || 'QUEST_COUNT',
    targetValue: Math.max(1, data.targetValue || 5),
    rewardXp: data.rewardXp !== undefined ? data.rewardXp : 150,
    rewardCoins: data.rewardCoins !== undefined ? data.rewardCoins : 75,
    startAt,
    endAt,
    isActive: data.isActive !== undefined ? data.isActive : true
  })
}

const joinChallenge = async (userId, challengeId) => {
  const challenge = await challengesRepository.findChallengeById(challengeId)
  if (!challenge || !challenge.isActive) {
    throw new ApiError(404, 'Challenge not found or inactive', 'CHALLENGE_NOT_FOUND')
  }

  const now = new Date()
  if (now > new Date(challenge.endAt)) {
    throw new ApiError(400, 'Challenge has already ended', 'CHALLENGE_EXPIRED')
  }

  const existing = await challengesRepository.findParticipant(challengeId, userId)
  if (existing) {
    throw new ApiError(409, 'You have already joined this challenge', 'ALREADY_JOINED')
  }

  return await challengesRepository.createParticipant({
    challengeId,
    userId,
    currentProgress: 0,
    isCompleted: false,
    rewardClaimed: false
  })
}

const getLeaderboard = async (challengeId) => {
  const challenge = await challengesRepository.findChallengeById(challengeId)
  if (!challenge) {
    throw new ApiError(404, 'Challenge not found', 'CHALLENGE_NOT_FOUND')
  }

  const participants = await challengesRepository.getLeaderboard(challengeId)

  return participants.map((p, index) => ({
    rank: index + 1,
    userId: p.userId,
    username: p.user?.username || 'Unknown Warrior',
    currentProgress: p.currentProgress,
    targetValue: challenge.targetValue,
    isCompleted: p.isCompleted,
    completedAt: p.completedAt
  }))
}

/**
 * Tự động cập nhật tiến độ Challenge khi người dùng hoàn thành một nhiệm vụ
 */
const onQuestCompleted = async (userId) => {
  const now = new Date()
  const activeParticipations = await challengesRepository.findUserActiveChallenges(userId, now)

  for (const part of activeParticipations) {
    const newProgress = part.currentProgress + 1
    const challenge = part.challenge

    if (newProgress >= challenge.targetValue && !part.rewardClaimed) {
      // Đạt chỉ tiêu và chưa nhận thưởng -> Bọc transaction cộng thưởng an toàn bằng upsert (Note 2)
      await prisma.$transaction(async (tx) => {
        await tx.challengeParticipant.update({
          where: { id: part.id },
          data: {
            currentProgress: newProgress,
            isCompleted: true,
            rewardClaimed: true,
            completedAt: now
          }
        })

        await tx.userGamification.upsert({
          where: { userId },
          update: {
            totalXp: { increment: challenge.rewardXp },
            coinBalance: { increment: challenge.rewardCoins }
          },
          create: {
            userId,
            totalXp: BigInt(challenge.rewardXp),
            coinBalance: BigInt(challenge.rewardCoins),
            level: 1
          }
        })
      })

      eventBus.emit(EVENT_TYPES.CHALLENGE_COMPLETED, {
        userId,
        challengeId: challenge.id,
        completedAt: now
      })
    } else {
      // Chỉ cập nhật tiến độ
      await prisma.challengeParticipant.update({
        where: { id: part.id },
        data: {
          currentProgress: newProgress
        }
      })
    }
  }
}

export const challengesService = {
  getChallenges,
  createChallenge,
  joinChallenge,
  getLeaderboard,
  onQuestCompleted
}

export default challengesService
