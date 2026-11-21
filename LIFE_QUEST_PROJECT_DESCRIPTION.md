# TỔNG QUAN CHI TIẾT DỰ ÁN LIFE-QUEST (CURRENT STATE)
> **Đồ án Thực tế Công nghệ Phần mềm**  
> **Nhánh hiện tại:** `feature/friends-and-social` (Tích hợp: `develop` + `feature/tv4-mascot-fox-v2`)  
> **Thời điểm cập nhật:** 21/11/2026

---

## 1. TỔNG QUAN Ý NGHĨA & BẢN CHẤT DỰ ÁN

**Life-Quest** là ứng dụng hỗ trợ quản lý mục tiêu và rèn luyện cá nhân được xây dựng trên triết lý **Gamification (Game hóa)**. Mục tiêu của dự án là biến việc quản lý kế hoạch và công việc thường nhật thành một hành trình nhập vai RPG:
- Người dùng thiết lập mục tiêu cuộc sống thành các **Goals** (Mục tiêu lớn), chia nhỏ thành **Milestones** (Cột mốc từng chặng) và thực thi qua các **Quests** (Nhiệm vụ cụ thể).
- Hoàn thành nhiệm vụ giúp người dùng nhận **Điểm kinh nghiệm (XP)** và **Tiền vàng (Coins)**.
- Có linh vật **3D Mascot Đồng hành (Cáo Chibi Fox V2)** biểu cảm trực quan trên màn hình: khích lệ người dùng, ăn mừng khi xong nhiệm vụ và chúc mừng chuỗi ngày kiên trì (Streak).
- Mở rộng sang tính năng **Bạn bè & Tương tác xã hội (Friends & Social)**: cùng nhau làm nhiệm vụ, giám sát tiến độ và cạnh tranh trên bảng xếp hạng.

---

## 2. MÔ HÌNH PHÂN CẤP DỮ LIỆU CỐT LÕI (HIERARCHY DOMAIN MODEL)

$$\text{User} \longrightarrow \text{Goal} \longrightarrow \text{Milestone} \longrightarrow \text{Quest}$$

1. **User (Người dùng):** Tài khoản đăng ký, sở hữu danh sách mục tiêu và nhiệm vụ cá nhân.
2. **Goal (Mục tiêu tổng quát):** Dự án hoặc mục tiêu dài hạn (vd: *"Thi IELTS 7.5"*, *"Giảm 5kg"*), có thời hạn bắt đầu (`startDate`) và kết thúc (`dueDate`).
3. **Milestone (Cột mốc trung gian):** Các chặng đánh dấu tiến trình của Goal (vd: *"Hoàn thành cuốn Cambridge 15"*). Hỗ trợ xác định thứ tự (`position`), hoán đổi thứ tự (`reorder`) và ghi nhận thời gian hoàn thành (`completedAt`).
4. **Quest (Nhiệm vụ thực thi):** Hành động cụ thể hàng ngày để đạt Milestone/Goal:
   - **Loại nhiệm vụ (`QuestType`):** 
     - `SIMPLE`: Đánh dấu hoàn thành đơn giản.
     - `QUANTITY`: Theo dõi theo số lượng (targetValue, targetUnit - vd: 50 từ vựng).
     - `DURATION`: Theo dõi theo thời lượng (thời gian ước lượng - vd: chạy bộ 30 phút).
     - `PROGRESS`: Theo dõi theo phần trăm tiến độ (0 - 100%).
     - `FOCUS`: Phiên tập trung Pomodoro.
   - **Yêu cầu bằng chứng (`ProofRequirement`):** `NONE`, `OPTIONAL`, `REQUIRED`.
   - **Phần thưởng:** `xpReward` (Điểm kinh nghiệm) và `coinReward` (Vàng).
   - **Trạng thái & Quản lý:** Hỗ trợ Ghim lên đầu (`isPinned`), Mức ưu tiên (`priority`), Xóa mềm (`deletedAt`), Lưu trữ (`archivedAt`) và Phục hồi (`restore`).

---

