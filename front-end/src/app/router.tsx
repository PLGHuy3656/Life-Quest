import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/shell/AppShell'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { LoadingPage } from '@/features/loading/LoadingPage'
import { MessagesPage } from '@/features/messages/MessagesPage'
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
      {/* Public Auth Routes (outside AppShell; no FloatingChatHost or ChibiFox) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/loading" element={<LoadingPage />} />

      <Route
        path="/work/tasks/:taskId/focus"
        element={
          <ProtectedRoute mode="workspace">
            <FocusModePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/*"
        element={
          <AppShell>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute mode="workspace">
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/work" element={<Navigate to="/work/tasks" replace />} />
              <Route
                path="/work/tasks"
                element={
                  <ProtectedRoute mode="workspace">
                    <WorkPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/work/tasks/:taskId"
                element={
                  <ProtectedRoute mode="workspace">
                    <TaskDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/work/habits"
                element={
                  <ProtectedRoute mode="workspace">
                    <HabitsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/work/quests"
                element={
                  <ProtectedRoute mode="workspace">
                    <QuestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/work/quests/:questId"
                element={
                  <ProtectedRoute mode="workspace">
                    <QuestDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute mode="workspace">
                    <CalendarPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute mode="strict">
                    <ProfileBoundaryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute mode="strict">
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute mode="workspace">
                    <MessagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages/*"
                element={
                  <ProtectedRoute mode="workspace">
                    <MessagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wardrobe/*"
                element={
                  <ProtectedRoute mode="workspace">
                    <WardrobePage />
                  </ProtectedRoute>
                }
              />
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
