import express from 'express'
import { friendsController } from './friendsController.js'
import { friendsValidation } from './friendsValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

const Router = express.Router()

// Tất cả các route Friends đều yêu cầu xác thực người dùng
Router.use(authenticate)

// /friends & /friends/search
Router.get('/friends', friendsController.getFriends)
Router.get('/friends/search', validate(friendsValidation.searchFriends), friendsController.searchFriends)

// /friend-requests
Router.get('/friend-requests', friendsController.getFriendRequests)
Router.post('/friend-requests', validate(friendsValidation.sendFriendRequest), friendsController.sendFriendRequest)
Router.post('/friend-requests/:requestId/accept', validate(friendsValidation.friendRequestAction), friendsController.acceptFriendRequest)
Router.post('/friend-requests/:requestId/reject', validate(friendsValidation.friendRequestAction), friendsController.rejectFriendRequest)

// /friends/:friendId
Router.delete('/friends/:friendId', validate(friendsValidation.friendAction), friendsController.deleteFriend)
Router.post('/friends/:friendId/block', validate(friendsValidation.friendAction), friendsController.blockUser)

export const friendsRoute = Router
