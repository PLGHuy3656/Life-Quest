# STREAKS, DUOS & CHALLENGES API DOCUMENTATION

Tài liệu chi tiết các endpoint thuộc các module **Streaks**, **Duos**, **Challenges** và các cập nhật tích hợp cho **Today** và **Mascot (Fox V2)**.

---

## 1. Module Streaks (`/api/v1/streaks`)

### 1.1 Lấy thông tin Streak của tôi
- **Endpoint:** `GET /api/v1/streaks/me`
- **Auth:** Bắt buộc (Bearer Token)
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "currentStreak": 5,
    "longestStreak": 14,
    "lastCompletedDate": "2026-11-23T04:41:31.000Z",
    "freezeCount": 1,
    "isFrozenToday": false,
    "flameTier": "orange"
  }
}
```
*Ghi chú về `flameTier`:* Khớp chuẩn với `StreakFlame.ts` của Frontend:
- `< 3`: `null`
- `3..6`: `"orange"`
- `7..13`: `"blue"`
- `14..29`: `"purple"`
- `>= 30`: `"crimson"`

### 1.2 Đóng băng Streak (Streak Freeze)
- **Endpoint:** `POST /api/v1/streaks/freeze`
- **Auth:** Bắt buộc
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Streak has been protected with freeze for today",
  "data": {
    "currentStreak": 5,
    "freezeCount": 0,
    "isFrozenToday": true,
    "lastCompletedDate": "..."
  }
}
```
- **Lỗi có thể trả về:**
  - `400 INSUFFICIENT_FREEZE`: `freezeCount <= 0` (hết lượt đóng băng).
  - `409 ALREADY_FROZEN`: Đã đóng băng trong ngày hôm nay rồi.

---

## 2. Module Duos (`/api/v1/duos`)

### 2.1 Mời bạn bè làm Duo Quest
- **Endpoint:** `POST /api/v1/duos/invite`
- **Auth:** Bắt buộc
- **Body:**
```json
{
  "partnerId": "uuid",
  "questId": "uuid",
  "title": "Chạy bộ buổi sáng",
  "targetValue": 3,
  "expiresInDays": 7
}
```
- **Quy tắc & Lỗi:**
  - User `FREE` chỉ được tối đa **1** Duo đang `ACTIVE`. Vượt quá trả `403 PREMIUM_REQUIRED`.
  - Hai người phải là bạn bè (`friendsService.areFriends()`) và không bị block. Nếu không là bạn bè trả `403 NOT_FRIENDS`.
  - Không thể tự mời chính mình (`400 INVALID_PARTNER`).
- **Response `201 CREATED`:**
```json
{
  "success": true,
  "message": "Duo partnership invitation sent successfully",
  "data": {
    "id": "uuid",
    "user1Id": "uuid",
    "user2Id": "partner-uuid",
    "status": "PENDING",
    "title": "Chạy bộ buổi sáng",
    "targetValue": 3,
    "user1Progress": 0,
    "user2Progress": 0,
    "rewardXp": 100,
    "rewardCoins": 50,
    "expiresAt": "2026-11-30T11:45:00.000Z"
  }
}
```

### 2.2 Chấp nhận lời mời Duo
- **Endpoint:** `POST /api/v1/duos/:id/accept`
- **Auth:** Bắt buộc (chỉ người nhận `user2Id` mới có quyền accept)
- **Quy tắc:** Kiểm tra quyền hạn `FREE` của người nhận.
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Duo invitation accepted",
  "data": {
    "id": "uuid",
    "status": "ACTIVE",
    "user1Progress": 0,
    "user2Progress": 0
  }
}
```

### 2.3 Từ chối lời mời Duo
- **Endpoint:** `POST /api/v1/duos/:id/reject`
- **Auth:** Bắt buộc (`user2Id`)
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Duo invitation rejected",
  "data": {
    "id": "uuid",
    "status": "CANCELLED"
  }
}
```

### 2.4 Lấy danh sách Duo đang hoạt động
- **Endpoint:** `GET /api/v1/duos/active`
- **Auth:** Bắt buộc
- **Response `200 OK`:** Trả về danh sách Duo ở trạng thái `ACTIVE` hoặc `PENDING`, kèm thông tin tóm tắt của đối tác (`partner`) và tiến độ (`myProgress`, `partnerProgress`, `combinedProgress`).

---

## 3. Module Challenges (`/api/v1/challenges`)

### 3.1 Danh sách thử thách
- **Endpoint:** `GET /api/v1/challenges`
- **Auth:** Tùy chọn (nếu có Token sẽ trả thêm `isJoined`, `myProgress`, `isCompleted`, `rewardClaimed`).
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Khởi động 3 ngày bền bỉ",
      "description": "Hoàn thành 3 quest trong tuần để giữ vững phong độ",
      "type": "COMMUNITY",
      "targetMetric": "QUEST_COUNT",
      "targetValue": 3,
      "rewardXp": 150,
      "rewardCoins": 60,
      "startAt": "2026-11-23T00:00:00.000Z",
      "endAt": "2026-11-30T23:59:59.000Z",
      "isActive": true,
      "participantCount": 12,
      "isJoined": true,
      "myProgress": 1,
      "isCompleted": false,
      "rewardClaimed": false
    }
  ]
}
```

### 3.2 Tham gia thử thách
- **Endpoint:** `POST /api/v1/challenges/:id/join`
- **Auth:** Bắt buộc
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Joined challenge successfully",
  "data": {
    "id": "uuid",
    "challengeId": "uuid",
    "userId": "uuid",
    "currentProgress": 0,
    "isCompleted": false
  }
}
```
- **Lỗi:** `409 ALREADY_JOINED` nếu user đã tham gia thử thách này.

### 3.3 Bảng xếp hạng Thử thách
- **Endpoint:** `GET /api/v1/challenges/:id/leaderboard?limit=20`
- **Auth:** Tùy chọn
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "userId": "uuid",
      "user": {
        "displayName": "Alex Tran",
        "username": "alex",
        "avatarUrl": "..."
      },
      "progress": 3,
      "isCompleted": true,
      "completedAt": "2026-11-23T10:00:00.000Z"
    }
  ]
}
```

---

## 4. Tích hợp Today & Fox V2 Mascot

### 4.1 Today API (`GET /api/v1/today`)
- **Key & Cấu trúc giữ nguyên 100%:**
```json
{
  "streak": {
    "currentCount": 5,
    "longestCount": 14,
    "isQualifiedToday": true,
    "lastQualifiedDate": "2026-11-23"
  }
}
```

### 4.2 Hoàn thành nhiệm vụ (`POST /api/v1/today/executions/:executionId/complete`)
- Khi gọi endpoint này, execution được đổi sang `COMPLETED`, đồng thời an toàn phát event `QUEST_COMPLETED`.
- Event này tự động kích hoạt:
  1. Cập nhật `UserStreak` (+1 streak nếu là ngày mới).
  2. Tăng tiến độ các `DuoPartnership` đang active (tự hoàn thành và thưởng XP/Coin x2 khi đạt target).
  3. Tăng tiến độ các `Challenge` mà user đã join (tự hoàn thành và cộng thưởng XP/Coin).

### 4.3 Mascot Visual State (`GET /api/v1/mascot/state?modelCode=FOX_V2`)
- Đã bổ sung trường `visualState` vào response phục vụ hiển thị lửa streak:
```json
{
  "model": { ... },
  "visualState": {
    "streak": {
      "active": true,
      "days": 5,
      "tier": "orange"
    }
  }
}
```
