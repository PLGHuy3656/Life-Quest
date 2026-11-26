import prisma from '../../config/database.js'

// Tạo mới kế hoạch AI
const createAiPlan = async (userId, inputData, generatedPlan, model = 'gemini-1.5-flash') => {
  return await prisma.aiPlan.create({
    data: {
      userId,
      input: inputData,
      generatedPlan,
      status: 'DRAFT',
      model,
      version: '1.0'
    }
  })
}

// Tìm kế hoạch theo ID
const findAiPlanById = async (planId) => {
  return await prisma.aiPlan.findUnique({
    where: { id: planId }
  })
}

// Cập nhật kế hoạch
const updateAiPlan = async (planId, data) => {
  return await prisma.aiPlan.update({
    where: { id: planId },
    data
  })
}

// Lấy danh sách kế hoạch của User
const findUserAiPlans = async (userId) => {
  return await prisma.aiPlan.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })
}

export const aiPlansRepository = {
  createAiPlan,
  findAiPlanById,
  updateAiPlan,
  findUserAiPlans
}
