import express from 'express'
import { socialController } from './socialController.js'
import { socialValidation } from './socialValidation.js'
import validate from '../../common/middleware/validate.js'
import authenticate from '../../common/middleware/authenticate.js'

// Router cho /api/v1/feed
const feedRouter = express.Router()
feedRouter.get('/', authenticate, validate(socialValidation.getFeed), socialController.getFeed)

// Router cho /api/v1/posts
const postsRouter = express.Router()

postsRouter.route('/')
  .post(authenticate, validate(socialValidation.createPost), socialController.createPost)

postsRouter.route('/:postId')
  .get(authenticate, validate(socialValidation.postIdParam), socialController.getPostById)
  .patch(authenticate, validate(socialValidation.updatePost), socialController.updatePost)
  .delete(authenticate, validate(socialValidation.postIdParam), socialController.deletePost)

// Reactions
postsRouter.route('/:postId/reactions')
  .post(authenticate, validate(socialValidation.addReaction), socialController.toggleReaction)
  .delete(authenticate, validate(socialValidation.addReaction), socialController.removeReaction)

// Comments
postsRouter.route('/:postId/comments')
  .get(authenticate, validate(socialValidation.getComments), socialController.getComments)
  .post(authenticate, validate(socialValidation.addComment), socialController.addComment)

// Router cho /api/v1/comments
const commentsRouter = express.Router()
commentsRouter.delete('/:commentId', authenticate, validate(socialValidation.commentIdParam), socialController.deleteComment)

export const feedRoute = feedRouter
export const postsRoute = postsRouter
export const commentsRoute = commentsRouter
