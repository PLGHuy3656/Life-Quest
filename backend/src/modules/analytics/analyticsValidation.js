import Joi from 'joi'

// Ghi nhận sự kiện hành vi
const recordEvent = Joi.object({
  body: Joi.object({
    eventType: Joi.string().trim().max(50).required(),
    source: Joi.string().trim().max(50).optional().allow(null, ''),
    entityType: Joi.string().trim().max(50).optional().allow(null, ''),
    entityId: Joi.string().uuid().optional().allow(null),
    metadata: Joi.object().optional().allow(null)
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

// Lấy lịch sử sự kiện hành vi
const getBehavior = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    eventType: Joi.string().trim().max(50).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
})

export const analyticsValidation = {
  recordEvent,
  getBehavior
}
