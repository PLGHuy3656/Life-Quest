# LifeQuest AI Pipeline — Kiến trúc, Luồng hoạt động & Hướng dẫn Kiểm thử

Tài liệu mô tả đầy đủ dịch vụ độc lập `ai-pipeline/` (Node.js + TypeScript, cổng mặc định `8001`) phụ trách toàn bộ lớp **Trí tuệ nhân tạo & Gắn kết thông minh** cho hệ sinh thái LifeQuest, tách biệt hoàn toàn với `front-end/` và `backend/`.

---

## 1. Kiến trúc tổng quan (Hybrid AI)

```text
Client / Backend  --->  ai-pipeline (:8001)  --->  [Gemini 2.5 Flash / Embedding]  (khi có AI_API_KEY)
                                             --->  [BM25 + Semantic / Rule Engines] (fallback tức thì, không chết app)
```

- **Độc lập & An toàn:** API key (`AI_API_KEY`) chỉ nằm trên server `ai-pipeline/.env`, tuyệt đối không lộ xuống trình duyệt.
- **Chế độ Hybrid:** Hoạt động đầy đủ ngay cả khi chưa cấu hình `AI_API_KEY` (dùng BM25, Rubric ngữ nghĩa, Rule Engine & Mock Fixtures chuẩn schema nhóm). Khi gắn `AI_API_KEY`, hệ thống tự nâng cấp sang Gemini Multimodal Vision (`gemini-2.5-flash`) và Gemini Embeddings (`text-embedding-004`).

---

## 2. Danh mục REST API chính thức (`/v1/*`)

| Nhóm dịch vụ | Endpoint | Chức năng chính |
| :--- | :--- | :--- |
| **Health & Capabilities** | `GET /health`<br>`GET /v1/capabilities` | Kiểm tra trạng thái dịch vụ và danh mục 11 dịch vụ AI |
| **Fox Companion Chat** | `POST /v1/assistant/chat`<br>`GET /v1/assistant/sessions/:sessionId`<br>`DELETE /v1/assistant/sessions/:sessionId` | Hội thoại tổng quát hóa (RAG + đời thường/trêu đùa/cảm xúc + ranh giới ngoài phạm vi), tự thích ứng sắc thái theo tình huống, nén câu trả lời gọn `<= 230` ký tự, lưu 50 tin nhắn/phiên |
| **Knowledge Base (RAG)** | `GET /v1/knowledge/documents`<br>`POST /v1/knowledge/search` | 12 Atomic Chunks về LifeQuest + Hybrid Search (BM25 + Gemini Embeddings `text-embedding-004`) |
| **Proof Verification** | `POST /v1/proofs/verify` | Xác thực ảnh hoàn thành nhiệm vụ bằng Gemini Vision / Rubric 4 tiêu chí (`Liên quan`, `Chân thực`, `Nỗ lực`, `Rõ nét`), chống trùng ảnh SHA-256, thưởng `+10 Bonus XP` cho ảnh xuất sắc |
| **Goal Roadmaps** | `POST /v1/roadmaps/generate`<br>`POST /v1/roadmaps/refine` | Thiết kế và tinh chỉnh lộ trình từ mục tiêu (Goal → Milestones → Quests → Lịch + XP/Coin) |
| **Recommendations** | `POST /v1/recommendations/analyze` | Phân tích hành vi 14 ngày (7 nhóm gợi ý ưu tiên) + chuẩn hóa giọng điệu Fox |
| **Wardrobe Stylist** | `POST /v1/wardrobe/recommendations` | Tư vấn mua/phối trang phục Fox 3D theo số dư Coin và ưu tiên hoàn thiện bộ 3/3 |
| **Progress Coaching** | `POST /v1/progress/evaluate` | Phát hiện mốc `50%` (Halfway), `80%` (Sprint), `100%` (Completed), `BEHIND_PACE` kèm payload thông báo đẩy |
| **Daily 07:00 Alarms** | `GET /v1/alarms/daily-wakeup`<br>`POST /v1/alarms/daily-wakeup/complete`<br>`POST /v1/alarms/analyze` | Nhiệm vụ báo thức Daily `07:00` (chơi 1 lần/ngày nhận Bonus điểm, tự xoay vòng 4 mini-game không trùng hôm qua) & phân tích Snooze |
| **Notification Scheduler** | `POST /v1/notifications/schedule` | Lập lịch đẩy FCM, tôn trọng Quiet Hours (`22:00–06:00`), ưu tiên `alarm.ringing`, lọc Mute và chống spam |
| **Group Streak Assist** | `POST /v1/groups/streak-assist` | Tính số thành viên còn thiếu theo luật `ALL_MEMBERS` / `THRESHOLD_PERCENT` và soạn thông báo cứu chuỗi nhóm |
| **Daily Reflection** | `POST /v1/reflections/daily-summary` | Tạo thẻ tổng kết cuối ngày (thành quả, điểm sáng, 1 gợi ý nhẹ cho sáng mai) |
| **Quality Benchmark** | `GET /v1/quality/benchmark` | Báo cáo chất lượng tự động (Chat Domain & Conciseness, Proof Rubric & Anti-cheat, Roadmap Schema, Latency) |

---

## 3. Hướng dẫn cài đặt, chạy & kiểm thử

### Cài đặt & Khởi chạy
```bash
cd ai-pipeline
npm install
cp .env.example .env   # (Tùy chọn) thêm AI_API_KEY nếu muốn bật Gemini thật
npm run dev            # Chạy tại http://localhost:8001
```

### Kiểm thử & Đánh giá chất lượng
```bash
cd ai-pipeline
npm run typecheck      # Kiểm tra kiểu TypeScript (strict)
npm test               # Chạy toàn bộ 8 file test (40 unit & integration tests)
npm run eval           # Chạy Quality Benchmark (Domain Accuracy, Proof Rubric, Schema, Latency)
npm run build          # Biên dịch ra dist/
```

### Kiểm tra nhanh bằng curl / PowerShell
```bash
curl http://localhost:8001/health
curl http://localhost:8001/v1/capabilities
curl http://localhost:8001/v1/quality/benchmark
```
