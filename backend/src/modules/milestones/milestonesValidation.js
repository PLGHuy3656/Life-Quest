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


export const milestonesValidation = {
  getMilestonesByGoalId
}
