import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  Player,
  TaskItem,
  HabitItem,
  QuestItem,
  ScheduleItem,
  SocialFeedPost,
  FoxState,
  WardrobeItem,
  Category,
  Priority,
  QuestDifficulty
} from '../types'
import confetti from 'canvas-confetti'

const INITIAL_PLAYER: Player = {
  id: 'u-1',
  username: 'adventurer',
  displayName: 'Hiệp sĩ Đời thực',
  avatar: '🦊',
  level: 4,
  totalXp: 1680,
  currentLevelXp: 280,
  nextLevelXp: 500,
  coins: 450,
  streak: 7,
  stats: { str: 16, int: 19, dis: 17, cha: 12 },
  theme: 'light'
}

const INITIAL_TASKS: TaskItem[] = [
  {
    id: 't-1',
    title: 'Ôn tập 30 từ vựng chuyên ngành tiếng Anh',
    description: 'Dùng Anki hoặc Quizlet trong 25 phút',
    completed: true,
    dueDate: 'Hôm nay',
    priority: 'high',
    category: 'learning',
    xpReward: 60,
    coinReward: 25,
    isPinned: true
  },
  {
    id: 't-2',
    title: 'Chạy bộ 2.5km quanh công viên',
    description: 'Khởi động kỹ, duy trì nhịp tim vùng Zone 2',
    completed: false,
    dueDate: '17:30 Hôm nay',
    priority: 'medium',
    category: 'fitness',
    xpReward: 70,
    coinReward: 30,
    isPinned: true
  },
  {
    id: 't-3',
    title: 'Code hoàn thiện chức năng Mobile UI LifeQuest',
    description: 'Thiết kế giao diện đẹp mắt, tương thích cảm ứng di động',
    completed: false,
    dueDate: 'Hôm nay',
    priority: 'urgent',
    category: 'work',
    xpReward: 150,
    coinReward: 80,
    isPinned: true
  },
  {
    id: 't-4',
    title: 'Dọn dẹp bàn làm việc & phòng ngủ',
    completed: false,
    dueDate: 'Tối nay',
    priority: 'low',
    category: 'mindfulness',
    xpReward: 35,
    coinReward: 15
  }
]

const INITIAL_HABITS: HabitItem[] = [
  {
    id: 'h-1',
    title: 'Uống đủ 2L nước mỗi ngày',
    category: 'mindfulness',
    streak: 12,
    targetDaysPerWeek: 7,
    positiveCount: 4,
    negativeCount: 0,
    isPositiveOnly: true,
    xpReward: 15
  },
  {
    id: 'h-2',
    title: 'Đọc sách 20 trang trước khi ngủ',
    category: 'learning',
    streak: 6,
    targetDaysPerWeek: 5,
    positiveCount: 1,
    negativeCount: 0,
    isPositiveOnly: true,
    xpReward: 25
  },
  {
    id: 'h-3',
    title: 'Hạn chế đồ uống có đường / trà sữa',
    category: 'fitness',
    streak: 4,
    targetDaysPerWeek: 6,
    positiveCount: 2,
    negativeCount: 1,
    isPositiveOnly: false,
    xpReward: 20
  }
]

const INITIAL_QUESTS: QuestItem[] = [
  {
    id: 'q-1',
    title: 'Chinh phục Dự án Đồ án Thực tế (Software Engineering)',
    description: 'Hoàn thiện trọn bộ Backend, Desktop Web, và Mobile App với hệ thống RPG',
    difficulty: 'boss',
    category: 'work',
    progressPercent: 75,
    xpReward: 500,
    coinReward: 250,
    badgeIcon: '👑',
    isPinned: true,
    milestones: [
      { id: 'm-1', title: 'Thiết kế Database & Backend Prisma', completed: true, xpReward: 100 },
      { id: 'm-2', title: 'Hoàn thành Desktop Web AppShell & 3D Fox', completed: true, xpReward: 150 },
      { id: 'm-3', title: 'Thiết kế Mobile UI mượt mà, đầy đủ tính năng', completed: true, xpReward: 150 },
      { id: 'm-4', title: 'Báo cáo thuyết trình và nghiệm thu đồ án', completed: false, xpReward: 100 }
    ]
  },
  {
    id: 'q-2',
    title: 'Thử thách 14 Ngày Kỷ Luật Thép',
    description: 'Duy trì chuỗi streak thói quen tập luyện và học tập không bỏ lỡ ngày nào',
    difficulty: 'hard',
    category: 'mindfulness',
    progressPercent: 50,
    xpReward: 300,
    coinReward: 150,
    badgeIcon: '🔥',
    isPinned: false,
    milestones: [
      { id: 'm-21', title: 'Đạt chuỗi 7 ngày đầu tiên', completed: true, xpReward: 100 },
      { id: 'm-22', title: 'Hoàn thành mốc 14 ngày trọn vẹn', completed: false, xpReward: 200 }
    ]
  }
]

