# FE-07A — LifeQuest Login Page Visual Specification (Minimalist Duolingo-Inspired)

**Status:** Implemented on `fix/FE` — Awaiting User Visual Approval (Not Committed / Not Pushed)  
**Scope:** Login Page (`/login`) Minimalist Centered Layout · Warm Companion Palette · Fox V2 Mascot · Desktop & Mobile  
**Primary Reference Viewport:** `1440×900`

---

## 1. Visual Direction

- **Layout Inspiration:** Minimalist centered single-column composition inspired by Duolingo's distraction-free login flow.
- **Brand Identity:** Warm cream/ivory LifeQuest canvas (`#FFF8F0`), crisp soft-white tactile inputs (`#FFFFFF`, `2px solid #E6D8C9`), dark navy typography (`#182640`), and Duolingo-style 3D tactile Fox Orange primary CTA (`#F26733`, bottom lip `#C84B1D`).
- **Fox V2 Mascot:** Lightweight approved Gate I `/fox_poster.png` (no background card, no extra WebGL `<canvas>`) positioned cleanly above the heading with subtle micro-reactions (`LOGIN_IDLE`, `EMAIL_FOCUS`, `PASSWORD_FOCUS`, `LOGIN_LOADING`, `LOGIN_ERROR`, `LOGIN_SUCCESS`).

---

## 2. Layout Structure (Desktop, Tablet & Mobile)

- **Top Bar (Full-width):**
  - Left: Minimal `×` close button returning to `/` (`Quay lại Trang chủ`).
  - Right: Tactile outlined pill button **`ĐĂNG KÝ`** linking to `/register` (switches to **`ĐĂNG NHẬP`** on `/register`, `/forgot-password`, and `/reset-password`).
- **Centered Column (`max-width: 392px`):**
  - Approved Gate I Fox V2 figure (`72px` desktop / `62px` mobile) + 1-line reactive status caption.
  - Centered bold heading: **`Đăng nhập`**.
  - Tactile inputs directly on the warm canvas:
    1. `Email` (`height: 50px`, `radius: 14px`, accessible screen-reader `<label>`)
    2. `Mật khẩu` (`height: 50px`, `radius: 14px`, with inline **`QUÊN?`** link + show/hide password eye icon inside the right edge)
  - Primary 3D CTA button: full-width uppercase **`ĐĂNG NHẬP`** (disabled with spinner **`ĐANG ĐĂNG NHẬP...`** during pending request).
  - Centered muted security note: tokens remain in browser memory (RAM) only, never written to `localStorage`.
  - **Honest API Boundary:** No fake Google / Facebook / Apple OAuth buttons (unsupported in Backend).

---

## 3. Implementation Files

- [AuthLayout.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/auth/AuthLayout.tsx)
- [LoginPage.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/auth/LoginPage.tsx)
- [AuthPages.module.css](file:///D:/Development/LifeQuest_Repo/front-end/src/features/auth/AuthPages.module.css)
- [AuthFlow.test.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/auth/AuthFlow.test.tsx)
- [auth.spec.ts](file:///D:/Development/LifeQuest_Repo/front-end/e2e/auth.spec.ts)
