import express from 'express'
import { socialController } from './socialController.js'
import { socialValidation } from './socialValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

const Router = express.Router()

// Tất cả các route Social (feed, posts, reactions, comments, pokes) đều cần xác thực
Router.use(authenticate)

// /feed
Router.get('/feed', validate(socialValidation.getFeed), socialController.getFeed)

// /posts
Router.post('/posts', validate(socialValidation.createPost), socialController.createPost)
Router.get('/posts/:postId', validate(socialValidation.getPostById), socialController.getPostById)
Router.patch('/posts/:postId', validate(socialValidation.updatePost), socialController.updatePost)
Router.delete('/posts/:postId', validate(socialValidation.deletePost), socialController.deletePost)

// /posts/:postId/reactions
Router.post('/posts/:postId/reactions', validate(socialValidation.reactPost), socialController.reactPost)
Router.delete('/posts/:postId/reactions', validate(socialValidation.removeReaction), socialController.removeReaction)

// /posts/:postId/comments & /comments/:commentId
Router.get('/posts/:postId/comments', validate(socialValidation.getComments), socialController.getComments)
Router.post('/posts/:postId/comments', validate(socialValidation.createComment), socialController.createComment)
Router.delete('/comments/:commentId', validate(socialValidation.deleteComment), socialController.deleteComment)

// /pokes
Router.post('/pokes', validate(socialValidation.pokeUser), socialController.pokeUser)

export const socialRoute = Router
