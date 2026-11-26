import Joi from 'joi'

// Tạo báo cáo vi phạm
const createReport = Joi.object({
  body: Joi.object({
    targetType: Joi.string().valid('USER', 'POST', 'COMMENT').required(),
    targetId: Joi.string().uuid().required(),
    reason: Joi.string().trim().max(100).required(),
    description: Joi.string().trim().max(1000).optional().allow(null, '')
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

// Xử lý báo cáo vi phạm
const updateReportStatus = Joi.object({
  body: Joi.object({
    status: Joi.string().valid('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED').required()
  }),
  params: Joi.object({
    reportId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Cập nhật trạng thái người dùng
const updateUserStatus = Joi.object({
  body: Joi.object({
    status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'BANNED').required()
  }),
  params: Joi.object({
    userId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Lấy danh sách người dùng cho Admin
const getUsers = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().optional(),
    q: Joi.string().trim().optional().allow('')
  })
})

// Lấy danh sách báo cáo
const getReports = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED').optional(),
    targetType: Joi.string().valid('USER', 'POST', 'COMMENT').optional()
  })
})

// Tạo mới Achievement
const createAchievement = Joi.object({
  body: Joi.object({
    code: Joi.string().trim().max(80).required(),
    name: Joi.string().trim().max(150).required(),
    description: Joi.string().trim().max(1000).optional().allow(null, ''),
    type: Joi.string().trim().max(50).required(),
    conditionConfig: Joi.object().required(),
    rewardXp: Joi.number().integer().min(0).default(0),
    rewardCoin: Joi.number().integer().min(0).default(0),
    isHidden: Joi.boolean().default(false)
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

// Cập nhật Achievement
const updateAchievement = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().max(150).optional(),
    description: Joi.string().trim().max(1000).optional().allow(null, ''),
    conditionConfig: Joi.object().optional(),
    rewardXp: Joi.number().integer().min(0).optional(),
    rewardCoin: Joi.number().integer().min(0).optional(),
    isHidden: Joi.boolean().optional(),
    isActive: Joi.boolean().optional()
  }),
  params: Joi.object({
    achievementId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Kiểm tra achievementId trong param
const achievementIdParam = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    achievementId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Tạo mới Reward Item
const createReward = Joi.object({
  body: Joi.object({
    code: Joi.string().trim().max(80).required(),
    name: Joi.string().trim().max(150).required(),
    description: Joi.string().trim().max(1000).optional().allow(null, ''),
    category: Joi.string().trim().max(50).required(),
    priceCoin: Joi.number().integer().min(0).default(0),
    requiredLevel: Joi.number().integer().min(1).default(1),
    metadata: Joi.object().optional().allow(null)
  }),
  params: Joi.object().unknown(true).optional(),
  query: Joi.object().unknown(true).optional()
})

// Cập nhật Reward Item
const updateReward = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().max(150).optional(),
    description: Joi.string().trim().max(1000).optional().allow(null, ''),
    category: Joi.string().trim().max(50).optional(),
    priceCoin: Joi.number().integer().min(0).optional(),
    requiredLevel: Joi.number().integer().min(1).optional(),
    isActive: Joi.boolean().optional()
  }),
  params: Joi.object({
    rewardId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Kiểm tra rewardId trong param
const rewardIdParam = Joi.object({
  body: Joi.object().unknown(true).optional(),
  params: Joi.object({
    rewardId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

// Cập nhật Challenge status
const updateChallengeStatus = Joi.object({
  body: Joi.object({
    status: Joi.string().valid('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED').required()
  }),
  params: Joi.object({
    challengeId: Joi.string().uuid().required()
  }),
  query: Joi.object().unknown(true).optional()
})

export const adminValidation = {
  createReport,
  updateReportStatus,
  updateUserStatus,
  getUsers,
  getReports,
  createAchievement,
  updateAchievement,
  achievementIdParam,
  createReward,
  updateReward,
  rewardIdParam,
  updateChallengeStatus
}
