import React, { createContext, useContext, useState, useEffect } from 'react'
import { Player, Quest, FoxState, WardrobeItem, Difficulty, QuestType, QuestCategory } from '../types'
import confetti from 'canvas-confetti'

const INITIAL_PLAYER: Player = {
  id: 'u-1',
  username: 'adventurer',
  displayName: 'Hiệp sĩ Đời thực',
  avatar: '🦊',
  level: 4,
  totalXp: 1450,
  currentLevelXp: 250,
  nextLevelXp: 500,
  coins: 380,
  streak: 7,
  maxStreak: 12,
  completedQuestsCount: 28,
  stats: {
    str: 14,
    int: 18,
    dis: 16,
    cha: 11
  }
}

const INITIAL_FOX: FoxState = {
  name: 'Kitsu',
  mood: 'happy',
  affection: 68,
  speechBubble: 'Chào buổi sáng bạn hiền! Hôm nay ta cùng chinh phục nhiệm vụ nào!',
  equippedHat: 'straw_hat',
  equippedOutfit: 'apprentice_robe',
  equippedAccessory: 'wooden_staff'
}

const INITIAL_QUESTS: Quest[] = [
  {
    id: 'q-1',
    title: 'Tập thể dục buổi sáng 20 phút',
    description: 'Khởi động cơ thể, cardio nhẹ hoặc chống đẩy 3 hiệp',
    type: 'daily',
    difficulty: 'easy',
    xpReward: 35,
    coinReward: 15,
    completed: true,
    category: 'fitness',
    streak: 5,
    pinned: true
  },
  {
    id: 'q-2',
    title: 'Học 30 từ vựng tiếng Anh chuyên ngành',
    description: 'Sử dụng Anki hoặc Quizlet trong 25 phút',
    type: 'daily',
    difficulty: 'medium',
    xpReward: 60,
    coinReward: 25,
    completed: false,
    category: 'learning',
    streak: 7,
    pinned: true
  },
  {
    id: 'q-3',
    title: 'Uống đủ 2L nước tinh khiết',
    description: 'Cấp nước đầy đủ cho tế bào hoạt động hiệu quả',
    type: 'habit',
    difficulty: 'easy',
    xpReward: 20,
    coinReward: 10,
    completed: true,
    category: 'mindfulness',
    positive: true,
    streak: 14
  },
  {
    id: 'q-4',
    title: 'Không lướt TikTok sau 23h00',
    description: 'Thói quen ngủ sớm giúp hồi phục Mana & HP',
    type: 'habit',
    difficulty: 'medium',
    xpReward: 40,
    coinReward: 20,
    completed: false,
    category: 'mindfulness',
    positive: false,
    streak: 3
  },
  {
    id: 'q-5',
    title: 'Hoàn thiện giao diện LifeQuest Mobile',
    description: 'Thiết kế Mobile UI gamified mượt mà cho đồ án thực tế',
    type: 'quest',
    difficulty: 'hard',
    xpReward: 150,
    coinReward: 80,
    completed: false,
    category: 'work',
    pinned: true,
    dueDate: 'Hôm nay'
  },
  {
    id: 'q-6',
    title: 'Đánh bại Trùm Trì Hoãn (Boss: Procrastination Demon)',
    description: 'Tập trung 90 phút liên tục với Pomodoro Focus Mode mà không xao nhãng',
    type: 'milestone',
    difficulty: 'boss',
    xpReward: 300,
    coinReward: 150,
    completed: false,
    category: 'work'
  }
]

const INITIAL_WARDROBE: WardrobeItem[] = [
  {
    id: 'straw_hat',
    name: 'Nón Rơm Phiêu Lưu',
    category: 'hat',
    price: 0,
    icon: '👒',
    color: '#D4A373',
    unlocked: true,
    equipped: true,
    description: 'Nón che nắng kinh điển của mọi nhà thám hiểm trẻ tuổi.',
    bonusText: '+5% Tốc độ hồi phục'
  },
  {
    id: 'wizard_hat',
    name: 'Mũ Pháp Sư Tinh Anh',
    category: 'hat',
    price: 150,
    icon: '🧙‍♂️',
    color: '#4361EE',
    unlocked: false,
    equipped: false,
    description: 'Tập trung tư tưởng cao độ, tăng XP khi làm việc trí não.',
    bonusText: '+10% XP học tập'
  },
  {
    id: 'golden_crown',
    name: 'Vương Miện Vương Giả',
    category: 'hat',
    price: 500,
    icon: '👑',
    color: '#FFD166',
    unlocked: false,
    equipped: false,
    description: 'Chỉ dành cho những hiệp sĩ kiên trì giữ streak trên 30 ngày.',
    bonusText: '+15% Vàng thưởng'
  },
  {
    id: 'apprentice_robe',
    name: 'Áo Choàng Tân Thủ',
    category: 'outfit',
    price: 0,
    icon: '🥋',
    color: '#2A9D8F',
    unlocked: true,
    equipped: true,
    description: 'Trang phục thoải mái, thích hợp vận động hàng ngày.',
    bonusText: '+5% XP thói quen'
  },
  {
    id: 'cyber_jacket',
    name: 'Áo Khoác Cyberpunk Neon',
    category: 'outfit',
    price: 220,
    icon: '🥼',
    color: '#F72585',
    unlocked: false,
    equipped: false,
    description: 'Công nghệ cao hỗ trợ tập trung và chống xao nhãng.',
    bonusText: '+10% Tập trung Pomodoro'
  },
  {
    id: 'wooden_staff',
    name: 'Gậy Gỗ Tập Sự',
    category: 'accessory',
    price: 0,
    icon: '🦯',
    color: '#8D6E63',
    unlocked: true,
    equipped: true,
    description: 'Vũ khí cơ bản để xua đuổi những cơn lười biếng.',
    bonusText: '+2 STR'
  },
  {
    id: 'flame_blade',
    name: 'Kiếm Lửa Ý Chí',
    category: 'accessory',
    price: 350,
    icon: '🗡️',
    color: '#E63946',
    unlocked: false,
    equipped: false,
    description: 'Ngọn lửa nhiệt huyết không bao giờ tắt trước mọi khó khăn.',
    bonusText: '+5 STR, +10% Boss DMG'
  }
]

