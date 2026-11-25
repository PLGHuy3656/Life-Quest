import { gamificationRepository } from './gamificationRepository.js'

// Lấy tổng quan gamification của người dùng
const getGamificationMe = async (userId) => {
  let record = await gamificationRepository.findUserGamification(userId)

  if (!record) {
    record = await gamificationRepository.createUserGamification(userId)
  }

  const totalXp = Number(record.totalXp)
  const level = record.level
  const coinBalance = Number(record.coinBalance)

  // Tính ngưỡng XP cho cấp độ hiện tại và cấp độ tiếp theo (mỗi cấp 100 XP)
  const currentLevelBaseXp = (level - 1) * 100
  const nextLevelXp = level * 100
  const progressPercentage = Math.min(100, Math.max(0, Math.round(((totalXp - currentLevelBaseXp) / 100) * 100)))

  return {
    totalXp,
    level,
    coinBalance,
    currentLevelBaseXp,
    nextLevelXp,
    progressPercentage
  }
}

// Lấy lịch sử biến động XP của người dùng
const getXpTransactions = async (userId, query = {}) => {
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 20
  const skip = (page - 1) * limit

  const { transactions, total } = await gamificationRepository.findXpTransactions(userId, {
    skip,
    take: limit,
    sourceType: query.sourceType
  })

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  }
}

// Lấy lịch sử giao dịch Coin của người dùng
const getCoinTransactions = async (userId, query = {}) => {
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 20
  const skip = (page - 1) * limit

  const { transactions, total } = await gamificationRepository.findCoinTransactions(userId, {
    skip,
    take: limit,
    transactionType: query.transactionType,
    sourceType: query.sourceType
  })

  // Format amount từ BigInt sang Number để tuần tự hóa JSON sạch sẽ
  const formattedTransactions = transactions.map((t) => ({
    ...t,
    amount: Number(t.amount)
  }))

  return {
    transactions: formattedTransactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  }
}

export const gamificationService = {
  getGamificationMe,
  getXpTransactions,
  getCoinTransactions
}
