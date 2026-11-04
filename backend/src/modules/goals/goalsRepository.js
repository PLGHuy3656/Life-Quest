import Joi from 'joi'
import prisma from '../../config/database.js'

const GOAL_CREATE_SCHEMA = Joi.object({
  userId: Joi.string().uuid().required(),
  title: Joi.string().trim().min(3).max(100).required(),
  description: Joi.string().trim().max(500).allow('').optional(),
  startDate: Joi.date().iso().required(),
  dueDate: Joi.date().iso().required()
}).unknown(false)


// Chỉ định ra những fields mà chúng ta không muốn cho phép cập nhật trong hàm update()
const INVALID_UPDATE_FIELDS = [
  'id',
  'userId',
  'status',
  'createdAt',
  'updatedAt'
]

const validateGoalBeforeCreate = async (goalData) => {
  return await GOAL_CREATE_SCHEMA.validateAsync(goalData, {
    abortEarly: false
  })
}


// Lấy danh sách Goal của một người dùng cụ thể, sắp xếp theo thời gian tạo mới nhất.
const findGoalsByUserId = async (userId) => {
  return await prisma.goal.findMany ({
    where: {
      userId
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

// Tìm kiếm chi tiết một mục tiêu (Goal) theo ID.
const findGoalById = async (goalId) => {
  return await prisma.goal.findUnique({
    where: {
      id: goalId
    }
  })
}

// Tạo mới một mục tiêu (Goal) cho người dùng sau khi đã qua bước validation.
const createGoal = async (goalData) => {
  // validate dữ liệu trước khi gọi hàm create
  const validGoalData = await validateGoalBeforeCreate(goalData)

  return await prisma.goal.create({
    data: {
      userId: validGoalData.userId,
      title: validGoalData.title,
      description: validGoalData.description,
      startDate: validGoalData.startDate,
      dueDate: validGoalData.dueDate
    }
  })
}

export const goalsRepository = {
  findGoalsByUserId,
  findGoalById,
  createGoal
}

export {
  GOAL_CREATE_SCHEMA,
  INVALID_UPDATE_FIELDS
}