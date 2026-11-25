import Joi from 'joi'

// Lấy danh sách Execution của User theo bộ lọc
const getExecutions = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    questId: Joi.string().uuid().optional(),
    status: Joi.string().valid('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'ABANDONED').optional(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional()
  })
})

// Tạo mới một Execution
const createExecution = Joi.object({
  body: Joi.object({
    questId: Joi.string().uuid().required(),
    scheduleId: Joi.string().uuid().allow(null).optional(),
    scheduledAt: Joi.date().iso().allow(null).optional(),
    startImmediately: Joi.boolean().default(false).optional()
  }).unknown(false),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

// Lấy chi tiết Execution theo ID
const getExecutionById = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    executionId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Bắt đầu thực hiện Execution (PLANNED -> IN_PROGRESS)
const startExecution = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    executionId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Cập nhật tiến độ Execution
const updateProgress = Joi.object({
  body: Joi.object({
    progressValue: Joi.number().min(0).required(),
    durationSeconds: Joi.number().integer().min(0).optional()
  }).unknown(false),
  params: Joi.object({
    executionId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Hoàn thành Execution (IN_PROGRESS -> COMPLETED)
const completeExecution = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    executionId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Bỏ qua Execution (PLANNED -> SKIPPED)
const skipExecution = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    executionId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Từ bỏ Execution (IN_PROGRESS -> ABANDONED)
const abandonExecution = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    executionId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

export const executionsValidation = {
  getExecutions,
  createExecution,
  getExecutionById,
  startExecution,
  updateProgress,
  completeExecution,
  skipExecution,
  abandonExecution
}
