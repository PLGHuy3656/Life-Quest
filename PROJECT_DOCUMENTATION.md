# TÀI LIỆU ĐẶC TẢ VÀ PHÂN TÍCH DỰ ÁN LIFE-QUEST
> **Môn học:** Đồ án Thực tế Công nghệ Phần mềm (SE Capstone / Course Project)  
> **Phiên bản tài liệu:** 1.0.0  
> **Ngày cập nhật:** 20/11/2026  
> **Trạng thái:** Đang phát triển (Active Development)

---

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)

### 1.1. Giới thiệu
**Life-Quest** là ứng dụng hỗ trợ người dùng quản lý mục tiêu cá nhân (Goal Tracking) áp dụng triết lý **Gamification (Game hóa)**. Dự án biến cuộc sống và các kế hoạch rèn luyện cá nhân thành các "nhiệm vụ" (Quests/Goals), giúp người dùng có động lực theo dõi tiến độ, duy trì thói quen và đạt được các cột mốc trong cuộc sống.

### 1.2. Mục tiêu dự án
- Cung cấp nền tảng quản lý mục tiêu khoa học, hỗ trợ lập lịch (`startDate`, `dueDate`), cập nhật trạng thái (`ACTIVE`, `PAUSE`, `ARCHIVED`, `COMPLETED`).
- Xây dựng hệ thống theo tiêu chuẩn kỹ thuật phần mềm hiện đại: kiến trúc phân tầng (Layered Architecture), mã nguồn mở rộng linh hoạt (Extensible), kiểm soát lỗi chặt chẽ (Centralized Error Handling), và chuẩn hóa dữ liệu đầu vào (Validation Pipeline).

---

## 2. KIẾN TRÚC HỆ THỐNG & CÔNG NGHỆ (ARCHITECTURE & TECH STACK)

Hệ thống được thiết kế theo mô hình **Client - Server (Decoupled Architecture)**:

```
[ Client: React + Vite SPA ] 
            │
            │ HTTP / RESTful API (JSON)
            ▼
[ Server: Node.js + Express (Babel ES Modules) ]
            │
            │ Prisma Client (ORM + pg Adapter)
            ▼
[ Database: PostgreSQL ]
```

### 2.1. Tech Stack chi tiết

| Tầng (Tier) | Công nghệ / Thư viện | Phiên bản | Vai trò chính |
| :--- | :--- | :--- | :--- |
| **Frontend** | React | ^18.2.0 | Xây dựng giao diện người dùng (SPA) |
| | Vite | ^4.3.5 | Build tool & Dev server tốc độ cao (HMR) |
| **Backend** | Node.js | >=18.x | Runtime môi trường thực thi máy chủ |
| | Express.js | ^5.3.0 | Web Framework RESTful API |
| | Babel | ^8.0.x | ES Transpiler hỗ trợ Module resolution & syntax mới |
| **Database** | PostgreSQL | 8.x/15+ | Hệ quản trị cơ sở dữ liệu quan hệ |
| | Prisma ORM | 7.10.1 | Quản lý schema, migrations và truy vấn CSDL type-safe |
| | `@prisma/adapter-pg` | ^7.10.1 | Database adapter kết nối PostgreSQL Driver |
| **Security & Utils** | Bcrypt | ^6.0.0 | Băm mật khẩu người dùng (Salt rounds = 10) |
| | Joi | ^18.3.1 | Schema validation cho request payload |
| | http-status-codes | ^2.3.0 | Chuẩn hóa HTTP status codes |
| | Dotenv | - | Quản lý biến môi trường |

---

## 3. CẤU TRÚC THƯ MỤC NGUỒN (PROJECT DIRECTORY STRUCTURE)

