import Joi from 'joi';

// Lấy dữ liệu Today theo ngày truy vấn
const getToday = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).message('Date must be in YYYY-MM-DD format').optional()
  })
});
const completeExecution = Joi.object({
  body: Joi.any().optional(),
  params: Joi.object({
    executionId: Joi.string().uuid().required()
  }),
  query: Joi.any().optional()
});
export const todayValidation = {
  getToday,
  completeExecution
};