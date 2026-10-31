import Joi from 'joi'


// Lấy User bằng Email
const getUserByEmail = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    email: Joi.string().email().required()
  }),
  query: Joi.object().unknown(true).optional()

})


// Tạo 1 User
const createUser = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(8).required()
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})


export const usersValidation = {
  getUserByEmail,
  createUser
}
