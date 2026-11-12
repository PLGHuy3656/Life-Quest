import Joi from 'joi'


// Lấy danh sách Milestone theo GoalId
const getMilestonesByGoalId = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    goalId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})


const createMilestone = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().min(1).max(255).required(),
    description: Joi.string().allow('', null).optional()
  }).required(),
  params: Joi.object({
    goalId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})


const getMilestonesById = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    milestoneId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})


const updateMilestone = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().min(1).max(255),
    description: Joi.string().allow('', null)
  }).min(1).required(),

  params: Joi.object({
    milestoneId: Joi.string().uuid().required()
  }),

  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})


const deleteMilestone = Joi.object({
  body: Joi.object().unknown(true).optional(),

  params: Joi.object({
    milestoneId: Joi.string().uuid().required()
  }),

  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})

export const milestonesValidation = {
  getMilestonesByGoalId,
  createMilestone,
  getMilestonesById,
  updateMilestone,
  deleteMilestone
}
