import Joi from 'joi'


// Đăng ký tài khoản mới
const register = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().email().required(),
    username: Joi.string().trim().min(3).max(50).required(),
    password: Joi.string().min(8).max(72).required()
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})


// Đăng nhập
const login = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().required()
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})


// Làm mới access token bằng refresh token
const refresh = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required()
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})


// Đăng xuất
const logout = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required()
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})


// Quên mật khẩu
const forgotPassword = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().email().required()
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})


// Đặt lại mật khẩu
const resetPassword = Joi.object({
  body: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(8).max(72).required()
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})


export const authValidation = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword
}
