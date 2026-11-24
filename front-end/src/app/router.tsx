import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/shell/AppShell'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PlaceholderPage } from '@/features/placeholders/PlaceholderPage'
import { ProfileBoundaryPage } from '@/features/profile/ProfileBoundaryPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { WardrobePage } from '@/features/wardrobe/WardrobePage'
import { FocusModePage } from '@/features/work/FocusModePage'
import { HabitsPage } from '@/features/work/HabitsPage'
import { QuestDetailPage } from '@/features/work/QuestDetailPage'
import { QuestsPage } from '@/features/work/QuestsPage'
import { TaskDetailPage } from '@/features/work/TaskDetailPage'
import { WorkPage } from '@/features/work/WorkPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/work/tasks/:taskId/focus" element={<FocusModePage />} />

      <Route
        path="/*"
        element={
          <AppShell>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/work" element={<Navigate to="/work/tasks" replace />} />
              <Route path="/work/tasks" element={<WorkPage />} />
              <Route path="/work/tasks/:taskId" element={<TaskDetailPage />} />
              <Route path="/work/habits" element={<HabitsPage />} />
              <Route path="/work/quests" element={<QuestsPage />} />
              <Route path="/work/quests/:questId" element={<QuestDetailPage />} />
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <CalendarPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfileBoundaryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <PlaceholderPage
                    title="Tin nhắn & Nhóm bạn bè"
                    description="Bảng tin Social đã được tích hợp trực tiếp tại Trang chủ. Hộp thư tin nhắn riêng chờ hợp nhất nhánh Backend tương ứng."
                    plannedMilestone="FE-04"
                  />
                }
              />
              <Route path="/wardrobe" element={<WardrobePage />} />
              <Route path="/preview/social-first" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        }
      />
    </Routes>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