```
Life-Quest/
├── backend/
│   ├── prisma/
│   │   ├── migrations/                  # Lịch sử các bản migration database
│   │   │   ├── 20261030210412_create_user/
│   │   │   └── 20261102090731_create_goal/
│   │   ├── schema.prisma                # Định nghĩa Prisma Data Models
│   │   └── migration_lock.toml
│   ├── src/
│   │   ├── common/                      # Thành phần dùng chung (Cross-cutting Concerns)
│   │   │   ├── errors/
│   │   │   │   ├── ApiError.js          # Custom Error Class chuẩn hóa lỗi
│   │   │   │   └── errorHandler.js      # Middleware bắt lỗi tập trung (Centralized Error Handler)
│   │   │   └── middleware/
│   │   │       └── validate.js          # Joi Request Validation Middleware
│   │   ├── config/                      # Cấu hình hệ thống & CSDL
│   │   │   ├── database.js              # Khởi tạo Prisma Client với Adapter Pg
│   │   │   └── databaseTest.js          # Script test kết nối DB
│   │   ├── generated/                   # Thư mục Prisma Client tự động sinh
│   │   ├── modules/                     # Kiến trúc Feature Modules (Tách theo nghiệp vụ)
│   │   │   ├── users/
│   │   │   │   ├── usersRoute.js        # Định tuyến API người dùng
│   │   │   │   ├── usersValidation.js   # Joi Schema cho Users
│   │   │   │   ├── usersController.js   # Nhận/phản hồi HTTP request
│   │   │   │   ├── usersService.js      # Nghiệp vụ (Check trùng email, hash password...)
│   │   │   └── goals/
│   │   │       ├── goalsRoute.js        # Định tuyến API mục tiêu
│   │   │       ├── goalsValidation.js   # Joi Schema cho Goals
│   │   │       ├── goalsController.js   # Nhận/phản hồi HTTP request
│   │   │       ├── goalsService.js      # Nghiệp vụ kiểm tra ngày, quyền sở hữu, trạng thái
│   │   │       └── goalsRepository.js   # Tương tác Database (CRUD Goal qua Prisma)
│   │   ├── app.js                       # Cấu hình Express App, Middlewares, Routes
│   │   └── server.js                    # Entry point khởi chạy HTTP Server
│   ├── .babelrc                         # Cấu hình Babel compiler
│   ├── .eslintrc.cjs                    # Cấu hình linter chuẩn
│   └── package.json                     # Quản lý script và dependencies của backend
│
├── front-end/
│   ├── public/                          # Static assets (Vite logo...)
│   ├── src/
│   │   ├── assets/                      # Hình ảnh, icons
│   │   ├── App.css                      # Styling chính của App
│   │   ├── App.jsx                      # Component gốc React
│   │   ├── index.css                    # Global CSS styles
│   │   └── main.jsx                     # Entry point render React DOM
│   ├── index.html                       # File HTML template
│   ├── vite.config.js                   # Cấu hình Vite bundler
│   └── package.json                     # Quản lý dependencies frontend
│
├── README.md                            # Giới thiệu sơ lược dự án
└── PROJECT_DOCUMENTATION.md             # Toàn bộ tài liệu chi tiết (File này)
```

---

## 4. CHI TIẾT CÁC PHÂN TẦNG VÀ THIẾT KẾ BACKEND (BACKEND PATTERNS)

Backend áp dụng **Layered Architecture** kết hợp nguyên lý **Single Responsibility Principle (SRP)**:

```
[HTTP Request] 
      │
      ▼
[Router] ────────► [Validate Middleware (Joi)]
                          │ (Hợp lệ)
                          ▼
                  [Controller] (Trích xuất params/body/query)
                          │
                          ▼
                  [Service] (Business Logic, Validation nghiệp vụ, Auth check)
                          │
                          ▼
                  [Repository] (Tương tác CSDL qua Prisma Client)
                          │
                          ▼
                  [Database (PostgreSQL)]
```

### 4.1. Chuẩn hóa Định dạng Response và Xử lý Lỗi

#### Cấu trúc Response thành công:
```json
{
  "success": true,
  "data": { ... }
}
```

