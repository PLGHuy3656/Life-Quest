# FE-06A — Messenger Visual QA & Responsive Report

## 1. Viewport & Layout Verification
| Viewport | Horizontal Overflow | Vertical Doc Overflow | WebGL Canvases | `FoxCompanionRail` | Console Errors |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop `1024×900` | `0px` | `0px` | `0` | `0` (hidden) | `0` |
| Desktop `1280×900` | `0px` | `0px` | `0` | `0` (hidden) | `0` |
| Desktop `1440×900` | `0px` | `0px` | `0` | `0` (hidden) | `0` |
| Desktop `1920×1080` | `0px` | `0px` | `0` | `0` (hidden) | `0` |
| Tablet `820×1180` | `0px` | Internal scroll | `0` | `0` | `0` |
| Mobile `390×844` | `0px` | Internal scroll | `0` | `0` | `0` |

## 2. All 16 Captured & Inspected Screenshots (`docs/frontend/messenger/screenshots/`)
1. [01_messenger_default.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/messenger/screenshots/01_messenger_default.png) — Messenger default view
2. [02_private_conversation.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/messenger/screenshots/02_private_conversation.png) — Private conversation (`Minh Anh`)
3. [03_group_conversation.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/messenger/screenshots/03_group_conversation.png) — Group conversation (`Nhóm Chạy Bộ Sáng 6h`)
4. [04_chat_with_images_lightbox.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/messenger/screenshots/04_chat_with_images_lightbox.png) — Image message + `SocialMediaLightbox`
5. [05_composer_with_attachment.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/messenger/screenshots/05_composer_with_attachment.png) — Composer with local image attachment preview
6. [06_conversation_search.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/messenger/screenshots/06_conversation_search.png) — Conversation search (`IELTS`)
7. [07_filtered_group_list.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/messenger/screenshots/07_filtered_group_list.png) — Filtered group list (`Nhóm`)
8. [08_open_conversation_details.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/messenger/screenshots/08_open_conversation_details.png) — Open 3-column Conversation Details panel
9. [09_empty_state.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/messenger/screenshots/09_empty_state.png) — Empty conversations state
10. [10_pending_api_state.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/messenger/screenshots/10_pending_api_state.png) — Pending Backend API state
11. [11_desktop_1024x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/messenger/screenshots/11_desktop_1024x900.png) — Desktop `1024×900`
12. [12_desktop_1280x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/messenger/screenshots/12_desktop_1280x900.png) — Desktop `1280×900`
13. [13_desktop_1440x900.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/messenger/screenshots/13_desktop_1440x900.png) — Desktop `1440×900`
14. [14_desktop_1920x1080.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/messenger/screenshots/14_desktop_1920x1080.png) — Desktop `1920×1080`
15. [15_tablet_820x1180.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/messenger/screenshots/15_tablet_820x1180.png) — Tablet layout (`820×1180`)
16. [16_mobile_390x844.png](file:///D:/Development/LifeQuest_Repo/docs/frontend/messenger/screenshots/16_mobile_390x844.png) — Mobile layout (`390×844`)

## 3. Issues Caught & Repaired During Visual Inspection
- Hid `FloatingMascotDock` on `/messages` so the bottom-right Voice button never overlaps the Messenger Send button on tablet/mobile.
- Adjusted tablet `.messengerShell` height (`calc(100dvh - 188px)`) to clear the floating `.tabletPillNav` cleanly.
- Suppressed native WebKit search cancel icon so only one crisp clear button renders in the sidebar search input.
