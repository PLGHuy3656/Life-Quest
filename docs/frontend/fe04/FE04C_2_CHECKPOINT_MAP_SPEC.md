# FE-04C.2 — Checkpoint Journey Map Specification

**Component:** [QuestCheckpointMap.tsx](file:///D:/Development/LifeQuest_Repo/front-end/src/features/work/QuestCheckpointMap.tsx)

---

## 1. Authoritative Checkpoint Data Mapping (`buildQuestCheckpoints`)

1. **When Milestones exist (`milestones.length > 0`):** Ordered `Milestone[]` (`position` ascending) form the journey checkpoints. Linked active Tasks are grouped by `milestoneId`. Status (`completed | active | upcoming`) is derived strictly from verified Milestone status (first incomplete Milestone becomes `active`).
2. **When no Milestones exist:** Checkpoints are derived directly from active linked Tasks in deterministic `sortTasksActionFirst` order — providing an authentic journey map without duplicating a persisted checklist.
3. **Edge Cases Handled:**
   - **Zero Tasks / Zero Milestones:** Renders `"Điểm khởi hành sẵn sàng"` with `0%` progress and `+ Thêm Task đầu tiên` CTA (never fake `100%`).
   - **Many Checkpoints (`> 5`):** Horizontally scrollable SVG trail (`176px` spacing per node) so labels and nodes never compress into unreadable dots.
   - **Accessibility:** Semantic `<button>` nodes with `aria-pressed`, `aria-label` (stage index, title, status), keyboard-focusable scroll container (`tabIndex={0}`), and inline Checkpoint Inspector listing associated Tasks.
