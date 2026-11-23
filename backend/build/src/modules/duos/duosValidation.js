import Joi from 'joi';
const inviteDuo = Joi.object({
  body: Joi.object({
    partnerId: Joi.string().uuid().required(),
    title: Joi.string().trim().max(100).optional(),
    questId: Joi.string().uuid().optional(),
    targetValue: Joi.number().integer().min(1).max(100).default(1),
    expiresInDays: Joi.number().integer().min(1).max(30).default(7)
  }).required(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
});
const duoIdParam = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object({
    id: Joi.string().uuid().required()
  }).required(),
  query: Joi.object().unknown(true).optional()
});
const getActiveDuos = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
});
export const duosValidation = {
  inviteDuo,
  duoIdParam,
  getActiveDuos
};