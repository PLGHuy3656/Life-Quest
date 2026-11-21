# TÀI LIỆU API: FRIENDS, SOCIAL & MASCOT (LIFE-QUEST)
> **Phiên bản:** 1.0.0 | **Ngày cập nhật:** 21/11/2026  
> **Nhánh:** `feature/friends-and-social`  
> **Base URL:** `http://localhost:3000/api/v1`

---

## 1. QUY CHUẨN CHUNG & AUTHENTICATION (XÁC THỰC)

Hệ thống sử dụng cơ chế helper `getCurrentUserId` để nhận diện người dùng hiện tại (trong giai đoạn chuẩn bị tích hợp JWT).

### Cách truyền `userId`:
Client có thể truyền qua một trong các cách sau (được ưu tiên theo thứ tự):
1. **Header (Khuyên dùng):** `x-user-id: <UUID>`
2. **Query Parameter:** `?userId=<UUID>`
3. **Request Body:** `{ "userId": "<UUID>", ... }`

> **Lỗi nếu thiếu `userId`:**
> `401 Unauthorized`
> ```json
> {
>   "success": false,
>   "error": {
>     "code": "UNAUTHORIZED",
>     "message": "Unauthorized: missing userId"
>   }
> }
> ```

---

## 2. MODULE FRIENDS (BẠN BÈ)

### 2.1. Lấy danh sách bạn bè
- **Endpoint:** `GET /friends`
- **Headers:** `x-user-id: <UUID>`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "friendshipId": "4a7199b4-b816-43b9-a68d-8153f3e1a039",
      "acceptedAt": "2026-11-21T07:15:00.000Z",
      "friend": {
        "id": "e0b9b3e1-...",
        "username": "dragon_slayer",
        "email": "slayer@lifequest.io",
        "status": "ACTIVE",
        "createdAt": "2026-11-01T00:00:00.000Z"
      }
    }
  ]
}
```

### 2.2. Tìm kiếm người dùng để kết bạn
- **Endpoint:** `GET /friends/search?q=<keyword>`
- **Headers:** `x-user-id: <UUID>`
- **Query:** `q`: từ khóa tìm kiếm theo `username` hoặc `email`.
- **Đặc tả logic:** Tự động loại trừ chính bản thân người gọi và các tài khoản có quan hệ `BLOCKED`.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "c1f7b822-...",
      "username": "fox_master",
      "email": "fox@lifequest.io",
      "status": "ACTIVE",
      "createdAt": "2026-11-10T00:00:00.000Z"
    }
  ]
}
```

### 2.3. Danh sách lời mời kết bạn (Pending Requests)
- **Endpoint:** `GET /friend-requests`
- **Headers:** `x-user-id: <UUID>`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "sent": [
      {
        "id": "req-id-1",
        "receiverId": "user-2",
        "status": "PENDING",
        "createdAt": "2026-11-21T07:00:00.000Z",
        "receiver": {
          "id": "user-2",
          "username": "alex",
          "email": "alex@gmail.com"
        }
      }
    ],
    "received": [
      {
        "id": "req-id-2",
        "requesterId": "user-3",
        "status": "PENDING",
        "createdAt": "2026-11-21T07:10:00.000Z",
        "requester": {
          "id": "user-3",
          "username": "bob",
          "email": "bob@gmail.com"
        }
      }
    ]
  }
}
```

### 2.4. Gửi lời mời kết bạn
- **Endpoint:** `POST /friend-requests`
- **Headers:** `x-user-id: <UUID>`
- **Body:**
```json
{
  "receiverId": "65b09822-4fe1-4cfa-bb09-3286bf5420ee"
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "friendship-uuid",
    "requesterId": "current-user-uuid",
    "receiverId": "65b09822-4fe1-4cfa-bb09-3286bf5420ee",
    "status": "PENDING",
    "createdAt": "2026-11-21T07:30:00.000Z",
    "updatedAt": "2026-11-21T07:30:00.000Z"
  }
}
```
- **Error Codes:**
  - `400 CANNOT_FRIEND_SELF`: Tự gửi lời mời cho chính mình.
  - `404 USER_NOT_FOUND`: Người nhận không tồn tại hoặc đã bị xóa.
  - `409 ALREADY_FRIENDS`: Hai người đã là bạn bè.
  - `409 FRIEND_REQUEST_PENDING`: Đã có lời mời đang chờ xử lý.
  - `403 USER_BLOCKED`: Một trong hai người đã chặn người kia.

### 2.5. Chấp nhận lời mời kết bạn
- **Endpoint:** `POST /friend-requests/:requestId/accept`
- **Headers:** `x-user-id: <UUID>`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "friendship-uuid",
    "status": "ACCEPTED",
    "acceptedAt": "2026-11-21T07:35:00.000Z"
  }
}
```
- **Error Codes:**
  - `403 FORBIDDEN_REQUEST_ACTION`: Chỉ người nhận mới có quyền chấp nhận.
  - `400 INVALID_REQUEST_STATUS`: Lời mời không ở trạng thái `PENDING`.

