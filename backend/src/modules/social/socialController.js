import { StatusCodes } from 'http-status-codes'
import { socialService } from './socialService.js'

// Lấy bảng tin (feed)
const getFeed = async (req, res, next) => {
  try {
    const userId = req.user.id
    const feed = await socialService.getFeed(userId, req.query)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: feed.posts,
      pagination: feed.pagination
    })
  } catch (error) {
    next(error)
  }
}

// Xem chi tiết bài viết
const getPostById = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { postId } = req.params
    const post = await socialService.getPostById(userId, postId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: post
    })
  } catch (error) {
    next(error)
  }
}

// Tạo bài viết mới
const createPost = async (req, res, next) => {
  try {
    const userId = req.user.id
    const post = await socialService.createPost(userId, req.body)
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: post
    })
  } catch (error) {
    next(error)
  }
}

// Cập nhật bài viết
const updatePost = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { postId } = req.params
    const updated = await socialService.updatePost(userId, postId, req.body)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

// Xóa bài viết
const deletePost = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { postId } = req.params
    const result = await socialService.deletePost(userId, postId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Thả cảm xúc reaction
const toggleReaction = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { postId } = req.params
    const { reactionType } = req.body
    const result = await socialService.toggleReaction(userId, postId, reactionType)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Xóa cảm xúc
const removeReaction = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { postId } = req.params
    const { reactionType } = req.body
    const result = await socialService.removeReaction(userId, postId, reactionType)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Lấy danh sách bình luận
const getComments = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { postId } = req.params
    const commentsData = await socialService.getComments(userId, postId, req.query)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: commentsData.comments,
      pagination: commentsData.pagination
    })
  } catch (error) {
    next(error)
  }
}

// Thêm bình luận
const addComment = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { postId } = req.params
    const { content } = req.body
    const comment = await socialService.addComment(userId, postId, content)
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: comment
    })
  } catch (error) {
    next(error)
  }
}

// Xóa bình luận
const deleteComment = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { commentId } = req.params
    const result = await socialService.deleteComment(userId, commentId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const socialController = {
  getFeed,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleReaction,
  removeReaction,
  getComments,
  addComment,
  deleteComment
}
