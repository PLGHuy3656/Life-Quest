import { StatusCodes } from 'http-status-codes'
import { socialService } from './socialService.js'
import { getCurrentUserId } from '../../common/utils/getCurrentUserId.js'

const getFeed = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20
    const cursor = req.query.cursor || null

    const feed = await socialService.getFeed(currentUserId, { limit, cursor })

    return res.status(StatusCodes.OK).json({
      success: true,
      data: feed
    })
  } catch (error) {
    next(error)
  }
}

const createPost = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const postData = req.body

    const post = await socialService.createPost(currentUserId, postData)

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: post
    })
  } catch (error) {
    next(error)
  }
}

const getPostById = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { postId } = req.params

    const post = await socialService.getPostById(currentUserId, postId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: post
    })
  } catch (error) {
    next(error)
  }
}

const updatePost = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { postId } = req.params
    const updateData = req.body

    const updated = await socialService.updatePost(currentUserId, postId, updateData)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

const deletePost = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { postId } = req.params

    const result = await socialService.deletePost(currentUserId, postId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

const reactPost = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { postId } = req.params
    const { type } = req.body

    const reaction = await socialService.reactPost(currentUserId, postId, type)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: reaction
    })
  } catch (error) {
    next(error)
  }
}

const removeReaction = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { postId } = req.params

    const result = await socialService.removeReaction(currentUserId, postId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

const getComments = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { postId } = req.params

    const comments = await socialService.getComments(currentUserId, postId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: comments
    })
  } catch (error) {
    next(error)
  }
}

const createComment = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { postId } = req.params
    const { content } = req.body

    const comment = await socialService.createComment(currentUserId, postId, content)

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: comment
    })
  } catch (error) {
    next(error)
  }
}

const deleteComment = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { commentId } = req.params

    const result = await socialService.deleteComment(currentUserId, commentId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

const pokeUser = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req)
    const { receiverId, message } = req.body

    const poke = await socialService.pokeUser(currentUserId, receiverId, message)

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: poke
    })
  } catch (error) {
    next(error)
  }
}

export const socialController = {
  getFeed,
  createPost,
  getPostById,
  updatePost,
  deletePost,
  reactPost,
  removeReaction,
  getComments,
  createComment,
  deleteComment,
  pokeUser
}
