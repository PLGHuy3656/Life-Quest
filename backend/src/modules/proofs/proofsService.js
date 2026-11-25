import { proofsRepository } from './proofsRepository.js'
import { executionsRepository } from '../executions/executionsRepository.js'
import ApiError from '../../common/errors/ApiError.js'

// Lấy danh sách Proof hợp lệ của một Execution
const getProofsByExecutionId = async (userId, executionId) => {
  const execution = await executionsRepository.findExecutionById(executionId)

  if (!execution) {
    throw new ApiError(404, 'Execution not found', 'EXECUTION_NOT_FOUND')
  }

  if (execution.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to view proofs for this execution', 'EXECUTION_ACCESS_DENIED')
  }

  return await proofsRepository.findProofsByExecutionId(executionId)
}

// Tạo mới Proof cho Execution
const createProof = async (userId, executionId, proofData) => {
  const execution = await executionsRepository.findExecutionById(executionId)

  if (!execution) {
    throw new ApiError(404, 'Execution not found', 'EXECUTION_NOT_FOUND')
  }

  if (execution.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to add proofs to this execution', 'EXECUTION_ACCESS_DENIED')
  }

  if (['SKIPPED', 'ABANDONED'].includes(execution.status)) {
    throw new ApiError(400, `Cannot add proof to an execution with status ${execution.status}`, 'CANNOT_ADD_PROOF')
  }

  // Kiểm tra tệp Media tồn tại và thuộc sở hữu của User
  const media = await proofsRepository.findMediaById(proofData.mediaId)

  if (!media || media.deletedAt) {
    throw new ApiError(404, 'Media not found', 'MEDIA_NOT_FOUND')
  }

  if (media.ownerUserId !== userId) {
    throw new ApiError(403, 'You do not own this media file', 'MEDIA_ACCESS_DENIED')
  }

  return await proofsRepository.createProof({
    executionId,
    mediaId: proofData.mediaId,
    visibility: proofData.visibility || 'PRIVATE'
  })
}

// Xóa mềm Proof
const deleteProof = async (userId, proofId) => {
  const proof = await proofsRepository.findProofById(proofId)

  if (!proof || proof.deletedAt) {
    throw new ApiError(404, 'Proof not found', 'PROOF_NOT_FOUND')
  }

  if (proof.execution.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to delete this proof', 'PROOF_ACCESS_DENIED')
  }

  return await proofsRepository.softDeleteProof(proofId)
}

// Chia sẻ / cập nhật chế độ hiển thị Proof
const shareProof = async (userId, proofId, visibility) => {
  const proof = await proofsRepository.findProofById(proofId)

  if (!proof || proof.deletedAt) {
    throw new ApiError(404, 'Proof not found', 'PROOF_NOT_FOUND')
  }

  if (proof.execution.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to share this proof', 'PROOF_ACCESS_DENIED')
  }

  return await proofsRepository.updateProofVisibility(proofId, visibility)
}

export const proofsService = {
  getProofsByExecutionId,
  createProof,
  deleteProof,
  shareProof
}
