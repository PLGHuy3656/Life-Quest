import { StatusCodes } from 'http-status-codes'
import { executionsService } from './executionsService.js'

// Lấy danh sách Execution theo bộ lọc
const getExecutions = async (req, res, next) => {
  try {
    const userId = req.user.id
    const filters = req.query

    const executions = await executionsService.getExecutions(userId, filters)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: executions
    })
  } catch (error) {
    next(error)
  }
}

// Tạo mới một Execution
const createExecution = async (req, res, next) => {
  try {
    const userId = req.user.id
    const executionData = req.body

    const createdExecution = await executionsService.createExecution(userId, executionData)

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: createdExecution
    })
  } catch (error) {
    next(error)
  }
}

// Lấy chi tiết một Execution
const getExecutionById = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { executionId } = req.params

    const execution = await executionsService.getExecutionById(userId, executionId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: execution
    })
  } catch (error) {
    next(error)
  }
}

// Bắt đầu thực hiện Execution
const startExecution = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { executionId } = req.params

    const execution = await executionsService.startExecution(userId, executionId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: execution
    })
  } catch (error) {
    next(error)
  }
}

// Cập nhật tiến độ Execution
const updateProgress = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { executionId } = req.params
    const progressData = req.body

    const updatedExecution = await executionsService.updateProgress(userId, executionId, progressData)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: updatedExecution
    })
  } catch (error) {
    next(error)
  }
}

// Hoàn thành Execution
const completeExecution = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { executionId } = req.params

    const result = await executionsService.completeExecution(userId, executionId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Bỏ qua Execution
const skipExecution = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { executionId } = req.params

    const result = await executionsService.skipExecution(userId, executionId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Từ bỏ Execution
const abandonExecution = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { executionId } = req.params

    const result = await executionsService.abandonExecution(userId, executionId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const executionsController = {
  getExecutions,
  createExecution,
  getExecutionById,
  startExecution,
  updateProgress,
  completeExecution,
  skipExecution,
  abandonExecution
}
