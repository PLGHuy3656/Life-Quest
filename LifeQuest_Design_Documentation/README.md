# LifeQuest -- Project Design Documentation

## 1. Project

**LifeQuest: Hệ thống quản lý mục tiêu và thói quen cá nhân kết hợp trò
chơi hóa và tương tác xã hội**

Technology decision: - Backend: Node.js + Express.js - Database:
PostgreSQL - Architecture: Microservices-oriented, implemented as
independently runnable services - API style: REST `/api/v1` - Frontend:
Web/Mobile clients consume API contracts - Async communication:
Event-driven, RabbitMQ planned for cross-service events

## 2. Mục đích bộ tài liệu

Bộ tài liệu này là nguồn thiết kế chung để Frontend, Backend và các
thành viên phân tích làm việc song song.

Nguyên tắc: 1. Frontend không phụ thuộc implementation nội bộ của
Backend. 2. Backend triển khai đúng API contract. 3. Database thuộc
quyền sở hữu của từng service. 4. Business rule phải được mô tả trước
khi code. 5. Khi thay đổi API, database hoặc business rule phải cập nhật
tài liệu tương ứng.

## 3. Thứ tự đọc

1.  `requirements/`
2.  `architecture/`
3.  `database/`
4.  `api/`
5.  `ui/`
6.  `development/`

## 4. Quy tắc thay đổi

Mọi thay đổi lớn phải cập nhật: - Use Case - Business Rules - API
contract - Database model - Event contract nếu có - UI flow nếu ảnh
hưởng frontend
