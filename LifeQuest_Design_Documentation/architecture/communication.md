# Service Communication

## REST

Dùng khi client/service cần kết quả ngay.

Ví dụ:

``` text
Frontend -> Gateway -> Goal Service
GET /api/v1/goals
```

## Event

Dùng cho side effect không cần response ngay.

Ví dụ:

``` text
Goal Service
   |
   | QuestCompleted
   v
RabbitMQ
   +--> Gamification
   +--> Analytics
   +--> AI
```

## Timeout

Mọi synchronous service-to-service call phải có timeout.

## Retry

Chỉ retry lỗi transient. Không retry validation/authentication errors.

## Idempotency

Consumer phải lưu `eventId` đã xử lý hoặc dùng unique constraint.
