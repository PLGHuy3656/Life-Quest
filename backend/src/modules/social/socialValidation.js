import Joi from 'joi'

const getFeed = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(50).default(20),
    cursor: Joi.string().uuid().optional()
  }).unknown(true)
})

const createPost = Joi.object({
  body: Joi.object({
    content: Joi.string().trim().min(1).max(1000).required(),
    mediaUrl: Joi.string().uri().allow('', null).optional(),
    sourceType: Joi.string().max(50).allow('', null).optional(),
    sourceId: Joi.string().uuid().allow('', null).optional(),
    visibility: Joi.string().valid('FRIENDS', 'PUBLIC', 'PRIVATE').default('FRIENDS')
  }).unknown(false),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

const getPostById = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object({
    postId: Joi.string().uuid().required()
  }).unknown(true),
  query: Joi.object().unknown(true).optional()
})

const updatePost = Joi.object({
  params: Joi.object({
    postId: Joi.string().uuid().required()
  }).unknown(true),
  body: Joi.object({
    content: Joi.string().trim().min(1).max(1000).optional(),
    mediaUrl: Joi.string().uri().allow('', null).optional(),
    visibility: Joi.string().valid('FRIENDS', 'PUBLIC', 'PRIVATE').optional()
  }).min(1).unknown(false),
  query: Joi.object().unknown(true).optional()
})

const deletePost = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object({
    postId: Joi.string().uuid().required()
  }).unknown(true),
  query: Joi.object().unknown(true).optional()
})

const reactPost = Joi.object({
  params: Joi.object({
    postId: Joi.string().uuid().required()
  }).unknown(true),
  body: Joi.object({
    type: Joi.string().valid('LIKE', 'CELEBRATE', 'FIRE', 'CLAP').required()
  }).unknown(false),
  query: Joi.object().unknown(true).optional()
})

const removeReaction = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object({
    postId: Joi.string().uuid().required()
  }).unknown(true),
  query: Joi.object().unknown(true).optional()
})

const getComments = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object({
    postId: Joi.string().uuid().required()
  }).unknown(true),
  query: Joi.object().unknown(true).optional()
})

const createComment = Joi.object({
  params: Joi.object({
    postId: Joi.string().uuid().required()
  }).unknown(true),
  body: Joi.object({
    content: Joi.string().trim().min(1).max(500).required()
  }).unknown(false),
  query: Joi.object().unknown(true).optional()
})

const deleteComment = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object({
    commentId: Joi.string().uuid().required()
  }).unknown(true),
  query: Joi.object().unknown(true).optional()
})

const pokeUser = Joi.object({
  body: Joi.object({
    receiverId: Joi.string().uuid().required(),
    message: Joi.string().trim().max(100).allow('', null).optional()
  }).unknown(false),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

export const socialValidation = {
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
