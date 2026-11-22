import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/shell/AppShell'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PlaceholderPage } from '@/features/placeholders/PlaceholderPage'

export function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route
          path="/work"
          element={
            <PlaceholderPage
              title="Công việc, Mục tiêu & Cột mốc"
              description="Không gian quản trị đầy đủ cho Goals, Milestones và Quests (đã có API client sẵn sàng từ FE-01)."
              plannedMilestone="FE-02"
            />
          }
        />
        <Route
          path="/calendar"
          element={
            <PlaceholderPage
              title="Lịch hành trình"
              description="Hiển thị lịch trình ONE_TIME / RECURRING từ Schedules & Today API."
              plannedMilestone="FE-02"
            />
          }
        />
        <Route
          path="/messages"
          element={
            <PlaceholderPage
              title="Tin nhắn & Cộng đồng"
              description="Chờ hợp nhất nhánh Backend feature/friends-and-social vào develop."
              plannedMilestone="FE-04"
            />
          }
        />
        <Route
          path="/wardrobe"
          element={
            <PlaceholderPage
              title="Tủ đồ & Mascot Fox V2"
              description="Sẵn sàng tích hợp Fox V2 Gate I WebGL Runtime và 20 món trang phục H1/H2."
              plannedMilestone="FE-03"
            />
          }
        />
        <Route
          path="/settings"
          element={
            <PlaceholderPage
              title="Cài đặt tài khoản"
              description="Quản lý múi giờ, ngôn ngữ, quyền riêng tư và chế độ giảm chuyển động."
              plannedMilestone="FE-02"
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
