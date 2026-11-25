import { StatusCodes } from 'http-status-codes'
import { proofsService } from './proofsService.js'

// Lấy danh sách Proof của một Execution
const getProofsByExecutionId = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { executionId } = req.params

    const proofs = await proofsService.getProofsByExecutionId(userId, executionId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: proofs
    })
  } catch (error) {
    next(error)
  }
}

// Đính kèm Proof mới cho Execution
const createProof = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { executionId } = req.params
    const proofData = req.body

    const createdProof = await proofsService.createProof(userId, executionId, proofData)

    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: createdProof
    })
  } catch (error) {
    next(error)
  }
}

// Xóa mềm Proof
const deleteProof = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { proofId } = req.params

    const result = await proofsService.deleteProof(userId, proofId)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        id: result.id,
        deletedAt: result.deletedAt,
        message: 'Proof deleted successfully'
      }
    })
  } catch (error) {
    next(error)
  }
}

// Chia sẻ hoặc cập nhật chế độ hiển thị Proof
const shareProof = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { proofId } = req.params
    const { visibility } = req.body

    const updatedProof = await proofsService.shareProof(userId, proofId, visibility)

    return res.status(StatusCodes.OK).json({
      success: true,
      data: updatedProof
    })
  } catch (error) {
    next(error)
  }
}

export const proofsController = {
  getProofsByExecutionId,
  createProof,
  deleteProof,
  shareProof
}