### 2.6. Từ chối lời mời kết bạn
- **Endpoint:** `POST /friend-requests/:requestId/reject`
- **Headers:** `x-user-id: <UUID>`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "friendship-uuid",
    "status": "REJECTED"
  }
}
```

### 2.7. Hủy kết bạn (Xóa quan hệ bạn bè)
- **Endpoint:** `DELETE /friends/:friendId`
- **Headers:** `x-user-id: <UUID>`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "message": "Friend removed successfully"
  }
}
```

### 2.8. Chặn người dùng (Block User)
- **Endpoint:** `POST /friends/:friendId/block`
- **Headers:** `x-user-id: <UUID>`
- **Đặc tả logic:** Cho phép chặn ngay cả khi chưa kết bạn, đang chờ kết bạn hoặc đã là bạn. Thiết lập `status = BLOCKED`, `blockedById = currentUserId`.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "friendship-uuid",
    "status": "BLOCKED",
    "blockedById": "current-user-uuid",
    "blockedAt": "2026-11-21T07:40:00.000Z"
  }
}
```

---

## 3. MODULE SOCIAL (BẢNG TIN & TƯƠNG TÁC)

### 3.1. Lấy Bảng tin cá nhân & bạn bè (Feed)
- **Endpoint:** `GET /feed?limit=20&cursor=<postId>`
- **Headers:** `x-user-id: <UUID>`
- **Phân trang:** Cursor-based Pagination. Lấy bài viết tiếp theo có `(createdAt < cursorPost.createdAt) OR (createdAt == cursorPost.createdAt AND id < cursorPost.id)`.
- **Quyền hiển thị:**
  - Bài viết của chính mình (mọi visibility: `PUBLIC`, `FRIENDS`, `PRIVATE`).
  - Bài viết của bạn bè `ACCEPTED` (visibility: `PUBLIC`, `FRIENDS`).
  - Tự động loại bỏ bài viết của người dùng bị block.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "post-uuid-1",
        "authorId": "user-uuid-2",
        "author": {
          "id": "user-uuid-2",
          "username": "champion_fox",
          "email": "fox@lifequest.io"
        },
        "content": "Vừa hoàn thành Quest 10km chạy bộ nhận 500 XP!",
        "mediaUrl": "https://images.unsplash.com/photo-run.jpg",
        "sourceType": "QUEST",
        "sourceId": "quest-uuid-123",
        "visibility": "FRIENDS",
        "createdAt": "2026-11-21T06:00:00.000Z",
        "updatedAt": "2026-11-21T06:00:00.000Z",
        "reactionCount": 12,
        "commentCount": 3,
        "reactions": [
          {
            "id": "reaction-uuid-1",
            "userId": "user-uuid-3",
            "type": "FIRE",
            "createdAt": "2026-11-21T06:05:00.000Z"
          }
        ]
      }
    ],
    "nextCursor": "post-uuid-2"
  }
}
```

