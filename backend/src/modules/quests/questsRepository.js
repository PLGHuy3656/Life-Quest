import prisma from '../../config/database.js'
import Joi from 'joi'


// Schema kiểm tra dữ liệu trước khi tạo Quest.
const QUEST_CREATE_SCHEMA = Joi.object({
  userId: Joi.string().uuid().required(),
  goalId: Joi.string().uuid().allow(null).optional(),
  milestoneId: Joi.string().uuid().allow(null).optional(),
  title: Joi.string().trim().min(3).max(100).required(),
  description: Joi.string().trim().max(500).allow('').optional()
}).unknown(false)

// Validate dữ liệu Quest trước khi tạo.
const validateQuestBeforeCreate = async (questData) => {
  return await QUEST_CREATE_SCHEMA.validateAsync(questData, {
    abortEarly: false
  })
}

const findQuestsByUserId = async (userId) => {
  return await prisma.quest.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

// Tạo mới Quest sau khi dữ liệu đã qua validation.
const createQuest = async (questData) => {
  const validQuestData = await validateQuestBeforeCreate(questData)

  return await prisma.quest.create({
    data: {
      userId: validQuestData.userId,
      goalId: validQuestData.goalId,
      milestoneId: validQuestData.milestoneId,
      title: validQuestData.title,
      description: validQuestData.description
    }
  })
}


export const questsRepository = {
  findQuestsByUserId,
  createQuest
}

export {
  QUEST_CREATE_SCHEMA
}