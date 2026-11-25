# FE-06C — Friendship & Group Streak + Fox Plan (Future Checkpoint)

**Status:** PLANNED — Do not implement until `FE-06A` and `FE-06B` receive user visual approval.

## Planned Scope
1. **Separate Streak Models:** Distinct `Friendship Streak` (1-1) and `Group Streak` (multi-member) status cards in Chat Header, Timeline announcements, and `ConversationDetailsPanel` (`Active`, `At-Risk`, `Broken`, `Restored`, days count, next deadline) sourced strictly from Backend authoritative streak endpoints.
2. **Contextual Fox Animations in Chat:**
   - **Active Streak:** Fox holding fire (`TASK_COMPLETED` / streak achievement event).
   - **Broken Streak:** Fox struck by lightning, fire extinguishes (verified streak-loss event).
   - **Quest / Challenge:** Celebration, encouragement, surprise, and disappointment dialogue/motion cues.
3. **Rendering & Motion Safety:** Reuse approved Gate I Fox assets without modifying `.glb`/rig/SDK; avoid spawning extra WebGL canvases inside message bubbles (use lightweight approved visual fallback where needed) and respect `html.lq-rm` reduced-motion mode.
