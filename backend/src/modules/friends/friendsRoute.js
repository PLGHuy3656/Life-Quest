import express from 'express'
import { friendsController } from './friendsController.js'
import { friendsValidation } from './friendsValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

// Router cho /api/v1/friends
const friendsRouter = express.Router()

friendsRouter.get('/', authenticate, validate(friendsValidation.getFriends), friendsController.getFriends)
friendsRouter.get('/search', authenticate, validate(friendsValidation.searchFriends), friendsController.searchFriends)
friendsRouter.delete('/:friendId', authenticate, validate(friendsValidation.friendIdParam), friendsController.removeFriend)
friendsRouter.post('/:friendId/block', authenticate, validate(friendsValidation.friendIdParam), friendsController.blockUser)

// Router cho /api/v1/friend-requests
const friendRequestsRouter = express.Router()

friendRequestsRouter.route('/')
  .get(authenticate, validate(friendsValidation.getFriendRequests), friendsController.getFriendRequests)
  .post(authenticate, validate(friendsValidation.sendFriendRequest), friendsController.sendFriendRequest)

friendRequestsRouter.post('/:requestId/accept', authenticate, validate(friendsValidation.requestIdParam), friendsController.acceptFriendRequest)
friendRequestsRouter.post('/:requestId/reject', authenticate, validate(friendsValidation.requestIdParam), friendsController.rejectFriendRequest)

// Router cho /api/v1/pokes
const pokesRouter = express.Router()
pokesRouter.post('/', authenticate, validate(friendsValidation.sendPoke), friendsController.sendPoke)

export const friendsRoute = friendsRouter
export const friendRequestsRoute = friendRequestsRouter
export const pokesRoute = pokesRouter
