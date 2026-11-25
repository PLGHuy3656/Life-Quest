import Joi from 'joi'

// Lấy danh sách bạn bè
const getFriends = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

// Tìm kiếm người dùng
const searchFriends = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    q: Joi.string().trim().min(1).required()
  })
})

// Lấy danh sách yêu cầu kết bạn
const getFriendRequests = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    type: Joi.string().valid('incoming', 'outgoing').default('incoming')
  })
})

// Gửi lời mời kết bạn
const sendFriendRequest = Joi.object({
  body: Joi.object({
    receiverId: Joi.string().uuid().required()
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

// Kiểm tra requestId trong param
const requestIdParam = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    requestId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Kiểm tra friendId trong param
const friendIdParam = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    friendId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Gửi Poke (thúc đẩy bạn bè)
const sendPoke = Joi.object({
  body: Joi.object({
    receiverId: Joi.string().uuid().required()
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

export const friendsValidation = {
  getFriends,
  searchFriends,
  getFriendRequests,
  sendFriendRequest,
  requestIdParam,
  friendIdParam,
  sendPoke
}