### 3.2. Đăng bài viết mới
- **Endpoint:** `POST /posts`
- **Headers:** `x-user-id: <UUID>`
- **Body:**
```json
{
  "content": "Hôm nay quyết tâm đạt 7 ngày streak liên tục!",
  "mediaUrl": "https://example.com/trophy.png",
  "sourceType": "MILESTONE",
  "sourceId": "milestone-uuid-abc",
  "visibility": "FRIENDS"
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "new-post-uuid",
    "authorId": "current-user-uuid",
    "content": "Hôm nay quyết tâm đạt 7 ngày streak liên tục!",
    "mediaUrl": "https://example.com/trophy.png",
    "visibility": "FRIENDS",
    "createdAt": "2026-11-21T07:45:00.000Z"
  }
}
```

### 3.3. Xem chi tiết bài viết
- **Endpoint:** `GET /posts/:postId`
- **Headers:** `x-user-id: <UUID>`
- **Response `200 OK`:** Chi tiết bài viết, tác giả, danh sách reactions, số comment.

### 3.4. Chỉnh sửa bài viết
- **Endpoint:** `PATCH /posts/:postId`
- **Headers:** `x-user-id: <UUID>`
- **Body:** `{ "content": "Nội dung cập nhật...", "visibility": "PUBLIC" }`
- **Error:** `403 FORBIDDEN_POST_ACTION` nếu không phải chủ bài viết.

### 3.5. Xóa bài viết (Soft Delete)
- **Endpoint:** `DELETE /posts/:postId`
- **Headers:** `x-user-id: <UUID>`
- **Response `200 OK`:** `{ "success": true, "data": { "message": "Post deleted successfully" } }`

### 3.6. Thả / Đổi cảm xúc (Reaction)
- **Endpoint:** `POST /posts/:postId/reactions`
- **Headers:** `x-user-id: <UUID>`
- **Body:**
```json
{
  "type": "FIRE"
}
```
> **Ghi chú (OD-03):** Hỗ trợ các loại `LIKE`, `CELEBRATE`, `FIRE`, `CLAP`. Tự động `upsert` trên cặp `postId_userId` đảm bảo 1 người dùng có tối đa 1 reaction trên 1 bài viết.

### 3.7. Bỏ thả cảm xúc
- **Endpoint:** `DELETE /posts/:postId/reactions`
- **Headers:** `x-user-id: <UUID>`
- **Response `200 OK`:** `{ "success": true, "data": { "message": "Reaction removed successfully" } }`

### 3.8. Danh sách bình luận & Bình luận bài viết
- **Lấy bình luận:** `GET /posts/:postId/comments`
- **Tạo bình luận:** `POST /posts/:postId/comments`
  - Body: `{ "content": "Chúc mừng chiến hữu nhé!" }`
  - Tự động phát sinh event `POST_COMMENTED`.
- **Xóa bình luận:** `DELETE /comments/:commentId` (Soft delete, chỉ tác giả comment).

### 3.9. Chọc ghẹo / Khích lệ bạn bè (Poke)
- **Endpoint:** `POST /pokes`
- **Headers:** `x-user-id: <UUID>`
- **Body:**
```json
{
  "receiverId": "friend-user-uuid",
  "message": "Mau dậy làm Quest thôi nào!"
}
```
- **Ràng buộc nghiệp vụ:**
  - Bắt buộc phải là bạn bè (`ACCEPTED`).
  - Không bị chặn (`BLOCKED`).
  - **Cooldown 5 phút:** Nếu gửi lại trước 5 phút, server trả về mã lỗi:
    `429 POKE_RATE_LIMITED`
    ```json
    {
      "success": false,
      "error": {
        "code": "POKE_RATE_LIMITED",
        "message": "Poke cooldown active. Please wait 245s before poking again."
      }
    }
    ```
  - Tự động phát sinh event `POKE_SENT`.

---

## 4. MODULE MASCOT (LINH VẬT 3D FOX V2, PHÂN QUYỀN FREE/TRIAL/PREMIUM, TRANG SỨC & HÀNH ĐỘNG)

