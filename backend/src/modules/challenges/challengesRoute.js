import express from 'express'
import { challengesController } from './challengesController.js'
import { challengesValidation } from './challengesValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

const Router = express.Router()

// /api/v1/challenges
Router.route('/')
  .get(authenticate, validate(challengesValidation.getChallenges), challengesController.getChallenges)
  .post(authenticate, validate(challengesValidation.createChallenge), challengesController.createChallenge)

// /api/v1/challenges/:challengeId
Router.route('/:challengeId')
  .get(authenticate, validate(challengesValidation.challengeIdParam), challengesController.getChallengeById)
  .patch(authenticate, validate(challengesValidation.updateChallenge), challengesController.updateChallenge)
  .delete(authenticate, validate(challengesValidation.challengeIdParam), challengesController.deleteChallenge)

// Join & Leave
Router.post('/:challengeId/join', authenticate, validate(challengesValidation.challengeIdParam), challengesController.joinChallenge)
Router.post('/:challengeId/leave', authenticate, validate(challengesValidation.challengeIdParam), challengesController.leaveChallenge)

// Members, Leaderboard, Progress
Router.get('/:challengeId/members', authenticate, validate(challengesValidation.challengeIdParam), challengesController.getChallengeMembers)
Router.get('/:challengeId/leaderboard', authenticate, validate(challengesValidation.challengeIdParam), challengesController.getLeaderboard)
Router.get('/:challengeId/progress', authenticate, validate(challengesValidation.challengeIdParam), challengesController.getMyProgress)

// Invitations
Router.post('/:challengeId/members/:userId/invite', authenticate, validate(challengesValidation.challengeMemberParam), challengesController.inviteMember)
Router.post('/:challengeId/members/:userId/accept', authenticate, validate(challengesValidation.challengeMemberParam), challengesController.acceptInvitation)
Router.post('/:challengeId/members/:userId/decline', authenticate, validate(challengesValidation.challengeMemberParam), challengesController.declineInvitation)

// Tiện ích rút gọn cho chính mình
Router.post('/:challengeId/accept', authenticate, validate(challengesValidation.challengeIdParam), challengesController.acceptInvitation)
Router.post('/:challengeId/decline', authenticate, validate(challengesValidation.challengeIdParam), challengesController.declineInvitation)

export const challengesRoute = Router
