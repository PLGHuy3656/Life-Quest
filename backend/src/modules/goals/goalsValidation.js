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
    title: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().max(500).allow('').optional(),
    startDate: Joi.date().iso().required(),
    dueDate: Joi.date().iso().greater(Joi.ref('startDate')).required()

  }).unknown(false),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})


const updateGoal = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().min(3).max(100),
    description: Joi.string().trim().max(500).allow(''),
    startDate: Joi.date().iso(),
    dueDate: Joi.date().iso()
  })
    .min(1)
    .unknown(false),
  params: Joi.object({
    goalId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})


const pauseGoal = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    goalId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})


const resumeGoal = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    goalId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})


const completeGoal = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    goalId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})


const archiveGoal = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    goalId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    userId: Joi.string().uuid().required()
  })
})

export const goalsValidation = {
  getGoalsByUserId,
  getGoalById,
  createGoal,
  updateGoal,
  pauseGoal,
  resumeGoal,
  completeGoal,
  archiveGoal
}
