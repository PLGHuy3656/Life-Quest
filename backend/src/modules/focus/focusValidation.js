import Joi from 'joi'

// Bắt đầu một phiên Focus mới cho Execution
const createFocusSession = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    executionId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Lấy danh sách phiên Focus của một Execution
const getFocusSessionsByExecutionId = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    executionId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Tham số focusSessionId cho các hành động start, pause, resume, complete, abandon
const focusSessionIdParam = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    focusSessionId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Ghi nhận gián đoạn phiên Focus
const interruptFocusSession = Joi.object({
  body: Joi.object({
    reason: Joi.string().max(255).allow('').optional(),
    source: Joi.string().max(30).optional(),
    durationSeconds: Joi.number().integer().min(0).optional()
  }).unknown(false),
  params: Joi.object({
    focusSessionId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

export const focusValidation = {
  createFocusSession,
  getFocusSessionsByExecutionId,
  focusSessionIdParam,
  interruptFocusSession
}