Hệ thống phân quyền Linh vật hoạt động theo nguyên tắc:
- **Free / Trial / Premium (`resolveEntitlement`):**
  - Tài khoản mới được tặng **3 ngày dùng thử Premium** (`trialEndsAt = createdAt + 3 days`).
  - Nếu `user.planType === 'PREMIUM'` hoặc đang trong thời gian Trial (`now < trialEndsAt`), `effectiveTier` sẽ là `PREMIUM`.
  - Ngược lại, `effectiveTier` là `FREE`.
  - Nếu không truyền `userId` (khách vãng lai, trang Login...), mặc định `effectiveTier` là `FREE`.
- **Hành vi chặn ở Backend (`assertTierAccess`):**
  - Khi người dùng ở gói `FREE` cố gắng kích hoạt hành động Premium hoặc đeo trang sức Premium, Backend lập tức chặn và trả về lỗi `403 PREMIUM_REQUIRED`.

---

### 4.1. Lấy danh sách Mascot Models
- **Endpoint:** `GET /mascot/models`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "model-uuid",
      "code": "FOX_V2",
      "name": "LifeQuest Fox V2",
      "assetPath": "06_EXPORTS/glb/fox_v2_anim_e2.glb",
      "requiredTier": "FREE",
      "sleepStartHour": 22,
      "sleepEndHour": 6,
      "createdAt": "2026-11-21T07:00:00.000Z"
    }
  ]
}
```

---

### 4.2. Lấy trạng thái, Entitlement, Trang phục & Thoại theo ngữ cảnh (`GET /mascot/state`)
- **Endpoint:** `GET /mascot/state?modelCode=FOX_V2&placement=DASHBOARD`
- **Headers (Tùy chọn):** `x-user-id: <UUID>` (nếu truyền sẽ tính toán quyền Premium/Trial và trả về trang phục đang mặc)
- **Query Parameters:**
  - `modelCode` *(string, default: `FOX_V2`)*: Mã linh vật.
  - `placement` *(string, default: `DASHBOARD`)*: Ngữ cảnh màn hình (`DASHBOARD`, `AUTH`, `PROFILE`, `ADMIN`, `SOCIAL`, `FOCUS`, `SHOP`).
- **Logic đặc tả:**
  - Trả về `entitlement`: `{ planType, effectiveTier, isTrial, trialEndsAt }`.
  - Trả về `behaviorConfig` tối ưu theo từng màn hình:
    - **`DASHBOARD`:** `{ "enableIdleLoop": true, "idleIntervalMs": 120000, "enableSleepMode": true }`.
    - **Các trang khác (`AUTH`, `PROFILE`, `ADMIN`, `SOCIAL`, `FOCUS`, `SHOP`):** `{ "enableIdleLoop": false, "idleIntervalMs": null, "enableSleepMode": false }`.
  - Trả về `equippedCosmetics`: Danh sách trang sức đang mặc trên 6 socket (`ATT_HAT`, `ATT_GLASSES`, `ATT_SCARF`, `ATT_BACKPACK`, `ATT_HAND_L`, `ATT_HAND_R`).
  - Trả về `actions`: Danh sách hành động của Fox V2, kèm cờ `isLocked: true/false` dựa trên `effectiveTier`.
  - Trả về `dialogues`: Tự động lọc thoại theo `placement`. Với user tier `FREE`, server tự động ẩn các câu thoại `PREMIUM`.
- **Response mẫu `200 OK`:**
```json
{
  "success": true,
  "data": {
    "model": {
      "id": "model-uuid",
      "code": "FOX_V2",
      "name": "LifeQuest Fox V2",
      "assetPath": "06_EXPORTS/glb/fox_v2_anim_e2.glb",
      "requiredTier": "FREE"
    },
    "placement": "DASHBOARD",
    "entitlement": {
      "planType": "FREE",
      "effectiveTier": "PREMIUM",
      "isTrial": true,
      "trialEndsAt": "2026-11-24T07:00:00.000Z"
    },
    "behaviorConfig": {
      "enableIdleLoop": true,
      "idleIntervalMs": 120000,
      "enableSleepMode": true
    },
    "sleepWindow": {
      "startHour": 22,
      "endHour": 6
    },
    "equippedCosmetics": [
      {
        "code": "COS_WIZARD_HAT",
        "name": "Mũ Phù Thủy Tập Sự",
        "slot": "ATT_HAT",
        "assetKey": "cosmetics/hat_wizard.glb",
        "requiredTier": "FREE",
        "equippedAt": "2026-11-21T08:00:00.000Z"
      }
    ],
    "actions": [
      {
        "id": "action-1",
        "code": "ACT_FOX_WAVE",
        "name": "Vẫy tay chào",
        "description": "Cáo vẫy tay chào đón người chơi",
        "clipName": "wave",
        "mood": "happy",
        "requiredTier": "FREE",
        "cooldownSeconds": 3,
        "isLocked": false
      },
      {
        "id": "action-4",
        "code": "ACT_FOX_VICTORY",
        "name": "Điệu nhảy Chiến thắng",
        "description": "Vũ điệu ăn mừng đặc biệt dành riêng cho thành viên Premium",
        "clipName": "victory_dance",
        "mood": "celebrate",
        "requiredTier": "PREMIUM",
        "cooldownSeconds": 5,
        "isLocked": false
      }
    ],
    "dialogues": {
      "IDLE_2MIN": [
        {
          "id": "d-1",
          "placement": "DASHBOARD",
          "requiredTier": "FREE",
          "actionType": null,
          "content": "Này bạn ơi! Đứng ngắm tui hoài vậy, làm quest tiếp đi chứ!",
          "clipName": "wave",
          "activity": "idle",
          "mood": null
        }
      ]
    }
  }
}
```

---

### 4.3. Lấy danh sách Trang sức / Phụ kiện (`GET /mascot/cosmetics`)
- **Endpoint:** `GET /mascot/cosmetics?modelCode=FOX_V2`
- **Headers (Tùy chọn):** `x-user-id: <UUID>`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cosmetic-uuid-1",
      "code": "COS_WIZARD_HAT",
      "name": "Mũ Phù Thủy Tập Sự",
      "slot": "ATT_HAT",
      "assetKey": "cosmetics/hat_wizard.glb",
      "coinPrice": 100,
      "requiredTier": "FREE",
      "isOwned": true,
      "isEquipped": true,
      "isLocked": false
    },
    {
      "id": "cosmetic-uuid-2",
      "code": "COS_CROWN_GOLD",
      "name": "Vương Miện Hoàng Kim",
      "slot": "ATT_HAT",
      "assetKey": "cosmetics/crown_gold.glb",
      "coinPrice": 500,
      "requiredTier": "PREMIUM",
      "isOwned": false,
      "isEquipped": false,
      "isLocked": true
    }
  ]
}
```