## 3. KIẾN TRÚC HỆ THỐNG HIỆN TẠI

Hệ thống được chia thành 3 phân hệ độc lập và phối hợp chặt chẽ:

```
┌────────────────────────────────────────────────────────┐
│                      LIFE-QUEST                        │
├─────────────────────────┬──────────────────────────────┤
│ 1. CLIENT SUBSYSTEM     │ 2. SERVER & DB SUBSYSTEM     │
│  - React 18 + Vite SPA  │  - Node.js (>=18)            │
│  - HMR & Component-based│  - Express v5.3 (Babel ES)   │
│                         │  - Prisma ORM 7.x + Pg Driver│
├─────────────────────────┤  - PostgreSQL Database       │
│ 3. 3D MASCOT SUBSYSTEM  │                              │
│  - Fox V2 Chibi Rig D1.1│                              │
│  - Animations E1, E2, G1│                              │
│  - Three.js WebGL Run   │                              │
└─────────────────────────┴──────────────────────────────┘
```

### 3.1. Phân hệ Backend (`backend/`)
- **Mô hình kiến trúc:** **Layered Architecture kết hợp Feature Modules**:
  $$\text{Route} \longrightarrow \text{Validation (Joi)} \longrightarrow \text{Controller} \longrightarrow \text{Service} \longrightarrow \text{Repository (Prisma)}$$
- **Điều hướng tập trung:** Mọi module được gom về `src/routes/index.js` và gán tiền tố `/api/v1`.
- **Xử lý ngoại lệ chuẩn:** Sử dụng class `ApiError` và middleware `errorHandler` tập trung, trả về format JSON đồng nhất:
  - Thành công: `{ success: true, data: ... }`
  - Thất bại: `{ success: false, error: { code: string, message: string } }`
- **Bảo mật cơ sở:** Mật khẩu người dùng được băm qua `bcrypt` (Salt rounds = 10).

### 3.2. Phân hệ 3D Mascot Companion (`mascot/fox-v2/`)
- **Thiết kế & Tạo hình:** Nhân vật Cáo Chibi Fox V2 low-poly tối ưu cho trình duyệt, bảng vật liệu `materials.json`, tỷ lệ `proportions.json` và bộ khung xương `fox_rig_d1_1.blend` hỗ trợ đầy đủ cử động mặt và cơ thể.
- **Thư viện Hoạt ảnh:**
  - `E1/E2`: Hoạt ảnh quan sát, idle thở, phản hồi chạm/click.
  - `G1`: Hoạt ảnh ăn mừng khi hoàn thành nhiệm vụ (`Quest Reward`), tung hoa, nhận XP/Coins và chuỗi `Streak Celebration`.
- **Runtime WebGL:** Có sẵn Sandbox Three.js WebGL (`07_WEB_PREVIEW`) và hợp đồng tích hợp (`FOX_RUNTIME_CONTRACT_V2.md`) sẵn sàng nhúng trực tiếp vào React.

### 3.3. Phân hệ Frontend (`front-end/`)
- Nền tảng React 18, đóng gói với Vite 4.3. Đang trong giai đoạn kết nối API Backend và dựng giao diện tương tác cùng Widget Mascot 3D.

---

## 4. CHI TIẾT BẢNG CƠ SỞ DỮ LIỆU (PRISMA SCHEMA)

