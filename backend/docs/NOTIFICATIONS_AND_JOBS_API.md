# NOTIFICATIONS & SCHEDULED JOBS API DOCUMENTATION

Tài liệu chi tiết các API của module **Notifications** và 4 **Scheduled Cron Jobs** trên nhánh `feature/notifications-and-jobs`.

---

## 1. Module Notifications (`/api/v1/notifications`)

Tất cả endpoint đều yêu cầu xác thực JWT (`Authorization: Bearer <accessToken>`).

### 1.1 Lấy danh sách thông báo
- **Endpoint:** `GET /api/v1/notifications`
- **Query Params:**
  - `page` (number, default `1`)
  - `limit` (number, default `20`, max `100`)
  - `isRead` (boolean, optional — lọc đã đọc / chưa đọc)
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "userId": "uuid",
        "type": "friend.request",
        "title": "Lời mời kết bạn mới",
        "body": "Bạn vừa nhận được một lời mời kết bạn mới.",
        "data": {
          "requesterId": "uuid",
          "friendshipId": "uuid"
        },
        "isRead": false,
        "readAt": null,
        "createdAt": "2026-11-26T08:00:00.000Z"
      }
    ],
    "unreadCount": 3,
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12,
      "totalPages": 1
    }
  }
}
```

### 1.2 Đánh dấu 1 thông báo đã đọc
- **Endpoint:** `POST /api/v1/notifications/:id/read`
- **Response `200 OK`:** Trả về bản ghi `Notification` đã cập nhật (`isRead: true`, `readAt`).
- **Lỗi:** `404 NOTIFICATION_NOT_FOUND` nếu không tồn tại hoặc không thuộc user hiện tại.

### 1.3 Đánh dấu tất cả thông báo đã đọc
- **Endpoint:** `POST /api/v1/notifications/read-all`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "updatedCount": 3
  }
}
```

### 1.4 Lấy cài đặt thông báo
- **Endpoint:** `GET /api/v1/notifications/settings`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "notificationEnabled": true,
    "timezone": "UTC",
    "updatedAt": "2026-11-26T08:00:00.000Z"
  }
}
```

### 1.5 Bật/tắt thông báo
- **Endpoint:** `PATCH /api/v1/notifications/settings`
- **Body:**
```json
{
  "notificationEnabled": false
}
```
- **Lưu ý:** Khi `notificationEnabled = false`, mọi thông báo sinh từ EventBus lẫn Cron Jobs sẽ được bỏ qua tự động.

---

## 2. Event-Driven Notifications (EventBus)

Hệ thống tự động lắng nghe các sự kiện phát ra từ các module hiện có (bọc `try/catch` không xâm lấn):

| Event Type | Nguồn phát | Người nhận |
|---|---|---|
| `friend.request` | `friendsService.sendFriendRequest` | `receiverId` |
| `friend.accepted` | `friendsService.acceptFriendRequest` | `requesterId` |
| `social.poke` | `friendsService.sendPoke` | `receiverId` |
| `social.reaction` | `socialService.toggleReaction` (khi added) | Chủ bài viết (nếu khác actor) |
| `social.comment` | `socialService.addComment` | Chủ bài viết (nếu khác actor) |
| `duo.invite` | `duosService.createDuo`, `invitePartner` | `partnerId` |
| `duo.accepted` | `duosService.acceptDuoInvitation` | `creatorId` |
| `streak.milestone` | `streaksService.recordStreakProgress` (mốc 3, 7, 14, 30, 50, 100, 365) | `userId` |
| `challenge.invite` | `challengesService.inviteMember` | `targetUserId` |

---

## 3. Scheduled Cron Jobs (`backend/src/jobs/`)

Các cron job tự khởi chạy trong `server.js` qua `startScheduledJobs()` (tự động **không khởi chạy** khi `process.env.NODE_ENV === 'test'`). Mỗi job được tách thành hàm async độc lập để test trực tiếp:

| Job Function | Lịch chạy mặc định | Nghiệp vụ |
|---|---|---|
| `runStreakRiskJob()` | `0 20 * * *` (20:00) | Quét `Streak` có `currentCount > 0` chưa qualify hôm nay, gửi thông báo `streak.at_risk` (có chống gửi trùng trong ngày). |
| `runStreakDailyResetJob()` | `5 0 * * *` (00:05) | Quét `Streak` bỏ lỡ hôm qua. Nếu user có item `STREAK_FREEZE` trong `UserInventory` (`quantity > 0`) → tiêu thụ 1 item để giữ chuỗi (`streak.frozen`); ngược lại đặt `currentCount = 0` (`streak.lost`). |
| `runDuoDailyJob()` | `10 0 * * *` (00:10) | Hủy các lời mời Duo `PENDING` quá 48h (`DISBANDED`). Đánh giá các Duo `ACTIVE` ngày hôm qua: cả 2 hoàn thành → tăng `currentStreak`; có người bỏ lỡ → reset về 0 và báo `duo.streak_lost`. |
| `runChallengeCompletionJob()` | `*/5 * * * *` (mỗi 5 phút) | Chuyển Challenge `UPCOMING` đến `startAt` sang `ACTIVE`. Chốt các Challenge `ACTIVE` có `endAt <= now` trong `$transaction` (`updateMany` khóa `ACTIVE -> COMPLETED`), xếp `rank` + `finalScore`, trao thưởng XP/Coin **idempotent** qua `XpTransaction` (`challenge_reward:${challengeId}:${userId}:xp`) và `CoinTransaction` (`challenge_reward:${challengeId}:${userId}:coin`), cập nhật `UserGamification`, gửi thông báo `challenge.completed`. |
