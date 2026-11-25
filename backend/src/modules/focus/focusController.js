import { StatusCodes } from 'http-status-codes'
import { focusService } from './focusService.js'

// Bắt đầu một phiên Focus mới cho Execution
const createFocusSession = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { executionId } = req.params

    const session = await focusService.createFocusSession(userId, executionId)

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: session
    })
  } catch (error) {
    next(error)
  }
}

// Lấy danh sách phiên Focus của một Execution
const getFocusSessionsByExecutionId = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { executionId } = req.params

    const sessions = await focusService.getFocusSessionsByExecutionId(userId, executionId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: sessions
    })
  } catch (error) {
    next(error)
  }
}

// Bắt đầu hoặc tiếp tục phiên Focus
const startFocusSession = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { focusSessionId } = req.params

    const session = await focusService.startFocusSession(userId, focusSessionId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: session
    })
  } catch (error) {
    next(error)
  }
}

// Tạm dừng phiên Focus
const pauseFocusSession = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { focusSessionId } = req.params

    const session = await focusService.pauseFocusSession(userId, focusSessionId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: session
    })
  } catch (error) {
    next(error)
  }
}

// Tiếp tục phiên Focus
const resumeFocusSession = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { focusSessionId } = req.params

    const session = await focusService.resumeFocusSession(userId, focusSessionId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: session
    })
  } catch (error) {
    next(error)
  }
}

// Ghi nhận gián đoạn phiên Focus
const interruptFocusSession = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { focusSessionId } = req.params
    const interruptData = req.body

    const session = await focusService.interruptFocusSession(userId, focusSessionId, interruptData)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: session
    })
  } catch (error) {
    next(error)
  }
}

// Hoàn tất phiên Focus
const completeFocusSession = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { focusSessionId } = req.params

    const session = await focusService.completeFocusSession(userId, focusSessionId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: session
    })
  } catch (error) {
    next(error)
  }
}

// Từ bỏ phiên Focus
const abandonFocusSession = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { focusSessionId } = req.params

    const session = await focusService.abandonFocusSession(userId, focusSessionId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: session
    })
  } catch (error) {
    next(error)
  }
}

export const focusController = {
  createFocusSession,
  getFocusSessionsByExecutionId,
  startFocusSession,
  pauseFocusSession,
  resumeFocusSession,
  interruptFocusSession,
  completeFocusSession,
  abandonFocusSession
}
