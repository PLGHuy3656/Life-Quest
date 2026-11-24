# FE-05B — Photo / Evidence Lightbox Report

## 1. Shared Primitive Reuse
Rather than building a duplicate media viewer, FE-05B reuses and extends the existing shared [SocialMediaLightbox.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/dashboard/media/SocialMediaLightbox.tsx) with backward-compatible `LightboxMediaItem` metadata:
- `sourceTitle` & `sourceRoute` (with `onNavigate` CTA to open related Task/Quest detail)
- `author` & `capturedAt`
- `isDemo` badge (`Ảnh mẫu (Chờ Media API)`)
- **Focus restoration:** Captures `document.activeElement` on open and restores focus on unmount/close.

## 2. Accessibility & Controls
- `role="dialog"`, `aria-modal="true"`, full aspect-ratio preservation (`object-fit: contain`).
- `1 / N` counter, Previous (`ChevronLeft`) / Next (`ChevronRight`) buttons, `ArrowLeft` / `ArrowRight` keyboard navigation, `Escape` dismissal, and backdrop click close.
- Triggerable from:
  1. Month view cell Moment thumbnail (`calendar-cell-moment-thumb`)
  2. Right-side Daily Agenda Featured Moment card (`calendar-featured-moment`)
  3. Time-Based Day View top photo strip (`day-timeline-photo-btn`)

## 3. Media API Limitations & Integrity
- Backend Media / Quest Moments upload endpoints are currently `PENDING`.
- User-requested demo Moment thumbnails (`calendarDemoMoments.ts`) are explicitly labeled `(Ảnh mẫu)` / `Ảnh mẫu (Chờ Media API)` and are never represented as persisted uploaded evidence.
