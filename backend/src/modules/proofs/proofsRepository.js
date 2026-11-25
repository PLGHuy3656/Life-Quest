import prisma from '../../config/database.js'

// Tìm kiếm Proof theo ID kèm thông tin Execution và Media
const findProofById = async (proofId, tx) => {
  const db = tx || prisma
  return await db.questProof.findUnique({
    where: {
      id: proofId
    },
    include: {
      execution: {
        include: {
          quest: true
        }
      },
      media: true
    }
  })
}

// Lấy danh sách Proof hợp lệ (chưa xóa mềm) của một Execution
const findProofsByExecutionId = async (executionId, tx) => {
  const db = tx || prisma
  return await db.questProof.findMany({
    where: {
      executionId,
      deletedAt: null
    },
    include: {
      media: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

// Tìm media theo ID để kiểm tra quyền sở hữu
const findMediaById = async (mediaId, tx) => {
  const db = tx || prisma
  return await db.media.findUnique({
    where: {
      id: mediaId
    }
  })
}

// Tạo mới một Proof
const createProof = async (proofData, tx) => {
  const db = tx || prisma
  return await db.questProof.create({
    data: {
      executionId: proofData.executionId,
      mediaId: proofData.mediaId,
      visibility: proofData.visibility || 'PRIVATE'
    },
    include: {
      media: true
    }
  })
}

// Xóa mềm Proof
const softDeleteProof = async (proofId, tx) => {
  const db = tx || prisma
  return await db.questProof.update({
    where: {
      id: proofId
    },
    data: {
      deletedAt: new Date()
    }
  })
}

// Cập nhật chế độ hiển thị Proof
const updateProofVisibility = async (proofId, visibility, tx) => {
  const db = tx || prisma
  return await db.questProof.update({
    where: {
      id: proofId
    },
    data: {
      visibility
    },
    include: {
      media: true
    }
  })
}

// Kiểm tra xem Execution có ít nhất một Proof hợp lệ hay không
const hasValidProof = async (executionId, tx) => {
  const db = tx || prisma
  const count = await db.questProof.count({
    where: {
      executionId,
      deletedAt: null
    }
  })
  return count > 0
}

export const proofsRepository = {
  findProofById,
  findProofsByExecutionId,
  findMediaById,
  createProof,
  softDeleteProof,
  updateProofVisibility,
  hasValidProof
}
