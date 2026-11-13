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

// Schema kiểm tra dữ liệu trước khi cập nhật Quest.
const QUEST_UPDATE_SCHEMA = Joi.object({
  title: Joi.string().trim().min(3).max(100),
  description: Joi.string().trim().max(500).allow('')
})
  .min(1)
  .unknown(false)

// Validate dữ liệu Quest trước khi cập nhật.
const validateQuestBeforeUpdate = async (questData) => {
  return await QUEST_UPDATE_SCHEMA.validateAsync(questData, {
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

// Lấy thông tin một Quest theo ID.
const findQuestById = async (questId) => {
  return await prisma.quest.findUnique({
    where: {
      id: questId
    }
  })
}


// Cập nhật thông tin Quest
const updateQuest = async (questId, questData) => {
  const validQuestData = await validateQuestBeforeUpdate(questData)

  return await prisma.quest.update({
    where: {
      id: questId
    },
    data: validQuestData
  })
}

export const questsRepository = {
  findQuestsByUserId,
  createQuest,
  findQuestById,
  updateQuest
}

export {
  QUEST_CREATE_SCHEMA,
  QUEST_UPDATE_SCHEMA
}