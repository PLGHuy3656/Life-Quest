import prisma from '../../config/database.js'

// Lấy danh sách bài viết trên bảng tin
const findFeedPosts = async (userId, friendIds, { skip = 0, take = 20 }) => {
  const where = {
    deletedAt: null,
    OR: [
      { visibility: 'PUBLIC' },
      { userId: userId },
      {
        userId: { in: friendIds },
        visibility: 'FRIENDS'
      }
    ]
  }

  const [posts, total] = await Promise.all([
    prisma.socialPost.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: true
          }
        },
        reactions: {
          select: {
            id: true,
            userId: true,
            reactionType: true
          }
        },
        _count: {
          select: {
            reactions: true,
            comments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.socialPost.count({ where })
  ])

  return { posts, total }
}

// Tìm bài viết theo ID
const findPostById = async (postId) => {
  return await prisma.socialPost.findFirst({
    where: {
      id: postId,
      deletedAt: null
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profile: true
        }
      },
      reactions: {
        select: {
          id: true,
          userId: true,
          reactionType: true
        }
      },
      _count: {
        select: {
          reactions: true,
          comments: true
        }
      }
    }
  })
}

// Tạo bài viết mới
const createPost = async (userId, data) => {
  return await prisma.socialPost.create({
    data: {
      userId,
      postType: data.postType || 'MANUAL',
      caption: data.caption || null,
      visibility: data.visibility || 'FRIENDS',
      sourceType: data.sourceType || null,
      sourceId: data.sourceId || null
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profile: true
        }
      }
    }
  })
}

// Cập nhật bài viết
const updatePost = async (postId, data) => {
  return await prisma.socialPost.update({
    where: { id: postId },
    data,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profile: true
        }
      }
    }
  })
}

// Soft delete bài viết
const softDeletePost = async (postId) => {
  return await prisma.socialPost.update({
    where: { id: postId },
    data: { deletedAt: new Date() }
  })
}

// Tìm reaction cụ thể
const findReaction = async (postId, userId, reactionType) => {
  return await prisma.postReaction.findUnique({
    where: {
      postId_userId_reactionType: {
        postId,
        userId,
        reactionType
      }
    }
  })
}

// Thêm reaction
const createReaction = async (postId, userId, reactionType) => {
  return await prisma.postReaction.create({
    data: {
      postId,
      userId,
      reactionType
    }
  })
}

// Xóa reaction theo ID
const deleteReaction = async (id) => {
  return await prisma.postReaction.delete({
    where: { id }
  })
}

// Lấy danh sách bình luận theo bài viết
const findComments = async (postId, { skip = 0, take = 20 }) => {
  const where = {
    postId,
    deletedAt: null
  }

  const [comments, total] = await Promise.all([
    prisma.postComment.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.postComment.count({ where })
  ])

  return { comments, total }
}

// Tìm bình luận theo ID
const findCommentById = async (commentId) => {
  return await prisma.postComment.findFirst({
    where: {
      id: commentId,
      deletedAt: null
    },
    include: {
      post: true
    }
  })
}

// Tạo bình luận mới
const createComment = async (postId, userId, content) => {
  return await prisma.postComment.create({
    data: {
      postId,
      userId,
      content
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profile: true
        }
      }
    }
  })
}

// Xóa bình luận
const softDeleteComment = async (commentId) => {
  return await prisma.postComment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() }
  })
}

export const socialRepository = {
  findFeedPosts,
  findPostById,
  createPost,
  updatePost,
  softDeletePost,
  findReaction,
  createReaction,
  deleteReaction,
  findComments,
  findCommentById,
  createComment,
  softDeleteComment
}