interface StoreContextType {
  player: Player
  fox: FoxState
  quests: Quest[]
  wardrobe: WardrobeItem[]
  toggleQuest: (id: string) => void
  addQuest: (quest: Omit<Quest, 'id' | 'completed'>) => void
  deleteQuest: (id: string) => void
  petFox: () => void
  buyItem: (item: WardrobeItem) => boolean
  equipItem: (item: WardrobeItem) => void
  recordFocusSession: (minutes: number) => void
  resetToDefaults: () => void
}

const StoreContext = createContext<StoreContextType | null>(null)

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [player, setPlayer] = useState<Player>(() => {
    const saved = localStorage.getItem('lifequest_mobile_player')
    return saved ? JSON.parse(saved) : INITIAL_PLAYER
  })

  const [fox, setFox] = useState<FoxState>(() => {
    const saved = localStorage.getItem('lifequest_mobile_fox')
    return saved ? JSON.parse(saved) : INITIAL_FOX
  })

  const [quests, setQuests] = useState<Quest[]>(() => {
    const saved = localStorage.getItem('lifequest_mobile_quests')
    return saved ? JSON.parse(saved) : INITIAL_QUESTS
  })

  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(() => {
    const saved = localStorage.getItem('lifequest_mobile_wardrobe')
    return saved ? JSON.parse(saved) : INITIAL_WARDROBE
  })

  useEffect(() => {
    localStorage.setItem('lifequest_mobile_player', JSON.stringify(player))
  }, [player])

  useEffect(() => {
    localStorage.setItem('lifequest_mobile_fox', JSON.stringify(fox))
  }, [fox])

  useEffect(() => {
    localStorage.setItem('lifequest_mobile_quests', JSON.stringify(quests))
  }, [quests])

  useEffect(() => {
    localStorage.setItem('lifequest_mobile_wardrobe', JSON.stringify(wardrobe))
  }, [wardrobe])

  // Fire confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#F26B3A', '#F6C85F', '#168C78', '#16324A']
      })
    } catch {
      // Fallback if canvas is not ready
    }
  }

  const triggerLevelUpConfetti = () => {
    try {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FFA500', '#FF4500', '#00E5FF']
      })
    } catch {}
  }

  const toggleQuest = (id: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q
        const nextCompleted = !q.completed

        if (nextCompleted) {
          triggerConfetti()

          // Calculate XP and Coins
          setPlayer((currPlayer) => {
            const addedXp = q.xpReward
            const addedCoins = q.coinReward
            let newTotalXp = currPlayer.totalXp + addedXp
            let newCurrentXp = currPlayer.currentLevelXp + addedXp
            let newLevel = currPlayer.level
            let newNextXp = currPlayer.nextLevelXp

            // Check Level Up
            if (newCurrentXp >= newNextXp) {
              newLevel += 1
              newCurrentXp -= newNextXp
              newNextXp = Math.round(newNextXp * 1.3)
              triggerLevelUpConfetti()
            }

            // Stat improvement based on category
            const newStats = { ...currPlayer.stats }
            if (q.category === 'fitness') newStats.str += 1
            if (q.category === 'learning') newStats.int += 1
            if (q.category === 'mindfulness') newStats.dis += 1
            if (q.category === 'social') newStats.cha += 1

            return {
              ...currPlayer,
              level: newLevel,
              totalXp: newTotalXp,
              currentLevelXp: newCurrentXp,
              nextLevelXp: newNextXp,
              coins: currPlayer.coins + addedCoins,
              completedQuestsCount: currPlayer.completedQuestsCount + 1,
              stats: newStats
            }
          })

          // Fox mascot reacts enthusiastically!
          setFox((f) => ({
            ...f,
            mood: 'cheering',
            affection: Math.min(100, f.affection + 4),
            speechBubble: `Tuyệt vời quá! Bạn vừa nhận +${q.xpReward} XP và +${q.coinReward} Vàng!`
          }))
        }

        return { ...q, completed: nextCompleted }
      })
    )
  }

  const addQuest = (questData: Omit<Quest, 'id' | 'completed'>) => {
    const newQuest: Quest = {
      ...questData,
      id: `q-${Date.now()}`,
      completed: false
    }
    setQuests((prev) => [newQuest, ...prev])
    setFox((f) => ({
      ...f,
      mood: 'playful',
      speechBubble: `Nhiệm vụ mới "${newQuest.title}" đã được ghi vào sổ phiêu lưu!`
    }))
  }

  const deleteQuest = (id: string) => {
    setQuests((prev) => prev.filter((q) => q.id !== id))
  }

  const petFox = () => {
    setFox((prev) => {
      const newAffection = Math.min(100, prev.affection + 5)
      const lines = [
        'Yay! Cảm ơn bạn xoa đầu tớ, cảm thấy tràn trề năng lượng!',
        'Gâu! Kitsu sẽ luôn đồng hành cùng bạn tới đích!',
        'Hôm nay chúng ta sẽ hoàn thành 100% mục tiêu chứ?',
        'Tớ thích nhất là lúc thấy bạn bấm hoàn thành nhiệm vụ!',
        'Thả tim! Cùng giữ streak 7 ngày liên tiếp nào!'
      ]
      const randomLine = lines[Math.floor(Math.random() * lines.length)]
      return {
        ...prev,
        mood: 'happy',
        affection: newAffection,
        speechBubble: randomLine
      }
    })
    triggerConfetti()
  }

  const buyItem = (item: WardrobeItem): boolean => {
    if (player.coins < item.price) {
      setFox((f) => ({
        ...f,
        speechBubble: 'Chưa đủ Vàng rồi! Hãy hoàn thành thêm nhiệm vụ nhé hiệp sĩ!'
      }))
      return false
    }

    setPlayer((p) => ({
      ...p,
      coins: p.coins - item.price
    }))

    setWardrobe((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, unlocked: true } : i))
    )

    equipItem(item)
    triggerConfetti()
    setFox((f) => ({
      ...f,
      mood: 'happy',
      speechBubble: `Đã mở khóa và diện "${item.name}"! Nhìn Kitsu ngầu chưa nè!`
    }))
    return true
  }

  const equipItem = (item: WardrobeItem) => {
    setWardrobe((prev) =>
      prev.map((i) => {
        if (i.category === item.category) {
          return { ...i, equipped: i.id === item.id }
        }
        return i
      })
    )

    setFox((f) => {
      if (item.category === 'hat') return { ...f, equippedHat: item.id }
      if (item.category === 'outfit') return { ...f, equippedOutfit: item.id }
      if (item.category === 'accessory') return { ...f, equippedAccessory: item.id }
      return f
    })
  }

  const recordFocusSession = (minutes: number) => {
    const gainedXp = minutes * 5
    const gainedCoins = Math.round(minutes * 1.5)

    setPlayer((currPlayer) => {
      let newTotalXp = currPlayer.totalXp + gainedXp
      let newCurrentXp = currPlayer.currentLevelXp + gainedXp
      let newLevel = currPlayer.level
      let newNextXp = currPlayer.nextLevelXp

      if (newCurrentXp >= newNextXp) {
        newLevel += 1
        newCurrentXp -= newNextXp
        newNextXp = Math.round(newNextXp * 1.3)
        triggerLevelUpConfetti()
      }

      return {
        ...currPlayer,
        level: newLevel,
        totalXp: newTotalXp,
        currentLevelXp: newCurrentXp,
        nextLevelXp: newNextXp,
        coins: currPlayer.coins + gainedCoins,
        stats: {
          ...currPlayer.stats,
          dis: currPlayer.stats.dis + 1
        }
      }
    })

    triggerConfetti()
    setFox((f) => ({
      ...f,
      mood: 'cheering',
      speechBubble: `Phiên tập trung ${minutes} phút thành công xuất sắc! +${gainedXp} XP và +${gainedCoins} Vàng!`
    }))
  }

  const resetToDefaults = () => {
    setPlayer(INITIAL_PLAYER)
    setFox(INITIAL_FOX)
    setQuests(INITIAL_QUESTS)
    setWardrobe(INITIAL_WARDROBE)
    localStorage.clear()
  }

  return (
    <StoreContext.Provider
      value={{
        player,
        fox,
        quests,
        wardrobe,
        toggleQuest,
        addQuest,
        deleteQuest,
        petFox,
        buyItem,
        equipItem,
        recordFocusSession,
        resetToDefaults
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
