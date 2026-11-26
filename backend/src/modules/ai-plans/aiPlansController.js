import { StatusCodes } from 'http-status-codes'
import { aiPlansService } from './aiPlansService.js'

// Yêu cầu AI tạo kế hoạch
const createAiPlan = async (req, res, next) => {
  try {
    const userId = req.user.id
    const plan = await aiPlansService.createAiPlan(userId, req.body)
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: plan
    })
  } catch (error) {
    next(error)
  }
}

// Chi tiết kế hoạch AI
const getAiPlanById = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { planId } = req.params
    const plan = await aiPlansService.getAiPlanById(userId, planId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: plan
    })
  } catch (error) {
    next(error)
  }
}

// Yêu cầu AI sinh lại kế hoạch
const regenerateAiPlan = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { planId } = req.params
    const { feedback } = req.body
    const plan = await aiPlansService.regenerateAiPlan(userId, planId, feedback)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: plan
    })
  } catch (error) {
    next(error)
  }
}

// Chỉnh sửa bản nháp kế hoạch
const updateAiPlan = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { planId } = req.params
    const { generatedPlan } = req.body
    const plan = await aiPlansService.updateAiPlan(userId, planId, generatedPlan)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: plan
    })
  } catch (error) {
    next(error)
  }
}

// Chấp nhận và áp dụng kế hoạch
const acceptAiPlan = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { planId } = req.params
    const result = await aiPlansService.acceptAiPlan(userId, planId)
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// Từ chối kế hoạch
const rejectAiPlan = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { planId } = req.params
    const result = await aiPlansService.rejectAiPlan(userId, planId)
    return res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const aiPlansController = {
  createAiPlan,
  getAiPlanById,
  regenerateAiPlan,
  updateAiPlan,
  acceptAiPlan,
  rejectAiPlan
}
