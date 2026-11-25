import { StatusCodes } from 'http-status-codes'
import { duosService } from './duosService.js'

// Lấy danh sách Duo
const getDuos = async (req, res, next) => {
  try {
    const userId = req.user.id
    const duos = await duosService.getDuos(userId, req.query)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: duos
    })
  } catch (error) {
    next(error)
  }
}

// Tạo Duo mới
const createDuo = async (req, res, next) => {
  try {
    const userId = req.user.id
    const duo = await duosService.createDuo(userId, req.body)
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: duo
    })
  } catch (error) {
    next(error)
  }
}

// Chi tiết Duo theo ID
const getDuoById = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { duoId } = req.params
    const duo = await duosService.getDuoById(userId, duoId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: duo
    })
  } catch (error) {
    next(error)
  }
}

// Mời đối tác vào Duo
const invitePartner = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { duoId } = req.params
    const { partnerId } = req.body
    const result = await duosService.invitePartner(userId, duoId, partnerId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Chấp nhận lời mời tham gia Duo
const acceptDuoInvitation = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { duoId, memberId } = req.params
    const result = await duosService.acceptDuoInvitation(userId, duoId, memberId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Từ chối lời mời tham gia Duo
const rejectDuoInvitation = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { duoId, memberId } = req.params
    const result = await duosService.rejectDuoInvitation(userId, duoId, memberId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// Rời khỏi Duo
const leaveDuo = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { duoId } = req.params
    const result = await duosService.leaveDuo(userId, duoId)
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const duosController = {
  getDuos,
  createDuo,
  getDuoById,
  invitePartner,
  acceptDuoInvitation,
  rejectDuoInvitation,
  leaveDuo
}
