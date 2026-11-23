import prisma from "../../config/database.js";
import Joi from 'joi';
import ApiError from "../../common/errors/ApiError.js";

// Schema kiểm tra dữ liệu trước khi tạo Quest.
const QUEST_CREATE_SCHEMA = Joi.object({
  userId: Joi.string().uuid().required(),
  goalId: Joi.string().uuid().allow(null).optional(),
  milestoneId: Joi.string().uuid().allow(null).optional(),
  title: Joi.string().trim().min(3).max(100).required(),
  description: Joi.string().trim().max(500).allow('').optional(),
  type: Joi.string().valid('SIMPLE', 'QUANTITY', 'DURATION', 'PROGRESS', 'FOCUS').optional(),
  priority: Joi.number().integer().min(0).max(32767).optional(),
  proofRequirement: Joi.string().valid('NONE', 'OPTIONAL', 'REQUIRED').optional(),
  targetValue: Joi.number().positive().custom((value, helpers) => {
    if (Number(value.toFixed(2)) === value) {
      return value;
    }
    return helpers.error('number.maxPrecision');
  }).messages({
    'number.maxPrecision': '{{#label}} must have at most 2 decimal places'
  }).allow(null).optional(),
  targetUnit: Joi.string().trim().max(50).allow('', null).optional(),
  estimatedDurationSeconds: Joi.number().integer().positive().allow(null).optional(),
  startAt: Joi.date().iso().allow(null).optional(),
  dueAt: Joi.date().iso().allow(null).optional()
}).unknown(false);

// Validate dữ liệu Quest trước khi tạo.
const validateQuestBeforeCreate = async questData => {
  try {
    return await QUEST_CREATE_SCHEMA.validateAsync(questData, {
      abortEarly: false
    });
  } catch (error) {
    if (error instanceof Joi.ValidationError) {
      throw new ApiError(400, error.details[0].message, 'VALIDATION_ERROR');
    }
    throw error;
  }
};

// Schema kiểm tra dữ liệu trước khi cập nhật Quest.
const QUEST_UPDATE_SCHEMA = Joi.object({
  goalId: Joi.string().uuid().allow(null).optional(),
  milestoneId: Joi.string().uuid().allow(null).optional(),
  title: Joi.string().trim().min(3).max(100),
  description: Joi.string().trim().max(500).allow(''),
  type: Joi.string().valid('SIMPLE', 'QUANTITY', 'DURATION', 'PROGRESS', 'FOCUS'),
  priority: Joi.number().integer().min(0).max(32767),
  proofRequirement: Joi.string().valid('NONE', 'OPTIONAL', 'REQUIRED'),
  targetValue: Joi.number().positive().custom((value, helpers) => {
    if (Number(value.toFixed(2)) === value) {
      return value;
    }
    return helpers.error('number.maxPrecision');
  }).messages({
    'number.maxPrecision': '{{#label}} must have at most 2 decimal places'
  }).allow(null).optional(),
  targetUnit: Joi.string().trim().max(50).allow('', null),
  estimatedDurationSeconds: Joi.number().integer().positive().allow(null),
  startAt: Joi.date().iso().allow(null),
  dueAt: Joi.date().iso().allow(null)
}).min(1).unknown(false);

// Validate dữ liệu Quest trước khi cập nhật.
const validateQuestBeforeUpdate = async questData => {
  try {
    return await QUEST_UPDATE_SCHEMA.validateAsync(questData, {
      abortEarly: false
    });
  } catch (error) {
    if (error instanceof Joi.ValidationError) {
      throw new ApiError(400, error.details[0].message, 'VALIDATION_ERROR');
    }
    throw error;
  }
};
const findQuestsByUserId = async (userId, filters = {}) => {
  const where = {
    userId,
    deletedAt: null,
    status: filters.status || 'ACTIVE'
  };
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.goalId) {
    where.goalId = filters.goalId;
  }
  if (filters.milestoneId) {
    where.milestoneId = filters.milestoneId;
  }
  if (filters.search) {
    where.title = {
      contains: filters.search,
      mode: 'insensitive' // Không phân biệt chữ hoa chữ thường
    };
  }
  return await prisma.quest.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    }
  });
};

// Tạo mới Quest sau khi dữ liệu đã qua validation.
const createQuest = async questData => {
  const validQuestData = await validateQuestBeforeCreate(questData);
  return await prisma.quest.create({
    data: {
      userId: validQuestData.userId,
      goalId: validQuestData.goalId,
      milestoneId: validQuestData.milestoneId,
      title: validQuestData.title,
      description: validQuestData.description,
      type: validQuestData.type,
      priority: validQuestData.priority,
      proofRequirement: validQuestData.proofRequirement,
      targetValue: validQuestData.targetValue,
      targetUnit: validQuestData.targetUnit,
      estimatedDurationSeconds: validQuestData.estimatedDurationSeconds,
      startAt: validQuestData.startAt,
      dueAt: validQuestData.dueAt
    }
  });
};

// Lấy thông tin một Quest theo ID.
const findQuestById = async questId => {
  return await prisma.quest.findUnique({
    where: {
      id: questId
    }
  });
};

// Cập nhật thông tin Quest
const updateQuest = async (questId, questData) => {
  const validQuestData = await validateQuestBeforeUpdate(questData);
  return await prisma.quest.update({
    where: {
      id: questId
    },
    data: validQuestData
  });
};
const deleteQuest = async questId => {
  return await prisma.quest.update({
    where: {
      id: questId
    },
    data: {
      deletedAt: new Date()
    }
  });
};
const pinQuest = async questId => {
  return await prisma.quest.update({
    where: {
      id: questId
    },
    data: {
      isPinned: true
    }
  });
};
const unpinQuest = async questId => {
  return await prisma.quest.update({
    where: {
      id: questId
    },
    data: {
      isPinned: false
    }
  });
};
const archiveQuest = async questId => {
  return await prisma.$transaction(async tx => {
    // Vô hiệu hóa tất cả các Schedule đang active của Quest trong cùng transaction
    await tx.questSchedule.updateMany({
      where: {
        questId,
        isActive: true
      },
      data: {
        isActive: false
      }
    });
    return await tx.quest.update({
      where: {
        id: questId
      },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date()
      }
    });
  });
};
const restoreQuest = async questId => {
  return await prisma.quest.update({
    where: {
      id: questId
    },
    data: {
      status: 'ACTIVE',
      archivedAt: null
    }
  });
};
export const questsRepository = {
  findQuestsByUserId,
  createQuest,
  findQuestById,
  updateQuest,
  deleteQuest,
  pinQuest,
  unpinQuest,
  archiveQuest,
  restoreQuest
};
export { QUEST_CREATE_SCHEMA, QUEST_UPDATE_SCHEMA };