# FE-03.5I — Desktop Visual Acceptance Report

**Scope:** Production Desktop `/` (Social-First Home) and cross-route shared `AppShell` (`/messages`, `/wardrobe`) across `1024×900`, `1280×900`, `1440×900`, and `1920×1080`.

---

## 1. Visual Captures

| Route & Viewport | Overflow | `<canvas>` | Header→Shell Left / Right Delta | Left / Center / Right Widths | Screenshot |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Home `/` `1440×900`** | `false` | `1` | **`0px / 0px`** | `236px` / `584px` / `348px` | [fe03_5i_home_1440x900.png](screenshots/fe03_5i_home_1440x900.png) |
| **Home `/` `1280×900`** | `false` | `1` | **`0px / 0px`** | `236px` / `584px` / `348px` | [fe03_5i_home_1280x900.png](screenshots/fe03_5i_home_1280x900.png) |
| **Home `/` `1024×900`** *(Compact)* | `false` | `1` | **`0px / 0px`** | `52px` / `592px` / `316px` | [fe03_5i_home_1024x900.png](screenshots/fe03_5i_home_1024x900.png) |
| **Home `/` `1920×1080`** | `false` | `1` | **`0px / 0px`** | `236px` / `584px` / `348px` | [fe03_5i_home_1920x1080.png](screenshots/fe03_5i_home_1920x1080.png) |
| **Messages `/messages` `1440×900`** | `false` | `1` | **`0px / 0px`** | `236px` / `584px` / `348px` | [fe03_5i_messages_1440x900.png](screenshots/fe03_5i_messages_1440x900.png) |
| **Wardrobe `/wardrobe` `1440×900`** | `false` | `1` | **`0px / 0px`** | `236px` / `584px` / `348px` | [fe03_5i_wardrobe_1440x900.png](screenshots/fe03_5i_wardrobe_1440x900.png) |

---

## 2. Visual Acceptance Checklist

- [x] Approved Social-First Dashboard composition preserved verbatim (`composer: 105px`, `firstPost.top: 209px` at all 4 widths).
- [x] Shared 3-island Header, `PinnedTaskRail`, and `FoxCompanionRail` persist cleanly across routes.
- [x] Exact `0px` outer alignment between Header islands and shared 3-region AppShell at `1024`, `1280`, `1440`, and `1920px`.
- [x] Zero overlapping interactive controls and zero horizontal overflow.
- [x] Single active WebGL renderer (`canvasCount === 1`) maintained across all routes including `/wardrobe`.
- [x] Social Feed remains the central focal point and scrolls naturally while both side rails stay sticky (`top: 92px`).
- [x] Tablet (`820×1180`) and Mobile (`390×844`) layouts remain untouched.