const INITIAL_SCHEDULES: ScheduleItem[] = [
  { id: 's-1', time: '08:30', title: 'Khởi động & Lên kế hoạch ngày', category: 'work', completed: true },
  { id: 's-2', time: '10:00', title: 'Phiên Deep Work: Lập trình Mobile UI', category: 'work', completed: true },
  { id: 's-3', time: '14:00', title: 'Ôn tập tiếng Anh Anki', category: 'learning', completed: false },
  { id: 's-4', time: '17:30', title: 'Chạy bộ Cardio Zone 2', category: 'fitness', completed: false },
  { id: 's-5', time: '21:30', title: 'Đọc sách & Thư giãn tinh thần', category: 'mindfulness', completed: false }
]

const INITIAL_SOCIAL_POSTS: SocialFeedPost[] = [
  {
    id: 'sp-1',
    userName: 'Minh Hoàng',
    userAvatar: '⚡',
    actionText: 'vừa hoàn thành nhiệm vụ',
    targetTitle: 'Chạy bộ 5km buổi sáng',
    timeAgo: '15 phút trước',
    likes: 8,
    cheers: 4
  },
  {
    id: 'sp-2',
    userName: 'Thảo Linh',
    userAvatar: '🌸',
    actionText: 'đạt chuỗi Streak ấn tượng',
    targetTitle: '🔥 15 Ngày Đọc Sách Liên Tục',
    timeAgo: '1 giờ trước',
    likes: 19,
    cheers: 12
  },
  {
    id: 'sp-3',
    userName: 'Trần Đạt',
    userAvatar: '🛡️',
    actionText: 'vừa đánh bại Trùm',
    targetTitle: '👑 Boss: Procrastination Demon',
    timeAgo: '3 giờ trước',
    likes: 24,
    cheers: 17
  }
]

const INITIAL_FOX: FoxState = {
  name: 'Kitsu',
  mood: 'happy',
  affection: 72,
  speechBubble: 'Xin chào hiệp sĩ! Cùng tiếp tục cuộc phiêu lưu chinh phục mục tiêu hôm nay nhé!',
  equippedHat: 'straw_hat',
  equippedOutfit: 'apprentice_robe',
  equippedAccessory: 'wooden_staff'
}

const INITIAL_WARDROBE: WardrobeItem[] = [
  {
    id: 'straw_hat',
    name: 'Nón Rơm Thám Hiểm',
    category: 'hat',
    price: 0,
    icon: '👒',
    unlocked: true,
    equipped: true,
    description: 'Nón che nắng kinh điển của mọi nhà thám hiểm trẻ tuổi.',
    buffText: '+5% Tốc độ hồi phục'
  },
  {
    id: 'wizard_hat',
    name: 'Mũ Pháp Sư Tinh Anh',
    category: 'hat',
    price: 150,
    icon: '🧙‍♂️',
    unlocked: false,
    equipped: false,
    description: 'Tập trung tư tưởng cao độ, tăng XP học tập.',
    buffText: '+10% XP học tập'
  },
  {
    id: 'golden_crown',
    name: 'Vương Miện Vương Giả',
    category: 'hat',
    price: 500,
    icon: '👑',
    unlocked: false,
    equipped: false,
    description: 'Dành cho hiệp sĩ kiên trì giữ streak trên 30 ngày.',
    buffText: '+15% Vàng thưởng'
  },
  {
    id: 'apprentice_robe',
    name: 'Áo Choàng Tân Thủ',
    category: 'outfit',
    price: 0,
    icon: '🥋',
    unlocked: true,
    equipped: true,
    description: 'Trang phục thoải mái cho mọi hoạt động hàng ngày.',
    buffText: '+5% XP thói quen'
  },
  {
    id: 'cyber_jacket',
    name: 'Áo Cyberpunk Neon',
    category: 'outfit',
    price: 260,
    icon: '🥼',
    unlocked: false,
    equipped: false,
    description: 'Công nghệ cao hỗ trợ tập trung và chống xao nhãng.',
    buffText: '+10% Tập trung Pomodoro'
  },
  {
    id: 'wooden_staff',
    name: 'Gậy Gỗ Tập Sự',
    category: 'accessory',
    price: 0,
    icon: '🦯',
    unlocked: true,
    equipped: true,
    description: 'Vũ khí xua đuổi sự lười biếng và trì hoãn.',
    buffText: '+2 STR'
  },
  {
    id: 'flame_blade',
    name: 'Kiếm Lửa Ý Chí',
    category: 'accessory',
    price: 380,
    icon: '🗡️',
    unlocked: false,
    equipped: false,
    description: 'Ngọn lửa nhiệt huyết luôn bừng cháy.',
    buffText: '+5 STR, +10% Boss DMG'
  }
]

