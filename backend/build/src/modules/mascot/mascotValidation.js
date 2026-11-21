import Joi from 'joi';
const getMascotModels = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
});
const getMascotState = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    modelCode: Joi.string().trim().max(50).default('FOX_V2'),
    placement: Joi.string().valid('DASHBOARD', 'AUTH', 'PROFILE', 'ADMIN', 'SOCIAL', 'FOCUS', 'SHOP').default('DASHBOARD')
  }).unknown(true)
});
const getCosmetics = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    modelCode: Joi.string().trim().max(50).default('FOX_V2')
  }).unknown(true)
});
const cosmeticAction = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object({
    cosmeticCode: Joi.string().trim().min(2).max(50).required()
  }).unknown(true),
  query: Joi.object().unknown(true).optional()
});
const triggerAction = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object({
    actionCode: Joi.string().trim().min(2).max(50).required()
  }).unknown(true),
  query: Joi.object().unknown(true).optional()
});
export const mascotValidation = {
  getMascotModels,
  getMascotState,
  getCosmetics,
  cosmeticAction,
  triggerAction
};