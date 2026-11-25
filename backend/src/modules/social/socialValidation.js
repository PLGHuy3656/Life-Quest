import Joi from 'joi'

// Lấy bảng tin (feed)
const getFeed = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20)
  })
})

// Kiểm tra postId trong param
const postIdParam = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    postId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Tạo bài viết mới
const createPost = Joi.object({
  body: Joi.object({
    postType: Joi.string().valid('MANUAL', 'QUEST_COMPLETED', 'ACHIEVEMENT_UNLOCKED', 'STREAK_MILESTONE').default('MANUAL'),
    caption: Joi.string().trim().max(2000).optional().allow(null, ''),
    visibility: Joi.string().valid('PUBLIC', 'FRIENDS', 'PRIVATE').default('FRIENDS'),
    sourceType: Joi.string().trim().max(50).optional().allow(null),
    sourceId: Joi.string().uuid().optional().allow(null)
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

// Cập nhật bài viết
const updatePost = Joi.object({
  body: Joi.object({
    caption: Joi.string().trim().max(2000).optional(),
    visibility: Joi.string().valid('PUBLIC', 'FRIENDS', 'PRIVATE').optional()
  }),
  params: Joi.object({
    postId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Thả cảm xúc reaction
const addReaction = Joi.object({
  body: Joi.object({
    reactionType: Joi.string().valid('LIKE', 'CELEBRATE', 'SUPPORT', 'FIRE', 'HEART').default('LIKE')
  }),
  params: Joi.object({
    postId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Lấy danh sách bình luận
const getComments = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    postId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20)
  })
})

// Thêm bình luận
const addComment = Joi.object({
  body: Joi.object({
    content: Joi.string().trim().min(1).max(1000).required()
  }),
  params: Joi.object({
    postId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Kiểm tra commentId trong param
const commentIdParam = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    commentId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

export const socialValidation = {
  getFeed,
  postIdParam,
  createPost,
  updatePost,
  addReaction,
  getComments,
  addComment,
  commentIdParam
}