interface StoreContextType {
  player: Player
  tasks: TaskItem[]
  habits: HabitItem[]
  quests: QuestItem[]
  schedules: ScheduleItem[]
  socialPosts: SocialFeedPost[]
  fox: FoxState
  wardrobe: WardrobeItem[]
  isFoxDrawerOpen: boolean
  toggleFoxDrawer: () => void
  toggleTask: (id: string) => void
  addTask: (task: Omit<TaskItem, 'id' | 'completed'>) => void
  deleteTask: (id: string) => void
  incrementHabit: (id: string, isPositive: boolean) => void
  toggleMilestone: (questId: string, milestoneId: string) => void
  addQuestItem: (quest: Omit<QuestItem, 'id' | 'progressPercent'>) => void
  petFox: () => void
  buyItem: (item: WardrobeItem) => boolean
  equipItem: (item: WardrobeItem) => void
  likeSocialPost: (id: string) => void
  cheerSocialPost: (id: string) => void
  toggleTheme: () => void
  recordFocusSession: (minutes: number) => void
  resetToDefaults: () => void
}

const StoreContext = createContext<StoreContextType | null>(null)

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [player, setPlayer] = useState<Player>(() => {
    const s = localStorage.getItem('lq_demo_player')
    return s ? JSON.parse(s) : INITIAL_PLAYER
  })

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const s = localStorage.getItem('lq_demo_tasks')
    return s ? JSON.parse(s) : INITIAL_TASKS
  })

  const [habits, setHabits] = useState<HabitItem[]>(() => {
    const s = localStorage.getItem('lq_demo_habits')
    return s ? JSON.parse(s) : INITIAL_HABITS
  })

  const [quests, setQuests] = useState<QuestItem[]>(() => {
    const s = localStorage.getItem('lq_demo_quests')
    return s ? JSON.parse(s) : INITIAL_QUESTS
  })

  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    const s = localStorage.getItem('lq_demo_schedules')
    return s ? JSON.parse(s) : INITIAL_SCHEDULES
  })

  const [socialPosts, setSocialPosts] = useState<SocialFeedPost[]>(() => {
    const s = localStorage.getItem('lq_demo_social')
    return s ? JSON.parse(s) : INITIAL_SOCIAL_POSTS
  })

  const [fox, setFox] = useState<FoxState>(() => {
    const s = localStorage.getItem('lq_demo_fox')
    return s ? JSON.parse(s) : INITIAL_FOX
  })

  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(() => {
    const s = localStorage.getItem('lq_demo_wardrobe')
    return s ? JSON.parse(s) : INITIAL_WARDROBE
  })

  const [isFoxDrawerOpen, setIsFoxDrawerOpen] = useState(false)

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('lq_demo_player', JSON.stringify(player))
    document.documentElement.setAttribute('data-theme', player.theme)
  }, [player])

  useEffect(() => localStorage.setItem('lq_demo_tasks', JSON.stringify(tasks)), [tasks])
  useEffect(() => localStorage.setItem('lq_demo_habits', JSON.stringify(habits)), [habits])
  useEffect(() => localStorage.setItem('lq_demo_quests', JSON.stringify(quests)), [quests])
  useEffect(() => localStorage.setItem('lq_demo_schedules', JSON.stringify(schedules)), [schedules])
  useEffect(() => localStorage.setItem('lq_demo_social', JSON.stringify(socialPosts)), [socialPosts])
  useEffect(() => localStorage.setItem('lq_demo_fox', JSON.stringify(fox)), [fox])
  useEffect(() => localStorage.setItem('lq_demo_wardrobe', JSON.stringify(wardrobe)), [wardrobe])

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#F26B3A', '#F6C85F', '#168C78', '#16324A']
      })
    } catch {}
  }

  const triggerLevelUp = () => {
    try {
      confetti({
        particleCount: 160,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FF8C00', '#FF4500', '#00E5FF']
      })
    } catch {}
  }

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const nextDone = !t.completed

        if (nextDone) {
          triggerConfetti()
          setPlayer((p) => {
            let nextXp = p.currentLevelXp + t.xpReward
            let nextLvl = p.level
            let maxLvlXp = p.nextLevelXp

            if (nextXp >= maxLvlXp) {
              nextLvl += 1
              nextXp -= maxLvlXp
              maxLvlXp = Math.round(maxLvlXp * 1.3)
              triggerLevelUp()
            }

            const stats = { ...p.stats }
            if (t.category === 'fitness') stats.str += 1
            if (t.category === 'learning') stats.int += 1
            if (t.category === 'mindfulness') stats.dis += 1
            if (t.category === 'social') stats.cha += 1

            return {
              ...p,
              level: nextLvl,
              totalXp: p.totalXp + t.xpReward,
              currentLevelXp: nextXp,
              nextLevelXp: maxLvlXp,
              coins: p.coins + t.coinReward,
              stats
            }
          })

          setFox((f) => ({
            ...f,
            mood: 'cheering',
            affection: Math.min(100, f.affection + 3),
            speechBubble: `Tuyệt vời quá! Bạn vừa hoàn thành "${t.title}" (+${t.xpReward} XP, +${t.coinReward} Vàng)!`
          }))
        }

        return { ...t, completed: nextDone }
      })
    )
  }

  const addTask = (taskData: Omit<TaskItem, 'id' | 'completed'>) => {
    const newTask: TaskItem = {
      ...taskData,
      id: `t-${Date.now()}`,
      completed: false
    }
    setTasks((prev) => [newTask, ...prev])
    setFox((f) => ({
      ...f,
      mood: 'playful',
      speechBubble: `Nhiệm vụ mới "${newTask.title}" đã được thêm vào sổ tay!`
    }))
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const incrementHabit = (id: string, isPositive: boolean) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h
        if (isPositive) {
          triggerConfetti()
          setPlayer((p) => ({
            ...p,
            totalXp: p.totalXp + h.xpReward,
            coins: p.coins + 5,
            stats: { ...p.stats, dis: p.stats.dis + 1 }
          }))
          return {
            ...h,
            positiveCount: h.positiveCount + 1,
            streak: h.streak + 1
          }
        } else {
          return {
            ...h,
            negativeCount: h.negativeCount + 1
          }
        }
      })
    )
  }

  const toggleMilestone = (questId: string, milestoneId: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id !== questId) return q
        const updatedMilestones = q.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        )
        const completedCount = updatedMilestones.filter((m) => m.completed).length
        const progressPercent = Math.round((completedCount / updatedMilestones.length) * 100)

        if (progressPercent === 100 && q.progressPercent < 100) {
          triggerLevelUp()
          setPlayer((p) => ({
            ...p,
            totalXp: p.totalXp + q.xpReward,
            coins: p.coins + q.coinReward
          }))
          setFox((f) => ({
            ...f,
            mood: 'cheering',
            speechBubble: `🎉 ĐỈNH CAO! Bạn đã hoàn thành đại nhiệm vụ "${q.title}"!`
          }))
        } else {
          triggerConfetti()
        }

        return {
          ...q,
          milestones: updatedMilestones,
          progressPercent
        }
      })
    )
  }

  const addQuestItem = (questData: Omit<QuestItem, 'id' | 'progressPercent'>) => {
    const newQuest: QuestItem = {
      ...questData,
      id: `q-${Date.now()}`,
      progressPercent: 0
    }
    setQuests((prev) => [newQuest, ...prev])
  }

  const petFox = () => {
    setFox((prev) => {
      const phrases = [
        'Yay! Cảm ơn bạn xoa đầu tớ, cảm thấy đầy tràn năng lượng!',
        'Gâu! Kitsu sẽ luôn đồng hành cùng hiệp sĩ tới đích!',
        'Hôm nay chúng ta cùng giữ chuỗi Streak rực rỡ nhé!',
        'Tớ thích nhất là lúc thấy bạn tích dấu hoàn thành nhiệm vụ!',
        'Cố lên! Bạn đang tiến rất gần tới Cấp độ tiếp theo rồi!'
      ]
      return {
        ...prev,
        mood: 'happy',
        affection: Math.min(100, prev.affection + 5),
        speechBubble: phrases[Math.floor(Math.random() * phrases.length)]
      }
    })
    triggerConfetti()
  }

  const buyItem = (item: WardrobeItem) => {
    if (player.coins < item.price) {
      setFox((f) => ({
        ...f,
        speechBubble: 'Chưa đủ Vàng rồi! Hãy hoàn thành thêm nhiệm vụ nhé hiệp sĩ!'
      }))
      return false
    }

    setPlayer((p) => ({ ...p, coins: p.coins - item.price }))
    setWardrobe((prev) => prev.map((i) => (i.id === item.id ? { ...i, unlocked: true } : i)))
    equipItem(item)
    triggerConfetti()
    return true
  }

  const equipItem = (item: WardrobeItem) => {
    setWardrobe((prev) =>
      prev.map((i) => (i.category === item.category ? { ...i, equipped: i.id === item.id } : i))
    )

    setFox((f) => {
      if (item.category === 'hat') return { ...f, equippedHat: item.id }
      if (item.category === 'outfit') return { ...f, equippedOutfit: item.id }
      if (item.category === 'accessory') return { ...f, equippedAccessory: item.id }
      return f
    })
  }

  const likeSocialPost = (id: string) => {
    setSocialPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const isLiked = !p.isLiked
        return {
          ...p,
          isLiked,
          likes: isLiked ? p.likes + 1 : p.likes - 1
        }
      })
    )
  }

  const cheerSocialPost = (id: string) => {
    setSocialPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const isCheered = !p.isCheered
        if (isCheered) triggerConfetti()
        return {
          ...p,
          isCheered,
          cheers: isCheered ? p.cheers + 1 : p.cheers - 1
        }
      })
    )
  }

  const toggleTheme = () => {
    setPlayer((p) => ({ ...p, theme: p.theme === 'light' ? 'dark' : 'light' }))
  }

  const recordFocusSession = (minutes: number) => {
    const gainedXp = minutes * 5
    const gainedCoins = Math.round(minutes * 1.5)

    setPlayer((curr) => {
      let nextXp = curr.currentLevelXp + gainedXp
      let nextLvl = curr.level
      let nextMaxXp = curr.nextLevelXp

      if (nextXp >= nextMaxXp) {
        nextLvl += 1
        nextXp -= nextMaxXp
        nextMaxXp = Math.round(nextMaxXp * 1.3)
        triggerLevelUp()
      }

      return {
        ...curr,
        level: nextLvl,
        totalXp: curr.totalXp + gainedXp,
        currentLevelXp: nextXp,
        nextLevelXp: nextMaxXp,
        coins: curr.coins + gainedCoins,
        stats: { ...curr.stats, dis: curr.stats.dis + 1 }
      }
    })

    triggerConfetti()
    setFox((f) => ({
      ...f,
      mood: 'cheering',
      speechBubble: `Phiên tập trung ${minutes} phút thành công xuất sắc! +${gainedXp} XP & +${gainedCoins} Vàng!`
    }))
  }

  const resetToDefaults = () => {
    setPlayer(INITIAL_PLAYER)
    setTasks(INITIAL_TASKS)
    setHabits(INITIAL_HABITS)
    setQuests(INITIAL_QUESTS)
    setSchedules(INITIAL_SCHEDULES)
    setSocialPosts(INITIAL_SOCIAL_POSTS)
    setFox(INITIAL_FOX)
    setWardrobe(INITIAL_WARDROBE)
    localStorage.clear()
  }

  return (
    <StoreContext.Provider
      value={{
        player,
        tasks,
        habits,
        quests,
        schedules,
        socialPosts,
        fox,
        wardrobe,
        isFoxDrawerOpen,
        toggleFoxDrawer: () => setIsFoxDrawerOpen((o) => !o),
        toggleTask,
        addTask,
        deleteTask,
        incrementHabit,
        toggleMilestone,
        addQuestItem,
        petFox,
        buyItem,
        equipItem,
        likeSocialPost,
        cheerSocialPost,
        toggleTheme,
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
