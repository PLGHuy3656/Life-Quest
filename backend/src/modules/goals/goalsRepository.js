import Joi from 'joi'
import prisma from '../../config/database.js'

const GOAL_CREATE_SCHEMA = Joi.object({
  userId: Joi.string().uuid().required(),
  title: Joi.string().trim().min(3).max(100).required(),
  description: Joi.string().trim().max(500).allow('').optional(),
  startDate: Joi.date().iso().required(),
  dueDate: Joi.date().iso().greater(Joi.ref('startDate')).required()
}).unknown(false)


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

// Cập nhật thông tin mục tiêu theo ID.
const updateGoal = async (goalId, updateData) => {
  const validUpdateData = await Joi.object({
    title: Joi.string().trim().min(3).max(100),
    description: Joi.string().trim().max(500).allow(''),
    startDate: Joi.date().iso(),
    dueDate: Joi.date().iso()
  })
    // unknown(false): trong TH hiện tại nó có tác dụng là không cho update các field ngoài khai báo validate ở trên
    .unknown(false)
    .min(1)
    .validateAsync(updateData, {
      abortEarly: false
    })

  return await prisma.goal.update({
    where: {
      id: goalId
    },
    data: validUpdateData
  })
}


const pauseGoal = async (goalId) => {
  return await prisma.goal.update({
    where: {
      id: goalId
    },
    data: {
      status: 'PAUSED'
    }
  })
}


const resumeGoal = async (goalId) => {
  return await prisma.goal.update({
    where: {
      id: goalId
    },
    data: {
      status: 'ACTIVE'
    }
  })
}


const completeGoal = async (goalId) => {
  return await prisma.goal.update({
    where: {
      id: goalId
    },
    data: {
      status: 'COMPLETED'
    }
  })
}

const archiveGoal = async (goalId) => {
  return await prisma.goal.update({
    where: {
      id: goalId
    },
    data: {
      status: 'ARCHIVED'
    }
  })
}
export const goalsRepository = {
  findGoalsByUserId,
  findGoalById,
  createGoal,
  updateGoal,
  pauseGoal,
  resumeGoal,
  completeGoal,
  archiveGoal
}

export {
  GOAL_CREATE_SCHEMA
}