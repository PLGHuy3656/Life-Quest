import Joi from 'joi';
const getChallenges = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
});
const createChallenge = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().max(500).optional(),
    type: Joi.string().valid('SOLO', 'DUO', 'COMMUNITY').default('COMMUNITY'),
    targetMetric: Joi.string().trim().default('QUEST_COUNT'),
    targetValue: Joi.number().integer().min(1).default(5),
    rewardXp: Joi.number().integer().min(0).default(150),
    rewardCoins: Joi.number().integer().min(0).default(75),
    startAt: Joi.date().iso().required(),
    endAt: Joi.date().iso().required(),
    isActive: Joi.boolean().default(true)
  }).required(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
});
const challengeIdParam = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object({
    id: Joi.string().uuid().required()
  }).required(),
  query: Joi.object().unknown(true).optional()
});
export const challengesValidation = {
  getChallenges,
  createChallenge,
  challengeIdParam
};