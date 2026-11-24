# FE-04C.2 — Quest Moments Gallery & Media Capability Spec

**Component:** [QuestMomentsGallery.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/QuestMomentsGallery.tsx)

---

## 1. Shared Media Reuse & Lifecycle Safety

- Reuses `validateImageFiles`, `ALLOWED_IMAGE_ACCEPT`, and `SocialMediaLightbox` from `front-end/src/features/dashboard/media/` without coupling to Social Feed publishing.
- Every selected local image creates an object URL via `URL.createObjectURL(file)` and deterministically calls `URL.revokeObjectURL(src)` on single-item removal, Clear All, and component unmount.

---

## 2. Backend Media Capability Matrix

| Capability | Status | Frontend Behavior |
| --- | --- | --- |
| Local multi-image selection & validation | **LIVE (Local)** | JPG/PNG/WebP/GIF/AVIF ≤ 8 MB via `validateImageFiles`. |
| Photo captions, author & checkpoint tags | **LIVE (Local)** | Attached to in-memory preview items; clearly labeled `XEM TRƯỚC CỤC BỘ • CHƯA TẢI LÊN`. |
| Full-size keyboard lightbox | **LIVE (Local)** | Reuses accessible `SocialMediaLightbox` (Escape, ArrowLeft/Right). |
| Persisted Quest Photo Upload | **PENDING API** | No fake upload request or success toast; awaits Backend Media Upload & Quest Media association endpoints. |
| Auto-share to Social Feed | **PROHIBITED** | Never auto-publishes Quest moments to Social Feed. |
