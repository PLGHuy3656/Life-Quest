// API Service for Life-Quest with Graceful Offline Fallback

const DEFAULT_API_BASE = 'http://localhost:3000/api/v1'

const STORAGE_KEY_CONFIG = 'lifequest_config'
const STORAGE_KEY_GOALS = 'lifequest_mock_goals'
const STORAGE_KEY_STATS = 'lifequest_user_stats'

export const getApiConfig = () => {
  const saved = localStorage.getItem(STORAGE_KEY_CONFIG)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      // ignore
    }
  }
  return {
    baseUrl: DEFAULT_API_BASE,
    userId: 'c4e5114a-58f2-4932-b7b5-0b04db2256da',
    username: 'Adventurer',
    email: 'hero@lifequest.app',
    useMockOnly: false
  }
}

export const saveApiConfig = (config) => {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config))
}

// Initial mock data if empty
const getInitialMockGoals = (userId) => [
  {
    id: 'mock-goal-1',
    userId,
    title: 'Hoàn thành báo cáo Đồ án CNPM',
    description: 'Viết tài liệu đặc tả yêu cầu, vẽ biểu đồ Use Case và thiết kế CSDL Postgres.',
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mock-goal-2',
    userId,
    title: 'Luyện tập thể lực: Chạy bộ 5km',
    description: 'Duy trì chuỗi ngày thể thao để tăng điểm Thể Lực và Tinh Thần.',
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mock-goal-3',
    userId,
    title: 'Đọc 30 trang sách Clean Code',
    description: 'Cải thiện kỹ năng refactor và tối ưu mã nguồn dự án.',
    startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'PAUSE',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mock-goal-4',
    userId,
    title: 'Khởi tạo cấu trúc Backend Express & Prisma',
    description: 'Thiết lập mô hình kiến trúc phân tầng Layered Architecture.',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export const getLocalGoals = (userId) => {
  const saved = localStorage.getItem(STORAGE_KEY_GOALS)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      // ignore
    }
  }
  const initial = getInitialMockGoals(userId)
  localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(initial))
  return initial
}

export const saveLocalGoals = (goals) => {
  localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals))
}

export const getUserStats = () => {
  const saved = localStorage.getItem(STORAGE_KEY_STATS)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      // ignore
    }
  }
  return {
    level: 3,
    exp: 420,
    maxExp: 1000,
    streak: 6,
    coins: 350,
    gems: 15,
    title: 'Chiến Binh Kỷ Luật'
  }
}

export const saveUserStats = (stats) => {
  localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats))
}

// Request Helper
const apiRequest = async (endpoint, options = {}) => {
  const config = getApiConfig()
  const url = `${config.baseUrl}${endpoint}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 4000)

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    const data = await response.json()
    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.message || `Lỗi HTTP ${response.status}`
      throw new Error(errorMsg)
    }
    return data
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

// Check Backend Connectivity
export const pingBackend = async () => {
  const config = getApiConfig()
  try {
    const res = await fetch(`${config.baseUrl}/goals?userId=${config.userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    return res.ok || res.status === 404 || res.status === 400
  } catch {
    return false
  }
}

// Goals API with fallback
export const fetchGoals = async (userId) => {
  const config = getApiConfig()
  if (config.useMockOnly) {
    return { isBackend: false, data: getLocalGoals(userId) }
  }

  try {
    const res = await apiRequest(`/goals?userId=${userId}`)
    return { isBackend: true, data: res.data || [] }
  } catch (error) {
    console.warn('Backend không phản hồi, chuyển sang dữ liệu Local:', error.message)
    return { isBackend: false, data: getLocalGoals(userId), error: error.message }
  }
}

export const createGoalApi = async (goalData) => {
  const config = getApiConfig()
  if (config.useMockOnly) {
    const current = getLocalGoals(goalData.userId)
    const newGoal = {
      id: 'local-' + Date.now(),
      ...goalData,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    saveLocalGoals([newGoal, ...current])
    return { isBackend: false, data: newGoal }
  }

  try {
    const res = await apiRequest('/goals', {
      method: 'POST',
      body: JSON.stringify(goalData)
    })
    return { isBackend: true, data: res.data }
  } catch (error) {
    // Fallback locally
    const current = getLocalGoals(goalData.userId)
    const newGoal = {
      id: 'local-' + Date.now(),
      ...goalData,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    saveLocalGoals([newGoal, ...current])
    return { isBackend: false, data: newGoal, warning: error.message }
  }
}

export const pauseGoalApi = async (goalId, userId) => {
  const config = getApiConfig()
  if (config.useMockOnly) {
    const current = getLocalGoals(userId)
    const updated = current.map((g) => (g.id === goalId ? { ...g, status: 'PAUSE', updatedAt: new Date().toISOString() } : g))
    saveLocalGoals(updated)
    return { isBackend: false }
  }

  try {
    const res = await apiRequest(`/goals/${goalId}/pause?userId=${userId}`, {
      method: 'POST'
    })
    return { isBackend: true, data: res.data }
  } catch (error) {
    const current = getLocalGoals(userId)
    const updated = current.map((g) => (g.id === goalId ? { ...g, status: 'PAUSE', updatedAt: new Date().toISOString() } : g))
    saveLocalGoals(updated)
    return { isBackend: false, warning: error.message }
  }
}

export const archiveGoalApi = async (goalId, userId) => {
  const config = getApiConfig()
  if (config.useMockOnly) {
    const current = getLocalGoals(userId)
    const updated = current.map((g) => (g.id === goalId ? { ...g, status: 'ARCHIVED', updatedAt: new Date().toISOString() } : g))
    saveLocalGoals(updated)
    return { isBackend: false }
  }

  try {
    const res = await apiRequest(`/goals/${goalId}?userId=${userId}`, {
      method: 'DELETE'
    })
    return { isBackend: true, data: res.data }
  } catch (error) {
    const current = getLocalGoals(userId)
    const updated = current.map((g) => (g.id === goalId ? { ...g, status: 'ARCHIVED', updatedAt: new Date().toISOString() } : g))
    saveLocalGoals(updated)
    return { isBackend: false, warning: error.message }
  }
}

export const updateGoalApi = async (goalId, userId, updateData) => {
  const config = getApiConfig()
  if (config.useMockOnly) {
    const current = getLocalGoals(userId)
    const updated = current.map((g) => (g.id === goalId ? { ...g, ...updateData, updatedAt: new Date().toISOString() } : g))
    saveLocalGoals(updated)
    return { isBackend: false }
  }

  try {
    const res = await apiRequest(`/goals/${goalId}?userId=${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    })
    return { isBackend: true, data: res.data }
  } catch (error) {
    const current = getLocalGoals(userId)
    const updated = current.map((g) => (g.id === goalId ? { ...g, ...updateData, updatedAt: new Date().toISOString() } : g))
    saveLocalGoals(updated)
    return { isBackend: false, warning: error.message }
  }
}

export const completeGoalLocal = (goalId, userId) => {
  const current = getLocalGoals(userId)
  const updated = current.map((g) => (g.id === goalId ? { ...g, status: 'COMPLETED', updatedAt: new Date().toISOString() } : g))
  saveLocalGoals(updated)
  return updated
}
