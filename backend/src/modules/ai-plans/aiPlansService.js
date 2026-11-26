import { aiPlansRepository } from './aiPlansRepository.js'
import prisma from '../../config/database.js'
import ApiError from '../../common/errors/ApiError.js'

// Hàm mô phỏng bộ sinh kế hoạch AI thông minh
const synthesizePlan = (input, feedback = null) => {
  const { prompt, timeframeDays = 30, dailyAvailableMinutes = 60, targetCategory = 'Phát triển bản thân' } = input

  return {
    title: `Lộ trình chinh phục: ${prompt}`,
    category: targetCategory,
    timeframeDays,
    dailyAvailableMinutes,
    feedbackNote: feedback ? `Đã điều chỉnh theo góp ý: ${feedback}` : undefined,
    goal: {
      title: `Hoàn thành mục tiêu: ${prompt}`,
      description: `Lộ trình chi tiết do AI thiết kế tối ưu trong ${timeframeDays} ngày, mỗi ngày dành khoảng ${dailyAvailableMinutes} phút.`,
      priority: 2
    },
    milestones: [
      {
        title: 'Giai đoạn 1: Khởi động & Xây dựng nền tảng',
        position: 1,
        quests: [
          {
            title: `Tìm hiểu kiến thức tổng quan về ${prompt}`,
            description: 'Đọc tài liệu, tìm hiểu các nguyên tắc cơ bản và chuẩn bị công cụ cần thiết.',
            priority: 2,
            type: 'SIMPLE',
            estimatedDurationSeconds: dailyAvailableMinutes * 60,
            xpReward: 50,
            coinReward: 20
          },
          {
            title: 'Lập danh sách việc cần làm cụ thể cho tuần đầu tiên',
            description: 'Lên checklist các hành động nhỏ cần thực hiện hằng ngày.',
            priority: 1,
            type: 'SIMPLE',
            estimatedDurationSeconds: 30 * 60,
            xpReward: 30,
            coinReward: 10
          }
        ]
      },
      {
        title: 'Giai đoạn 2: Thực hành & Tăng tốc',
        position: 2,
        quests: [
          {
            title: `Luyện tập chuyên sâu hàng ngày về ${prompt}`,
            description: 'Thực hành đều đặn theo khung giờ cố định.',
            priority: 3,
            type: 'FOCUS',
            estimatedDurationSeconds: dailyAvailableMinutes * 60,
            xpReward: 100,
            coinReward: 50
          }
        ]
      },
      {
        title: 'Giai đoạn 3: Đánh giá & Hoàn thiện mục tiêu',
        position: 3,
        quests: [
          {
            title: 'Tổng kết kết quả và ghi nhận thành tựu',
            description: 'Đối chiếu kết quả đạt được so với mục tiêu ban đầu đặt ra.',
            priority: 2,
            type: 'PROGRESS',
            estimatedDurationSeconds: 45 * 60,
            xpReward: 150,
            coinReward: 80
          }
        ]
      }
    ]
  }
}

// Yêu cầu AI sinh kế hoạch
const createAiPlan = async (userId, inputData) => {
  const generatedPlan = synthesizePlan(inputData)
  return await aiPlansRepository.createAiPlan(userId, inputData, generatedPlan)
}

// Lấy chi tiết kế hoạch theo ID
const getAiPlanById = async (userId, planId) => {
  const plan = await aiPlansRepository.findAiPlanById(planId)
  if (!plan || plan.userId !== userId) {
    throw new ApiError(404, 'AI Plan not found', 'PLAN_NOT_FOUND')
  }
  return plan
}

// Yêu cầu tái tạo kế hoạch dựa trên phản hồi
const regenerateAiPlan = async (userId, planId, feedback) => {
  const plan = await aiPlansRepository.findAiPlanById(planId)
  if (!plan || plan.userId !== userId) {
    throw new ApiError(404, 'AI Plan not found', 'PLAN_NOT_FOUND')
  }

  const newGeneratedPlan = synthesizePlan(plan.input, feedback)
  return await aiPlansRepository.updateAiPlan(planId, {
    generatedPlan: newGeneratedPlan,
    status: 'DRAFT'
  })
}

// Cập nhật bản nháp kế hoạch
const updateAiPlan = async (userId, planId, generatedPlan) => {
  const plan = await aiPlansRepository.findAiPlanById(planId)
  if (!plan || plan.userId !== userId) {
    throw new ApiError(404, 'AI Plan not found', 'PLAN_NOT_FOUND')
  }

  return await aiPlansRepository.updateAiPlan(planId, {
    generatedPlan
  })
}

// Chấp nhận và áp dụng kế hoạch vào Goal, Milestone, Quest thực tế
const acceptAiPlan = async (userId, planId) => {
  const plan = await aiPlansRepository.findAiPlanById(planId)
  if (!plan || plan.userId !== userId) {
    throw new ApiError(404, 'AI Plan not found', 'PLAN_NOT_FOUND')
  }

  const planData = plan.generatedPlan
  if (!planData || !planData.goal) {
    throw new ApiError(400, 'Invalid generated plan structure', 'INVALID_PLAN')
  }

  // Thực hiện transaction phân rã Goal, Milestone, Quests
  const createdGoal = await prisma.$transaction(async (tx) => {
    // 1. Tạo Goal
    const goal = await tx.goal.create({
      data: {
        userId,
        title: planData.goal.title,
        description: planData.goal.description,
        priority: planData.goal.priority || 0,
        status: 'IN_PROGRESS'
      }
    })

    // 2. Tạo Milestones và Quests nếu có
    if (Array.isArray(planData.milestones)) {
      for (const m of planData.milestones) {
        const milestone = await tx.milestone.create({
          data: {
            goalId: goal.id,
            title: m.title,
            position: m.position,
            status: 'PENDING'
          }
        })

        if (Array.isArray(m.quests)) {
          for (const q of m.quests) {
            await tx.quest.create({
              data: {
                userId,
                goalId: goal.id,
                milestoneId: milestone.id,
                title: q.title,
                description: q.description || null,
                priority: q.priority || 0,
                type: q.type || 'SIMPLE',
                status: 'TODO',
                estimatedDurationSeconds: q.estimatedDurationSeconds || null,
                xpReward: q.xpReward || 50,
                coinReward: q.coinReward || 20
              }
            })
          }
        }
      }
    }

    // 3. Đánh dấu AI Plan là APPLIED
    await tx.aiPlan.update({
      where: { id: planId },
      data: { status: 'APPLIED' }
    })

    return goal
  })

  return {
    success: true,
    message: 'AI plan applied successfully to your goals and quests',
    goalId: createdGoal.id
  }
}

// Từ chối kế hoạch AI
const rejectAiPlan = async (userId, planId) => {
  const plan = await aiPlansRepository.findAiPlanById(planId)
  if (!plan || plan.userId !== userId) {
    throw new ApiError(404, 'AI Plan not found', 'PLAN_NOT_FOUND')
  }

  await aiPlansRepository.updateAiPlan(planId, { status: 'REJECTED' })
  return { success: true, message: 'AI Plan rejected' }
}

export const aiPlansService = {
  createAiPlan,
  getAiPlanById,
  regenerateAiPlan,
  updateAiPlan,
  acceptAiPlan,
  rejectAiPlan
}
