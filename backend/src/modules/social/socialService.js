import { socialRepository } from './socialRepository.js'
import { friendsService } from '../friends/friendsService.js'
import { usersRepository } from '../users/usersRepository.js'
import ApiError from '../../common/errors/ApiError.js'
import { eventBus } from '../../common/events/eventBus.js'
import { EVENT_TYPES } from '../../common/events/eventTypes.js'

// Kiểm tra quyền xem bài viết
const checkPostAccess = async (currentUserId, post) => {
  if (post.authorId === currentUserId) return true

  // Kiểm tra block
  const blocked = await friendsService.isBlocked(currentUserId, post.authorId)
  if (blocked) {
    throw new ApiError(403, 'Access denied', 'ACCESS_DENIED')
  }

  if (post.visibility === 'PUBLIC') return true

  if (post.visibility === 'FRIENDS') {
    const areFriends = await friendsService.areFriends(currentUserId, post.authorId)
    if (!areFriends) {
      throw new ApiError(403, 'This post is visible to friends only', 'POST_VISIBILITY_FRIENDS_ONLY')
    }
    return true
  }

  // PRIVATE
  throw new ApiError(403, 'This post is private', 'POST_PRIVATE')
}

const getFeed = async (currentUserId, { limit = 20, cursor = null }) => {
  const friends = await friendsService.getFriends(currentUserId)
  const friendIds = friends.map((f) => f.friend.id)

  let cursorPost = null
  if (cursor) {
    cursorPost = await socialRepository.findPostById(cursor)
  }

  return await socialRepository.findFeedPosts({
    currentUserId,
    friendIds,
    limit,
    cursorPost
  })
}

const createPost = async (currentUserId, postData) => {
  return await socialRepository.createPost({
    authorId: currentUserId,
    content: postData.content,
    mediaUrl: postData.mediaUrl,
    sourceType: postData.sourceType,
    sourceId: postData.sourceId,
    visibility: postData.visibility || 'FRIENDS'
  })
}

const getPostById = async (currentUserId, postId) => {
  const post = await socialRepository.findPostById(postId)
  if (!post || post.deletedAt) {
    throw new ApiError(404, 'Post not found', 'POST_NOT_FOUND')
  }

  await checkPostAccess(currentUserId, post)
  return post
}

const updatePost = async (currentUserId, postId, updateData) => {
  const post = await socialRepository.findPostById(postId)
  if (!post || post.deletedAt) {
    throw new ApiError(404, 'Post not found', 'POST_NOT_FOUND')
  }

  if (post.authorId !== currentUserId) {
    throw new ApiError(403, 'Only author can edit post', 'FORBIDDEN_POST_ACTION')
  }

  return await socialRepository.updatePost(postId, updateData)
}

const deletePost = async (currentUserId, postId) => {
  const post = await socialRepository.findPostById(postId)
  if (!post || post.deletedAt) {
    throw new ApiError(404, 'Post not found', 'POST_NOT_FOUND')
  }

  if (post.authorId !== currentUserId) {
    throw new ApiError(403, 'Only author can delete post', 'FORBIDDEN_POST_ACTION')
  }

  await socialRepository.softDeletePost(postId)
  return { message: 'Post deleted successfully' }
}

const reactPost = async (currentUserId, postId, type) => {
  const post = await socialRepository.findPostById(postId)
  if (!post || post.deletedAt) {
    throw new ApiError(404, 'Post not found', 'POST_NOT_FOUND')
  }

  await checkPostAccess(currentUserId, post)

  return await socialRepository.upsertReaction(postId, currentUserId, type)
}

const removeReaction = async (currentUserId, postId) => {
  await socialRepository.deleteReaction(postId, currentUserId)
  return { message: 'Reaction removed successfully' }
}

const getComments = async (currentUserId, postId) => {
  const post = await socialRepository.findPostById(postId)
  if (!post || post.deletedAt) {
    throw new ApiError(404, 'Post not found', 'POST_NOT_FOUND')
  }

  await checkPostAccess(currentUserId, post)
  return await socialRepository.findCommentsByPostId(postId)
}

const createComment = async (currentUserId, postId, content) => {
  const post = await socialRepository.findPostById(postId)
  if (!post || post.deletedAt) {
    throw new ApiError(404, 'Post not found', 'POST_NOT_FOUND')
  }

  await checkPostAccess(currentUserId, post)

  const comment = await socialRepository.createComment({
    postId,
    authorId: currentUserId,
    content
  })

  eventBus.emit(EVENT_TYPES.POST_COMMENTED, {
    postId,
    commentId: comment.id,
    authorId: currentUserId
  })

  return comment
}

const deleteComment = async (currentUserId, commentId) => {
  const comment = await socialRepository.findCommentById(commentId)
  if (!comment || comment.deletedAt) {
    throw new ApiError(404, 'Comment not found', 'COMMENT_NOT_FOUND')
  }

  if (comment.authorId !== currentUserId) {
    throw new ApiError(403, 'Only author can delete comment', 'FORBIDDEN_COMMENT_ACTION')
  }

  await socialRepository.softDeleteComment(commentId)
  return { message: 'Comment deleted successfully' }
}

const pokeUser = async (senderId, receiverId, message) => {
  if (senderId === receiverId) {
    throw new ApiError(400, 'Cannot poke yourself', 'CANNOT_POKE_SELF')
  }

  const receiver = await usersRepository.findUserById(receiverId)
  if (!receiver || receiver.deletedAt) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
  }

  const areFriends = await friendsService.areFriends(senderId, receiverId)
  if (!areFriends) {
    throw new ApiError(403, 'Must be friends to poke', 'NOT_FRIENDS')
  }

  const isBlocked = await friendsService.isBlocked(senderId, receiverId)
  if (isBlocked) {
    throw new ApiError(403, 'Cannot poke blocked user', 'USER_BLOCKED')
  }

  // Cooldown 5 phút (300,000 ms)
  const latestPoke = await socialRepository.findLatestPoke(senderId, receiverId)
  if (latestPoke) {
    const timeDiff = Date.now() - new Date(latestPoke.createdAt).getTime()
    const COOLDOWN_MS = 5 * 60 * 1000

    if (timeDiff < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - timeDiff) / 1000)
      throw new ApiError(
        429,
        `Poke cooldown active. Please wait ${remainingSeconds}s before poking again.`,
        'POKE_RATE_LIMITED'
      )
    }
  }

  const poke = await socialRepository.createPoke({
    senderId,
    receiverId,
    message: message || null
  })

  eventBus.emit(EVENT_TYPES.POKE_SENT, {
    senderId,
    receiverId,
    pokeId: poke.id
  })

  return poke
}

export const socialService = {
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
