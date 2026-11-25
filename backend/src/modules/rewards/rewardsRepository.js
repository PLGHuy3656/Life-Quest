import prisma from '../../config/database.js'
import { randomUUID } from 'crypto'

// Tìm tất cả các vật phẩm phần thưởng đang mở bán
const findActiveRewards = async ({ category } = {}) => {
  const where = {
    isActive: true
  }

  if (category) {
    where.category = category
  }

  return await prisma.rewardItem.findMany({
    where,
    include: {
      media: true
    },
    orderBy: [
      { requiredLevel: 'asc' },
      { priceCoin: 'asc' }
    ]
  })
}

// Tìm vật phẩm theo ID
const findRewardById = async (rewardId) => {
  return await prisma.rewardItem.findUnique({
    where: {
      id: rewardId
    },
    include: {
      media: true
    }
  })
}

// Tìm kho đồ của người dùng
const findUserInventory = async (userId, { category, isEquipped } = {}) => {
  const where = {
    userId
  }

  if (category) {
    where.rewardItem = {
      category
    }
  }

  if (isEquipped !== undefined) {
    where.equippedAt = isEquipped ? { not: null } : null
  }

  return await prisma.userInventory.findMany({
    where,
    include: {
      rewardItem: {
        include: {
          media: true
        }
      }
    },
    orderBy: {
      purchasedAt: 'desc'
    }
  })
}

// Tìm một món đồ trong kho đồ theo inventory itemId
const findInventoryItemById = async (userId, itemId) => {
  return await prisma.userInventory.findFirst({
    where: {
      id: itemId,
      userId
    },
    include: {
      rewardItem: {
        include: {
          media: true
        }
      }
    }
  })
}

// Tìm món đồ trong kho đồ theo rewardItemId
const findUserInventoryByRewardId = async (userId, rewardItemId, tx) => {
  const db = tx || prisma
  return await db.userInventory.findUnique({
    where: {
      userId_rewardItemId: {
        userId,
        rewardItemId
      }
    }
  })
}

// Giao dịch mua vật phẩm Atomic
const purchaseRewardAtomic = async (userId, rewardItem) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Lấy thông tin gamification của User
    let gamification = await tx.userGamification.findUnique({
      where: { userId }
    })

    if (!gamification) {
      gamification = await tx.userGamification.create({
        data: {
          userId,
          totalXp: BigInt(0),
          level: 1,
          coinBalance: BigInt(0)
        }
      })
    }

    // 2. Trừ coin người dùng
    const updatedGamification = await tx.userGamification.update({
      where: { userId },
      data: {
        coinBalance: {
          decrement: rewardItem.priceCoin
        }
      }
    })

    // 3. Ghi lại CoinTransaction
    await tx.coinTransaction.create({
      data: {
        userId,
        amount: -rewardItem.priceCoin,
        type: 'SPENT',
        reason: `Mua vật phẩm: ${rewardItem.name}`,
        refType: 'REWARD_ITEM',
        refId: rewardItem.id,
        idempotencyKey: randomUUID()
      }
    })

    // 4. Thêm vào kho đồ UserInventory
    const inventoryItem = await tx.userInventory.create({
      data: {
        userId,
        rewardItemId: rewardItem.id,
        quantity: 1
      },
      include: {
        rewardItem: {
          include: {
            media: true
          }
        }
      }
    })

    return {
      inventoryItem,
      newBalance: updatedGamification.coinBalance
    }
  })
}

// Trang bị vật phẩm (Atomic: gỡ các vật phẩm cùng category nếu có)
const equipItemAtomic = async (userId, inventoryItem) => {
  return await prisma.$transaction(async (tx) => {
    const category = inventoryItem.rewardItem.category

    // Gỡ trang bị toàn bộ vật phẩm cùng loại (category) trong kho đồ của user
    await tx.userInventory.updateMany({
      where: {
        userId,
        rewardItem: {
          category
        },
        equippedAt: {
          not: null
        }
      },
      data: {
        equippedAt: null
      }
    })

    // Trang bị vật phẩm hiện tại
    const updated = await tx.userInventory.update({
      where: {
        id: inventoryItem.id
      },
      data: {
        equippedAt: new Date()
      },
      include: {
        rewardItem: {
          include: {
            media: true
          }
        }
      }
    })

    return updated
  })
}

// Gỡ trang bị vật phẩm
const unequipItem = async (userId, itemId) => {
  return await prisma.userInventory.update({
    where: {
      id: itemId,
      userId
    },
    data: {
      equippedAt: null
    },
    include: {
      rewardItem: {
        include: {
          media: true
        }
      }
    }
  })
}

export const rewardsRepository = {
  findActiveRewards,
  findRewardById,
  findUserInventory,
  findInventoryItemById,
  findUserInventoryByRewardId,
  purchaseRewardAtomic,
  equipItemAtomic,
  unequipItem
}
