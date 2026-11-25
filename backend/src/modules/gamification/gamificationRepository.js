import prisma from '../../config/database.js'

// Lấy thông tin gamification của User
const findUserGamification = async (userId, tx) => {
  const db = tx || prisma
  return await db.userGamification.findUnique({
    where: {
      userId
    }
  })
}

// Khởi tạo bản ghi gamification nếu chưa có
const createUserGamification = async (userId, tx) => {
  const db = tx || prisma
  return await db.userGamification.create({
    data: {
      userId,
      totalXp: BigInt(0),
      level: 1,
      coinBalance: BigInt(0)
    }
  })
}

// Lấy lịch sử giao dịch XP có phân trang
const findXpTransactions = async (userId, { skip = 0, take = 20, sourceType }, tx) => {
  const db = tx || prisma
  const where = {
    userId
  }

  if (sourceType) {
    where.sourceType = sourceType
  }

  const [transactions, total] = await Promise.all([
    db.xpTransaction.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc'
      }
    }),
    db.xpTransaction.count({ where })
  ])

  return { transactions, total }
}

// Lấy lịch sử giao dịch Coin có phân trang
const findCoinTransactions = async (userId, { skip = 0, take = 20, transactionType, sourceType }, tx) => {
  const db = tx || prisma
  const where = {
    userId
  }

  if (transactionType) {
    where.transactionType = transactionType
  }

  if (sourceType) {
    where.sourceType = sourceType
  }

  const [transactions, total] = await Promise.all([
    db.coinTransaction.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc'
      }
    }),
    db.coinTransaction.count({ where })
  ])

  return { transactions, total }
}

// Tạo giao dịch XP
const createXpTransaction = async (data, tx) => {
  const db = tx || prisma
  return await db.xpTransaction.create({
    data: {
      userId: data.userId,
      amount: data.amount,
      sourceType: data.sourceType,
      sourceId: data.sourceId || null,
      idempotencyKey: data.idempotencyKey,
      description: data.description || null
    }
  })
}

// Tạo giao dịch Coin
const createCoinTransaction = async (data, tx) => {
  const db = tx || prisma
  return await db.coinTransaction.create({
    data: {
      userId: data.userId,
      amount: BigInt(data.amount),
      transactionType: data.transactionType,
      sourceType: data.sourceType,
      sourceId: data.sourceId || null,
      idempotencyKey: data.idempotencyKey,
      description: data.description || null
    }
  })
}

export const gamificationRepository = {
  findUserGamification,
  createUserGamification,
  findXpTransactions,
  findCoinTransactions,
  createXpTransaction,
  createCoinTransaction
}