| Bảng | Các trường dữ liệu cốt lõi | Ràng buộc & Quan hệ |
| :--- | :--- | :--- |
| **`User`** | `id`, `email`, `username`, `passwordHash`, `status`, `deletedAt`, `createdAt`, `updatedAt` | Unique `email`, Unique `username`. Quan hệ 1-N với `Goal`, 1-N với `Quest`. |
| **`Goal`** | `id`, `userId`, `title`, `description`, `startDate`, `dueDate`, `status`, `createdAt`, `updatedAt` | FK `userId` $\rightarrow$ `User.id`. Quan hệ 1-N với `Milestone`, 1-N với `Quest`. Ràng buộc `startDate < dueDate`. |
| **`Milestone`**| `id`, `goalId`, `title`, `description`, `position`, `status`, `completedAt`, `deletedAt`, `createdAt`, `updatedAt` | FK `goalId` $\rightarrow$ `Goal.id`. Ràng buộc duy nhất `@@unique([goalId, position])`. Quan hệ 1-N với `Quest`. |
| **`Quest`** | `id`, `userId`, `goalId`, `milestoneId`, `title`, `description`, `type`, `priority`, `proofRequirement`, `targetValue`, `targetUnit`, `estimatedDurationSeconds`, `xpReward`, `coinReward`, `startAt`, `dueAt`, `completedAt`, `archivedAt`, `status`, `isPinned`, `deletedAt`, `createdAt`, `updatedAt` | FK `userId`, FK `goalId?`, FK `milestoneId?`. Enum `QuestType`, Enum `ProofRequirement`. |

---

## 5. HỆ THỐNG API RESTFUL HIỆN CÓ (`/api/v1`)

```
/api/v1
│
├── /users
│   ├── POST   /                      # Đăng ký người dùng
│   └── GET    /:email                # Tra cứu thông tin người dùng
│
├── /goals
│   ├── GET    /                      # Lấy danh sách Goal theo ?userId=
│   ├── POST   /                      # Tạo Goal mới
│   ├── GET    /:goalId               # Xem chi tiết Goal
│   ├── PATCH  /:goalId               # Cập nhật Goal
│   ├── DELETE /:goalId               # Xóa mềm Goal (status=ARCHIVED)
│   ├── POST   /:goalId/pause         # Tạm dừng Goal (status=PAUSE)
│   ├── GET    /:goalId/milestones    # Lấy danh sách Milestones của Goal
│   ├── POST   /:goalId/milestones    # Tạo Milestone mới cho Goal
│   └── PATCH  /:goalId/milestones/reorder # Sắp xếp lại thứ tự Milestones
│
├── /milestones
│   ├── GET    /:milestoneId          # Xem chi tiết Milestone
│   ├── PATCH  /:milestoneId          # Sửa Milestone
│   ├── DELETE /:milestoneId          # Xóa mềm Milestone (deletedAt)
│   └── POST   /:milestoneId/complete # Hoàn thành Milestone (completedAt)
│
└── /quests
    ├── GET    /                      # Lọc Quests (?userId=&status=&goalId=&milestoneId=&search=)
    ├── POST   /                      # Tạo Quest mới
    ├── GET    /:questId              # Xem chi tiết Quest
    ├── PATCH  /:questId              # Sửa Quest
    ├── DELETE /:questId              # Xóa mềm Quest (deletedAt)
    ├── POST   /:questId/pin          # Ghim Quest lên đầu
    ├── DELETE /:questId/pin          # Bỏ ghim Quest
    ├── POST   /:questId/archive      # Lưu trữ Quest (archivedAt)
    └── POST   /:questId/restore      # Khôi phục Quest
```

---

## 6. MỤC TIÊU PHÁT TRIỂN CỦA NHÁNH HIỆN TẠI (`feature/friends-and-social`)

Với việc đã tích hợp xong phần lõi quản lý mục tiêu/nhiệm vụ từ `develop` và linh vật 3D từ `feature/mascot`, nhánh này tập trung hoàn thiện các khía cạnh tương tác cộng đồng:
1. **Module Friends:** Kết bạn, chấp nhận kết bạn, chặn và xem danh sách bạn bè.
2. **Social Feed (Bảng tin hoạt động):** Đăng tự động hoặc thủ công khi hoàn thành Milestone/Goal để bạn bè khích lệ, thả tim.
3. **Nhiệm vụ đồng đội (Co-op Quests):** Cho phép bạn bè cùng tham gia thử thách hoặc đóng vai trò người duyệt bằng chứng (`ProofRequirement`).
4. **Leaderboard (Bảng xếp hạng):** Xếp hạng thi đua theo XP, cấp bậc và chuỗi ngày rèn luyện (Streak) giữa các người bạn.
