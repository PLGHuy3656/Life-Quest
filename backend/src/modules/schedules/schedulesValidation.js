import Joi from 'joi'

// Lấy danh sách Schedule của một Quest
const getSchedulesByQuestId = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    questId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    isActive: Joi.boolean().optional()
  })
})

// Tạo mới một Schedule cho Quest
const createSchedule = Joi.object({
  body: Joi.object({
    scheduleType: Joi.string().valid('ONE_TIME', 'RECURRING').required(),
    timezone: Joi.string().trim().max(100).required(),
    startAt: Joi.date().iso().required(),
    endAt: Joi.date().iso().greater(Joi.ref('startAt')).allow(null).optional(),
    recurrenceRule: Joi.when('scheduleType', {
      is: 'RECURRING',
      then: Joi.object({
        frequency: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY').required(),
        interval: Joi.number().integer().min(1).default(1),
        daysOfWeek: Joi.array().items(Joi.number().integer().min(0).max(6)).optional(),
        timeOfDay: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).optional()
      }).required(),
      otherwise: Joi.forbidden()
    })
  }).unknown(false),
  params: Joi.object({
    questId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Cập nhật thông tin Schedule
const updateSchedule = Joi.object({
  body: Joi.object({
    scheduleType: Joi.string().valid('ONE_TIME', 'RECURRING').optional(),
    timezone: Joi.string().trim().max(100).optional(),
    startAt: Joi.date().iso().optional(),
    endAt: Joi.date().iso().allow(null).optional(),
    recurrenceRule: Joi.object({
      frequency: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY').required(),
      interval: Joi.number().integer().min(1).default(1),
      daysOfWeek: Joi.array().items(Joi.number().integer().min(0).max(6)).optional(),
      timeOfDay: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).optional()
    }).allow(null).optional(),
    isActive: Joi.boolean().optional()
  })
    .min(1)
    .unknown(false),
  params: Joi.object({
    scheduleId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Vô hiệu hóa (Deactivate) Schedule
const deactivateSchedule = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    scheduleId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

export const schedulesValidation = {
  getSchedulesByQuestId,
  createSchedule,
  updateSchedule,
  deactivateSchedule
}