---

### 4.4. Mặc trang sức cho Linh vật (`POST /mascot/cosmetics/:cosmeticCode/equip`)
- **Endpoint:** `POST /mascot/cosmetics/:cosmeticCode/equip`
- **Headers:** `x-user-id: <UUID>`
- **Ràng buộc nghiệp vụ:**
  - Tự động kiểm tra quyền `assertTierAccess`. Nếu món đồ là `PREMIUM` mà người dùng ở gói `FREE`, trả về `403 PREMIUM_REQUIRED`.
  - **Quy tắc Socket (Slot):** Mỗi socket (`ATT_HAT`, `ATT_GLASSES`...) chỉ được đeo tối đa 1 món. Thao tác mặc món mới sẽ tự động tháo món cũ cùng socket trong 1 transaction an toàn.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "user-cosmetic-uuid",
    "userId": "user-uuid",
    "cosmeticId": "cosmetic-uuid",
    "isEquipped": true,
    "equippedAt": "2026-11-21T09:00:00.000Z",
    "cosmetic": {
      "code": "COS_WIZARD_HAT",
      "name": "Mũ Phù Thủy Tập Sự",
      "slot": "ATT_HAT",
      "assetKey": "cosmetics/hat_wizard.glb",
      "requiredTier": "FREE"
    }
  }
}
```

---

### 4.5. Tháo trang sức khỏi Linh vật (`DELETE /mascot/cosmetics/:cosmeticCode/equip`)
- **Endpoint:** `DELETE /mascot/cosmetics/:cosmeticCode/equip`
- **Headers:** `x-user-id: <UUID>`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "message": "Cosmetic 'COS_WIZARD_HAT' unequipped successfully"
  }
}
```

