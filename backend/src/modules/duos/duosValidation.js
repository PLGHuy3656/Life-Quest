import Joi from 'joi'

// Lấy danh sách Duo
const getDuos = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    status: Joi.string().valid('PENDING', 'ACTIVE', 'COMPLETED', 'DISBANDED').optional()
  })
})

// Tạo Duo mới
const createDuo = Joi.object({
  body: Joi.object({
    partnerId: Joi.string().uuid().required(),
    ruleId: Joi.string().uuid().optional().allow(null)
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

// Kiểm tra duoId trong param
const duoIdParam = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    duoId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Mời lại đối tác vào Duo
const invitePartner = Joi.object({
  body: Joi.object({
    partnerId: Joi.string().uuid().required()
  }),
  params: Joi.object({
    duoId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Xử lý lời mời theo memberId trong param
const duoMemberParam = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    duoId: Joi.string().uuid().required(),
    memberId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

export const duosValidation = {
  getDuos,
  createDuo,
  duoIdParam,
  invitePartner,
  duoMemberParam
}
