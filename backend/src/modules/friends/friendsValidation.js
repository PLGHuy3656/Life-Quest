import Joi from 'joi'

const searchFriends = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    q: Joi.string().trim().min(1).max(100).required()
  }).unknown(true)
})

const sendFriendRequest = Joi.object({
  body: Joi.object({
    receiverId: Joi.string().uuid().required()
  }).unknown(false),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

const friendRequestAction = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object({
    requestId: Joi.string().uuid().required()
  }).unknown(true),
  query: Joi.object().unknown(true).optional()
})

const friendAction = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object({
    friendId: Joi.string().uuid().required()
  }).unknown(true),
  query: Joi.object().unknown(true).optional()
})

export const friendsValidation = {
  searchFriends,
  sendFriendRequest,
  friendRequestAction,
  friendAction
}
