import Joi from 'joi';

// Validate khi lấy thông tin cá nhân (không cần body/params/query đặc biệt)
const getMe = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
});

// Validate khi cập nhật thông tin profile (displayName, bio, title)
const updateMe = Joi.object({
  body: Joi.object({
    displayName: Joi.string().trim().max(100).optional(),
    bio: Joi.string().trim().max(500).allow('').optional(),
    title: Joi.string().trim().max(100).allow('').optional()
  }).min(1).unknown(false),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
});

// Validate khi lấy cài đặt (không cần validate gì thêm)
const getMySettings = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
});

// Validate khi cập nhật cài đặt (timezone, language, privacyMode, notificationEnabled)
const updateMySettings = Joi.object({
  body: Joi.object({
    timezone: Joi.string().trim().max(100).optional(),
    language: Joi.string().trim().max(10).optional(),
    privacyMode: Joi.string().valid('PUBLIC', 'FRIENDS', 'PRIVATE').optional(),
    notificationEnabled: Joi.boolean().optional()
  }).min(1).unknown(false),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
});

// Validate khi xem profile public của user khác theo userId (uuid)
const getUserById = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    userId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
});
export const usersValidation = {
  getMe,
  updateMe,
  getMySettings,
  updateMySettings,
  getUserById
};