#### Cấu trúc Response khi gặp lỗi:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Mô tả chi tiết nguyên nhân lỗi"
  }
}
```

#### Cơ chế xử lý lỗi:
- Sử dụng class `ApiError` kế thừa từ `Error` nguyên bản của JS, lưu trữ `statusCode`, `errorCode` và `message`.
- Middleware `errorHandler` đặt ở cuối chuỗi middleware trong `app.js`, tự động bắt mọi ngoại lệ được ném ra qua `next(error)` hoặc lỗi không kiểm soát, ngăn chặn crash server và che giấu stack trace nhạy cảm ở môi trường production.

---

## 5. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Dự án hiện có 2 thực thể chính được mô hình hóa trong `prisma/schema.prisma`:

### 5.1. Bảng `User`
Lưu trữ thông tin tài khoản người dùng:

| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải |
| :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | `@id @default(uuid())` | Khóa chính dạng định danh duy nhất toàn cầu |
| `email` | `String` | `@unique` | Địa chỉ email đăng ký (duy nhất) |
| `username` | `String` | `@unique` | Tên đăng nhập người dùng (duy nhất) |
| `passwordHash` | `String` | Not Null | Mật khẩu đã băm qua Bcrypt |
| `status` | `String` | `@default("ACTIVE")` | Trạng thái tài khoản (`ACTIVE`, `INACTIVE`...) |
| `createdAt` | `DateTime` | `@default(now())` | Thời gian tạo tài khoản |
| `updatedAt` | `DateTime` | `@updatedAt` | Thời gian cập nhật thông tin gần nhất |

### 5.2. Bảng `Goal`
Lưu trữ các mục tiêu của người dùng:

| Tên cột | Kiểu dữ liệu | Ràng buộc | Diễn giải |
| :--- | :--- | :--- | :--- |
| `id` | `String` (UUID) | `@id @default(uuid())` | Khóa chính mục tiêu |
| `userId` | `String` | Foreign Key (`User.id`) | Liên kết tới người dùng sở hữu mục tiêu |
| `title` | `String` | Not Null | Tiêu đề mục tiêu (3-100 ký tự) |
| `description` | `String?` | Nullable | Mô tả chi tiết mục tiêu (tối đa 500 ký tự) |
| `startDate` | `DateTime` | Not Null | Ngày bắt đầu thực hiện |
| `dueDate` | `DateTime` | Not Null | Hạn chót hoàn thành (`dueDate > startDate`) |
| `status` | `String` | `@default("ACTIVE")` | Trạng thái (`ACTIVE`, `PAUSE`, `ARCHIVED`, `COMPLETED`) |
| `createdAt` | `DateTime` | `@default(now())` | Thời gian khởi tạo mục tiêu |
| `updatedAt` | `DateTime` | `@updatedAt` | Thời điểm cập nhật mục tiêu |

---

## 6. DANH SÁCH API ENDPOINTS HIỆN TẠI (API SPECIFICATION)

### 6.1. Module Users (`/api/v1/users`)

| Phương thức | Đường dẫn | Chức năng | Body / Params | Mã phản hồi |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/users` | Đăng ký tài khoản mới | `body: { email, username, password }` | `201 Created` / `400 Bad Request` / `409 Conflict` |
| `GET` | `/api/v1/users/:email` | Lấy thông tin user theo email | `params: { email }` | `200 OK` / `400 Bad Request` / `404 Not Found` |

### 6.2. Module Goals (`/api/v1/goals`)

| Phương thức | Đường dẫn | Chức năng | Query / Params / Body | Mã phản hồi |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/goals` | Lấy danh sách mục tiêu của user | `query: { userId }` | `200 OK` / `400 Bad Request` |
| `POST` | `/api/v1/goals` | Tạo mới một mục tiêu | `body: { userId, title, description, startDate, dueDate }` | `201 Created` / `400 Bad Request` / `404 Not Found` |
| `GET` | `/api/v1/goals/:goalId` | Xem chi tiết một mục tiêu | `params: { goalId }`, `query: { userId }` | `200 OK` / `403 Forbidden` / `404 Not Found` |
| `PATCH` | `/api/v1/goals/:goalId` | Cập nhật thông tin mục tiêu | `params: { goalId }`, `query: { userId }`, `body: { title?, description?, startDate?, dueDate? }` | `200 OK` / `400 Bad Request` / `403 Forbidden` / `404 Not Found` |
| `DELETE` | `/api/v1/goals/:goalId` | Xóa mềm mục tiêu (`ARCHIVED`) | `params: { goalId }`, `query: { userId }` | `200 OK` / `400 Bad Request` / `403 Forbidden` / `404 Not Found` |
| `POST` | `/api/v1/goals/:goalId/pause` | Tạm dừng mục tiêu (`PAUSE`) | `params: { goalId }`, `query: { userId }` | `200 OK` / `400 Bad Request` / `403 Forbidden` / `404 Not Found` |

---

## 7. ĐÁNH GIÁ CHUYÊN MÔN KỸ THUẬT PHẦN MỀM (SE CODE AUDIT & ASSESSMENT)

### 7.1. Điểm mạnh (Key Strengths)
1. **Kiến trúc mạch lạc:** Dự án phân chia rõ ràng theo từng feature module và từng tầng (Controller - Service - Repository), giúp việc bảo trì và làm việc nhóm cực kỳ thuận lợi.
2. **Quy chuẩn Validation đồng bộ:** Sử dụng Joi middleware chặn dữ liệu sai ngay từ cửa ngõ Router, tránh ô nhiễm dữ liệu xuống tầng Service và Database.
3. **Quản lý lỗi chuẩn hóa:** Việc đóng gói `ApiError` và `errorHandler` tập trung giúp API trả về format thống nhất, tạo điều kiện thuận lợi cho đội ngũ Frontend xử lý lỗi (error mapping).
4. **Bảo mật cơ bản:** Mật khẩu người dùng được hash với `bcrypt` trước khi lưu CSDL, không bao giờ trả về trường `passwordHash` trong response.

### 7.2. Các điểm tồn tại & Cần cải tiến (Technical Debt & Improvements)

1. **Cơ chế Xác thực & Phân quyền (Authentication & Authorization):**
   - *Hiện trạng:* Các API của Goal đang yêu cầu client gửi `userId` thông qua `query` (`?userId=...`) hoặc `body`.
   - *Rủi ro:* Bất kỳ ai biết được `userId` của người khác đều có thể truy vấn hoặc thao tác nếu đoán được UUID.
   - *Giải pháp:* Cần triển khai hệ thống xác thực **JWT (JSON Web Token)**. Endpoint `/auth/login` sinh Token, và thêm middleware `authenticateToken` để giải mã token, tự động gắn `req.user = { id: ... }`.

2. **Lỗi chính tả trong Schema Prisma:**
   - Trong `backend/prisma/schema.prisma`:
     ```prisma
     model Goal {
       ...
       use User @relation(fields: [userId], references: [id])
     }
     ```
     Trường quan hệ đặt tên là `use` thay vì `user`. Cần refactor lại thành `user User @relation(...)`.

3. **Validation lặp lại ở Tầng Repository:**
   - Trong `goalsRepository.js` xuất hiện việc tự gọi lại Joi để validate (`validateGoalBeforeCreate`, Joi update trong `updateGoal`).
   - Theo nguyên tắc SRP, tầng Repository chỉ nên chịu trách nhiệm truy vấn CSDL. Việc validate định dạng thuộc về Middleware/Controller, và validate quy tắc thuộc về Service.

4. **Kiểu dữ liệu trạng thái (Enum):**
   - Thuộc tính `status` ở cả `User` và `Goal` đang dùng kiểu `String`. Nên chuyển sang `enum GoalStatus { ACTIVE, PAUSED, COMPLETED, ARCHIVED }` trong Prisma để đảm bảo tính toàn vẹn dữ liệu ở mức database.

5. **Frontend hiện tại:**
   - Frontend vẫn là template nguyên bản của Vite React (chưa có UI đăng ký/đăng nhập, bảng danh sách mục tiêu, form tạo mục tiêu, thư viện routing như `react-router-dom`, hay thư viện gọi API như `axios`/`react-query`).

---

## 8. HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY DỰ ÁN (GETTING STARTED)

### 8.1. Yêu cầu môi trường
- Node.js version 18.x hoặc cao hơn.
- PostgreSQL database instance (cục bộ hoặc trên mây như Supabase / Neon / Docker).

### 8.2. Khởi chạy Backend
```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài đặt các thư viện phụ thuộc
npm install   # hoặc yarn install

