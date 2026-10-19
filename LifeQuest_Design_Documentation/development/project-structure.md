# Recommended Backend Folder Structure

Đây là cấu trúc cho một service Node.js + Express:

``` text
service-name/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/
│   ├── validators/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   ├── events/
│   ├── utils/
│   ├── constants/
│   ├── app.js
│   └── server.js
├── migrations/
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── package.json
└── README.md
```

## Layer responsibility

### routes

Map HTTP method + path tới controller.

### controllers

Nhận request, gọi service, trả HTTP response.

### validators

Validate request body/query/path.

### services

Business logic.

### repositories

SQL/data access.

### models

Entity/type definitions nếu team sử dụng ORM/query builder.

### events

Publish/consume domain events.

### middlewares

Auth, error handling, logging, request context.

## Không làm

Controller không chứa SQL. Controller không tính XP. Repository không
chứa business rule. Frontend không truy cập PostgreSQL.
