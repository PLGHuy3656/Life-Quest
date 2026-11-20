import Joi from 'joi'

const getQuestsByUserId = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    userId: Joi.string().uuid().required(),
    status: Joi.string().valid('ACTIVE', 'ARCHIVED').optional(),
    goalId: Joi.string().uuid().optional(),
    milestoneId: Joi.string().uuid().optional(),
    search: Joi.string().trim().min(1).max(100).optional()
  })
})

// Validate dữ liệu khi tạo Quest.
const createQuest = Joi.object({
  body: Joi.object({
    userId: Joi.string().uuid().required(),
    goalId: Joi.string().uuid().allow(null).optional(),
    milestoneId: Joi.string().uuid().allow(null).optional(),
    title: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().max(500).allow('').optional(),
    type: Joi.string().valid('SIMPLE', 'QUANTITY', 'DURATION', 'PROGRESS', 'FOCUS').optional(),
    priority: Joi.number().integer().min(0).max(32767).optional(),
    proofRequirement: Joi.string().valid('NONE', 'OPTIONAL', 'REQUIRED').optional(),
    targetValue: Joi.number().positive().custom((value, helpers) => {
      if (Number(value.toFixed(2)) === value) {
        return value
      }
      return helpers.error('number.maxPrecision')
    }).messages({
      'number.maxPrecision': '{{#label}} must have at most 2 decimal places'
    }).allow(null).optional(),
    targetUnit: Joi.string().trim().max(50).allow('', null).optional(),
    estimatedDurationSeconds: Joi.number().integer().positive().allow(null).optional(),
    startAt: Joi.date().iso().allow(null).optional(),
    dueAt: Joi.date().iso().allow(null).optional()
  }).unknown(false),

  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})


const getQuestById = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    questId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})


// Validate dữ liệu khi cập nhật Quest.
// Validate dữ liệu khi cập nhật Quest.
const updateQuest = Joi.object({
  body: Joi.object({
    goalId: Joi.string().uuid().allow(null).optional(),
    milestoneId: Joi.string().uuid().allow(null).optional(),

    title: Joi.string().trim().min(3).max(100),
    description: Joi.string().trim().max(500).allow(''),
    type: Joi.string().valid('SIMPLE', 'QUANTITY', 'DURATION', 'PROGRESS', 'FOCUS'),
    priority: Joi.number().integer().min(0).max(32767),
    proofRequirement: Joi.string().valid('NONE', 'OPTIONAL', 'REQUIRED'),

    targetValue: Joi.number().positive().custom((value, helpers) => {
      if (Number(value.toFixed(2)) === value) {
        return value
      }
      return helpers.error('number.maxPrecision')
    }).messages({
      'number.maxPrecision': '{{#label}} must have at most 2 decimal places'
    }).allow(null).optional(),
    targetUnit: Joi.string().trim().max(50).allow('', null),
    estimatedDurationSeconds: Joi.number().integer().positive().allow(null),
    startAt: Joi.date().iso().allow(null),
    dueAt: Joi.date().iso().allow(null)
  }).min(1).unknown(false),
  params: Joi.object({
    questId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})

const deleteQuest = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    questId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})


const pinQuest = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    questId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})


const unpinQuest = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    questId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})

const archiveQuest = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    questId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})


const restoreQuest = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    questId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})


export const questsValidation = {
  getQuestsByUserId,
  createQuest,
  getQuestById,
  updateQuest,
  deleteQuest,
  pinQuest,
  unpinQuest,
  archiveQuest,
  restoreQuest
}