# 3. Tạo file .env và cấu hình chuỗi kết nối
# Ví dụ: DATABASE_URL="postgresql://user:password@localhost:5432/life_quest_db"

# 4. Chạy migration Prisma để cập nhật CSDL
npx prisma migrate dev

# 5. Chạy server ở chế độ Development (hỗ trợ Hot Reload qua Nodemon & Babel)
npm run dev
# Server lắng nghe tại: http://localhost:3000
```

### 8.3. Khởi chạy Frontend
```bash
# 1. Di chuyển vào thư mục front-end
cd ../front-end

# 2. Cài đặt các thư viện
npm install   # hoặc yarn install

# 3. Khởi chạy Vite dev server
npm run dev
# Mở trình duyệt tại: http://localhost:5173
```

---

## 9. LỘ TRÌNH PHÁT TRIỂN TIẾP THEO (ROADMAP ĐỒ ÁN)

- [ ] **Giai đoạn 1: Hoàn thiện Auth:** Xây dựng module Auth (Đăng nhập, Đăng ký, Cấp phát JWT & Refresh Token, Middleware kiểm tra quyền).
- [ ] **Giai đoạn 2: Bổ sung tính năng Nhiệm vụ con (Sub-tasks / Milestones):** Cho phép một Goal có nhiều Checklist/Milestones nhỏ hơn để người dùng theo dõi % hoàn thành.
- [ ] **Giai đoạn 3: Tính năng Gamification (Life-Quest Core):** Tích hợp điểm kinh nghiệm (EXP), Cấp bậc (Level), và Huy hiệu (Badges) khi người dùng hoàn thành mục tiêu.
- [ ] **Giai đoạn 4: Xây dựng Giao diện Frontend (React):** Tích hợp TailwindCSS/ChakraUI, React Router, Axios/React Query, thiết kế Dashboard, Goal Manager, Profile.
- [ ] **Giai đoạn 5: Testing & Deployment:** Viết Unit Test (Jest/Vitest), Integration Test cho API, cấu hình Docker và CI/CD GitHub Actions.
