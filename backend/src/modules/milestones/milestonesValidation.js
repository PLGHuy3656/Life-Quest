import Joi from 'joi'


// Lấy danh sách Milestone theo GoalId
const getMilestonesByGoalId = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    goalId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})


const createMilestone = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().min(1).max(255).required(),
    description: Joi.string().allow('', null).optional()
  }).required(),
  params: Joi.object({
    goalId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})


const getMilestonesById = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    milestoneId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})


const updateMilestone = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().min(1).max(255),
    description: Joi.string().allow('', null)
  }).min(1).required(),

  params: Joi.object({
    milestoneId: Joi.string().uuid().required()
  }),

  query: Joi.object().unknown(true).optional()
})


const deleteMilestone = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    milestoneId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

const completeMilestone = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    milestoneId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})


const reorderMilestones = Joi.object({
  body: Joi.object({
    milestoneIds: Joi.array().items(Joi.string().uuid()).unique().required()
  }).required(),
  params: Joi.object({
    goalId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})


export const milestonesValidation = {
  getMilestonesByGoalId,
  createMilestone,
  getMilestonesById,
  updateMilestone,
  deleteMilestone,
  completeMilestone,
  reorderMilestones
}
