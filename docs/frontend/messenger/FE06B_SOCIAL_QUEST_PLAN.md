# FE-06B — Private Social Interactions Plan (Future Checkpoint)

**Status:** PLANNED — Do not implement until `FE-06A` receives user visual approval.

## Planned Scope
1. **Guided Create Group Modal:** Search/select friends, nonempty group name validation, optional group avatar selection, deduplicated participant review, and honest preview/pending mutation state until Backend Group API ships.
2. **Invite / Add Members:** Inline member management in `ConversationDetailsPanel` gated by Backend group-owner authorization.
3. **Photo Sharing & Locket-Style Moments:** Multi-image adaptive grids (`1`, `2`, `3`, `4+` with `+N` overlay), caption composer, source linkage (`Message`, `Task evidence`, `Quest Moment`), and presigned upload hook ready for Backend Media API.
4. **Quest Invitations & Duo / Group Challenges:** Interactive invite/challenge composer sheet bound to existing Quest (`Goal`) hierarchy, with explicit `Pending / Accepted / Declined / Expired / Cancelled / Already joined` states owned by Backend.
