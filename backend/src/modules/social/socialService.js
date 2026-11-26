import { socialRepository } from './socialRepository.js'
import { friendsRepository } from '../friends/friendsRepository.js'
import ApiError from '../../common/errors/ApiError.js'
import { eventBus } from '../../common/events/eventBus.js'
import { EVENT_TYPES } from '../../common/events/eventTypes.js'

// Kiểm tra quyền xem bài viết
const ensureCanViewPost = async (userId, post) => {
  if (post.userId === userId || post.visibility === 'PUBLIC') {
    return true
  }

  if (post.visibility === 'PRIVATE') {
    throw new ApiError(403, 'This post is private', 'POST_PRIVATE')
  }

  // visibility === 'FRIENDS'
  const friendship = await friendsRepository.findRelationshipBetween(userId, post.userId)
  if (!friendship || friendship.status !== 'ACCEPTED') {
    throw new ApiError(403, 'This post is only visible to friends', 'POST_FRIENDS_ONLY')
  }

  return true
}

// Lấy danh sách bài viết trên bảng tin (feed)
const getFeed = async (userId, { page = 1, limit = 20 }) => {
  const friendships = await friendsRepository.findFriends(userId)
  const friendIds = friendships.map((f) => (f.requesterId === userId ? f.receiverId : f.requesterId))

  const skip = (page - 1) * limit
  const { posts, total } = await socialRepository.findFeedPosts(userId, friendIds, { skip, take: limit })

  return {
    posts,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

// Xem chi tiết một bài viết
const getPostById = async (userId, postId) => {
  const post = await socialRepository.findPostById(postId)
  if (!post) {
    throw new ApiError(404, 'Post not found', 'POST_NOT_FOUND')
  }

  await ensureCanViewPost(userId, post)
  return post
}

// Tạo bài viết mới
const createPost = async (userId, data) => {
  return await socialRepository.createPost(userId, data)
}

// Cập nhật bài viết
const updatePost = async (userId, postId, data) => {
  const post = await socialRepository.findPostById(postId)
  if (!post) {
    throw new ApiError(404, 'Post not found', 'POST_NOT_FOUND')
  }

  if (post.userId !== userId) {
    throw new ApiError(403, 'You can only update your own posts', 'NOT_POST_OWNER')
  }

  return await socialRepository.updatePost(postId, data)
}

// Xóa bài viết (soft delete)
const deletePost = async (userId, postId) => {
  const post = await socialRepository.findPostById(postId)
  if (!post) {
    throw new ApiError(404, 'Post not found', 'POST_NOT_FOUND')
  }

  if (post.userId !== userId) {
    throw new ApiError(403, 'You can only delete your own posts', 'NOT_POST_OWNER')
  }

  await socialRepository.softDeletePost(postId)
  return { success: true, message: 'Post deleted successfully' }
}

// Thả cảm xúc vào bài viết (toggle)
const toggleReaction = async (userId, postId, reactionType) => {
  const post = await socialRepository.findPostById(postId)
  if (!post) {
    throw new ApiError(404, 'Post not found', 'POST_NOT_FOUND')
  }

  await ensureCanViewPost(userId, post)

  const existing = await socialRepository.findReaction(postId, userId, reactionType)
  if (existing) {
    await socialRepository.deleteReaction(existing.id)
    return { reacted: false, reactionType, message: 'Reaction removed' }
  }

  const reaction = await socialRepository.createReaction(postId, userId, reactionType)
  try {
    eventBus.emit(EVENT_TYPES.POST_REACTED, {
      postId,
      postOwnerId: post.userId,
      actorId: userId,
      reactionType
    })
  } catch { /* ignore */ }
  return { reacted: true, reaction, message: 'Reaction added' }
}

// Xóa cảm xúc
const removeReaction = async (userId, postId, reactionType) => {
  const post = await socialRepository.findPostById(postId)
  if (!post) {
    throw new ApiError(404, 'Post not found', 'POST_NOT_FOUND')
  }

  const existing = await socialRepository.findReaction(postId, userId, reactionType)
  if (existing) {
    await socialRepository.deleteReaction(existing.id)
  }

  return { success: true, message: 'Reaction removed successfully' }
}

// Lấy danh sách bình luận
const getComments = async (userId, postId, { page = 1, limit = 20 }) => {
  const post = await socialRepository.findPostById(postId)
  if (!post) {
    throw new ApiError(404, 'Post not found', 'POST_NOT_FOUND')
  }

  await ensureCanViewPost(userId, post)

  const skip = (page - 1) * limit
  const { comments, total } = await socialRepository.findComments(postId, { skip, take: limit })

  return {
    comments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

// Thêm bình luận
const addComment = async (userId, postId, content) => {
  const post = await socialRepository.findPostById(postId)
  if (!post) {
    throw new ApiError(404, 'Post not found', 'POST_NOT_FOUND')
  }

  await ensureCanViewPost(userId, post)
  const comment = await socialRepository.createComment(postId, userId, content)
  try {
    eventBus.emit(EVENT_TYPES.POST_COMMENTED, {
      postId,
      postOwnerId: post.userId,
      actorId: userId,
      commentId: comment.id
    })
  } catch { /* ignore */ }
  return comment
}

// Xóa bình luận
const deleteComment = async (userId, commentId) => {
  const comment = await socialRepository.findCommentById(commentId)
  if (!comment) {
    throw new ApiError(404, 'Comment not found', 'COMMENT_NOT_FOUND')
  }

  if (comment.userId !== userId && comment.post.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to delete this comment', 'FORBIDDEN')
  }

  await socialRepository.softDeleteComment(commentId)
  return { success: true, message: 'Comment deleted successfully' }
}

export const socialService = {
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
