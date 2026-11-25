import prisma from '../../config/database.js'

// Lấy danh sách Duo của User
const findUserDuos = async (userId, { status } = {}) => {
  const where = {
    members: {
      some: {
        userId
      }
    }
  }

  if (status) {
    where.status = status
  }

  return await prisma.duo.findMany({
    where,
    include: {
      creator: {
        select: { id: true, username: true, profile: true }
      },
      rule: true,
      members: {
        include: {
          user: {
            select: { id: true, username: true, profile: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// Tìm Duo theo ID
const findDuoById = async (duoId) => {
  return await prisma.duo.findUnique({
    where: { id: duoId },
    include: {
      creator: {
        select: { id: true, username: true, profile: true }
      },
      rule: true,
      members: {
        include: {
          user: {
            select: { id: true, username: true, profile: true }
          }
        }
      }
    }
  })
}

// Tạo Duo mới và khởi tạo 2 thành viên
const createDuoWithMembers = async (createdBy, partnerId, ruleId) => {
  return await prisma.$transaction(async (tx) => {
    const duo = await tx.duo.create({
      data: {
        createdBy,
        ruleId: ruleId || null,
        status: 'PENDING',
        currentStreak: 0,
        longestStreak: 0
      }
    })

    // Thành viên tạo (đã ACCEPTED)
    await tx.duoMember.create({
      data: {
        duoId: duo.id,
        userId: createdBy,
        status: 'ACCEPTED'
      }
    })

    // Đối tác (ở trạng thái INVITED)
    await tx.duoMember.create({
      data: {
        duoId: duo.id,
        userId: partnerId,
        status: 'INVITED'
      }
    })

    return await tx.duo.findUnique({
      where: { id: duo.id },
      include: {
        creator: {
          select: { id: true, username: true, profile: true }
        },
        rule: true,
        members: {
          include: {
            user: {
              select: { id: true, username: true, profile: true }
            }
          }
        }
      }
    })
  })
}

// Tìm thành viên trong Duo theo duoId và userId
const findDuoMember = async (duoId, userId) => {
  return await prisma.duoMember.findUnique({
    where: {
      duoId_userId: {
        duoId,
        userId
      }
    }
  })
}

// Tìm thành viên theo memberId
const findDuoMemberById = async (memberId) => {
  return await prisma.duoMember.findUnique({
    where: { id: memberId },
    include: {
      duo: true
    }
  })
}

// Cập nhật trạng thái thành viên Duo
const updateDuoMemberStatus = async (memberId, status) => {
  return await prisma.duoMember.update({
    where: { id: memberId },
    data: { status }
  })
}

// Cập nhật trạng thái phòng Duo
const updateDuoStatus = async (duoId, status) => {
  return await prisma.duo.update({
    where: { id: duoId },
    data: { status }
  })
}

// Thêm thành viên vào Duo
const addDuoMember = async (duoId, userId, status = 'INVITED') => {
  return await prisma.duoMember.upsert({
    where: {
      duoId_userId: {
        duoId,
        userId
      }
    },
    update: { status },
    create: {
      duoId,
      userId,
      status
    }
  })
}

export const duosRepository = {
  findUserDuos,
  findDuoById,
  createDuoWithMembers,
  findDuoMember,
  findDuoMemberById,
  updateDuoMemberStatus,
  updateDuoStatus,
  addDuoMember
}
