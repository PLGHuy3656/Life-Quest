import Joi from 'joi'


const getGoalsByUserId = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})


const getGoalById = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    goalId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })

})


const createGoal = Joi.object({
  body: Joi.object({
    userId: Joi.string().uuid().required(),
    title: Joi.string().min(3).max(250).required(),
    description: Joi.string().max(500).allow('').optional(),
    startDate: Joi.date().iso().required(),
    dueDate: Joi.date().iso().greater(Joi.ref('startDate')).required()

  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

export const goalsValidation = {
  getGoalsByUserId,
  getGoalById,
  createGoal
}