---

### 4.6. Kích hoạt hành động của Linh vật (`POST /mascot/actions/:actionCode/trigger`)
- **Endpoint:** `POST /mascot/actions/:actionCode/trigger`
- **Headers:** `x-user-id: <UUID>`
- **Ràng buộc:**
  - Nếu hành động là `PREMIUM` mà người dùng có `effectiveTier === 'FREE'`, trả về `403 PREMIUM_REQUIRED`.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "action-uuid",
    "code": "ACT_FOX_VICTORY",
    "name": "Điệu nhảy Chiến thắng",
    "clipName": "victory_dance",
    "mood": "celebrate",
    "requiredTier": "PREMIUM",
    "cooldownSeconds": 5
  }
}
```

---

## 5. BẢNG MÃ LỖI (ERROR CODES SUMMARY)

| HTTP Status | Error Code | Ý nghĩa |
| :--- | :--- | :--- |
| `400` | `VALIDATION_ERROR` | Lỗi định dạng dữ liệu đầu vào (Joi schema validation). |
| `400` | `CANNOT_FRIEND_SELF` | Không thể gửi lời mời kết bạn cho chính mình. |
| `400` | `CANNOT_BLOCK_SELF` | Không thể chặn chính mình. |
| `400` | `CANNOT_POKE_SELF` | Không thể tự chọc bản thân. |
| `400` | `INVALID_REQUEST_STATUS` | Trạng thái lời mời không hợp lệ để thao tác. |
| `401` | `UNAUTHORIZED` | Thiếu `userId` hợp lệ trong header, query hoặc body. |
| `403` | `PREMIUM_REQUIRED` | Tính năng hoặc vật phẩm yêu cầu gói LifeQuest Premium (hoặc đã hết hạn dùng thử). |
| `403` | `USER_BLOCKED` | Thao tác bị từ chối do quan hệ đã bị chặn. |
| `403` | `FORBIDDEN_REQUEST_ACTION` | Không có quyền thao tác trên lời mời kết bạn của người khác. |
| `403` | `FORBIDDEN_POST_ACTION` | Chỉ tác giả mới có quyền sửa hoặc xóa bài viết. |
| `403` | `FORBIDDEN_COMMENT_ACTION` | Chỉ tác giả mới có quyền xóa bình luận. |
| `403` | `NOT_FRIENDS` | Thao tác (như Poke) yêu cầu hai người phải là bạn bè. |
| `403` | `POST_VISIBILITY_FRIENDS_ONLY`| Bài viết chỉ dành cho bạn bè xem. |
| `403` | `POST_PRIVATE` | Bài viết ở chế độ riêng tư. |
| `404` | `USER_NOT_FOUND` | Người dùng không tồn tại hoặc đã bị xóa. |
| `404` | `FRIENDSHIP_NOT_FOUND` | Không tìm thấy quan hệ bạn bè. |
| `404` | `FRIEND_REQUEST_NOT_FOUND` | Không tìm thấy lời mời kết bạn. |
| `404` | `POST_NOT_FOUND` | Không tìm thấy bài viết. |
| `404` | `COMMENT_NOT_FOUND` | Không tìm thấy bình luận. |
| `404` | `MASCOT_MODEL_NOT_FOUND` | Không tìm thấy mã model linh vật. |
| `404` | `COSMETIC_NOT_FOUND` | Không tìm thấy mã trang sức linh vật. |
| `404` | `ACTION_NOT_FOUND` | Không tìm thấy mã hành động linh vật. |
| `409` | `ALREADY_FRIENDS` | Hai người đã là bạn bè. |
| `409` | `FRIEND_REQUEST_PENDING` | Lời mời kết bạn đang chờ xử lý. |
| `429` | `POKE_RATE_LIMITED` | Đang trong thời gian cooldown chọc bạn bè (5 phút). |

