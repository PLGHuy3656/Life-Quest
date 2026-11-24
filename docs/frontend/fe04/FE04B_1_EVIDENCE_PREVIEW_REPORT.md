# FE-04B.1 — Adaptive Local Evidence Preview Report

**Component:** [TaskEvidenceSection.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/TaskEvidenceSection.tsx)
**Reused Primitives:** [SocialMediaGrid.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/dashboard/media/SocialMediaGrid.tsx) (with `suppressSocialDialogue` prop to decouple from Social Feed dialogue), [SocialImagePreview.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/dashboard/media/SocialImagePreview.tsx), [SocialMediaLightbox.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/dashboard/media/SocialMediaLightbox.tsx), and [mediaValidation.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/features/dashboard/media/mediaValidation.ts).

---

## 1. Capabilities

- **Local File Selection & Validation:** Accepts `JPG`, `PNG`, `WebP`, `GIF`, `AVIF` up to `8 MB` (up to `8` local images), surfacing clear Vietnamese validation errors for invalid types or oversized files.
- **Adaptive Layout & Lightbox:** Preserves intrinsic aspect ratios for single images, uses adaptive 2/3/4+ grids with `+N` overflow badge, and opens full-resolution keyboard-navigable lightbox (`Escape`, `ArrowLeft`, `ArrowRight`) with focus return.
- **Object URL Memory Safety:** Every `URL.createObjectURL()` handle is explicitly revoked via `URL.revokeObjectURL()` on individual removal, replacement, Clear All, and component unmount (verified in [FocusSession.test.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/FocusSession.test.tsx)).
- **Fox Dialogue:** Emits `EVIDENCE_SELECTED` with explicit copy stating the preview is local-only and not yet uploaded.

---

## 2. Honest Limitations & Boundaries

- **LOCAL PREVIEW vs PENDING BACKEND:** Clearly labeled `XEM TRƯỚC CỤC BỘ • CHƯA TẢI LÊN` when images are selected and `UPLOAD: PENDING API` when empty.
- Never presents local files as saved server evidence, never creates fake evidence records, and never auto-publishes to Social Feed.
- Preserves optional-evidence messaging when `proofRequirement === 'NONE'`.
