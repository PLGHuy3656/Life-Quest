# FE-06A.1 — Floating Chat Bubble State Machine

## 1. State Slices (`useMessengerStore`)
| Slice | Type | Default | Persisted (`localStorage`) |
| --- | --- | --- | --- |
| `floatingEnabled` | `boolean` | `true` | Yes (scoped per account) |
| `openBubbleIds` | `string[]` | First 2 preview conversations | Yes (safe IDs only) |
| `activeFloatingConvId` | `string \| null` | `null` | No (in-memory session) |
| `dockSide` | `'left' \| 'right'` | `'left'` | Yes (scoped per account) |
| `normalizedY` | `number` (`0..1`) | `0.82` | Yes (scoped per account) |
| `accountScope` | `string` | `'preview-guest'` / `'user_<id>'` | Key prefix only |

## 2. Three Distinct User Actions (Persistence Rules)
| Action | `floatingEnabled` | `openBubbleIds` | `activeFloatingConvId` | Survives Reload |
| --- | --- | --- | --- | --- |
| **A. Minimize** (`minimizeFloatingChat` / `Esc`) | Unchanged (`true`) | Unchanged | `null` | N/A (bubble stays open) |
| **B. Close Conversation Bubble** (`closeConversationBubble(id)`) | Unchanged (`true`) | Removes `id` only | `null` if `id` was active | Yes (`openBubbleIds` updated) |
| **C. Disable Floating Chat** (`setFloatingEnabled(false)`) | `false` | Preserved for re-enable | `null` | **Yes** — persists across route nav, reload & browser restart |

### Guardrails When Disabled (`floatingEnabled === false`)
- `FloatingChatHost` returns `null` (all bubbles & windows hidden).
- `openFloatingConversation(id)` without `forceEnable: true` is a no-op (incoming messages never auto-reopen bubbles).
- Full Messenger (`/messages`) remains 100% accessible with unread indicators intact.
- Re-enabling via Settings (`/settings` -> "Bong bóng chat") or Messenger header popover (`ChatBubbleSettings`) sets `floatingEnabled = true` and restores bubbles.

## 3. Drag, Bounds Clamping & Edge Snap
- Safe bounds calculated by `computeSafeDockBounds(viewportW, viewportH, dockHeight)`:
  - Respects `EDGE_MARGIN = 14px`.
  - Respects Desktop header (`80px`) and Tablet/Mobile header (`64px`) + bottom nav (`84px`).
- Drag threshold: `6px` movement distinguishes drag from click (`suppressClickUntilRef` blocks accidental clicks for `220ms` after drop).
- Edge snap on release: snaps horizontally to `'left'` if dock center `< viewportW / 2`, else `'right'`.
- Vertical position is stored as normalized `[0, 1]` ratio (`normalizedY`), never raw pixel coordinates, so viewport resizes always recalculate inside visible bounds.
- Keyboard alternative on drag handle (`floating-dock-drag-handle`):
  - `ArrowLeft` / `ArrowRight`: snap to left / right edge.
  - `ArrowUp` / `ArrowDown`: nudge `normalizedY` by `±0.12`.
  - `Home`: reset to default collision-aware position.

## 4. Overflow Policy
- Maximum `3` simultaneously visible bubbles (`MAX_VISIBLE_BUBBLES = 3`).
- Additional open bubbles appear in the `+N` overflow menu (`floating-dock-overflow-menu`). Selecting an overflow bubble moves it to the front (`reorderBubbleToFront`) and expands it.
