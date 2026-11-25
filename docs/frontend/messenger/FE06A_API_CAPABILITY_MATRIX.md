# FE-06A — Messenger API Capability Matrix

Audited factually against `back-end/src` and `front-end/src/services/api/*` (canonical mirror in [messengerTypes.ts](file:///D:/Development/LifeQuest_Repo/front-end/src/features/messages/messengerTypes.ts)).

| Feature | Status | Verified Endpoint | Request / Response Types | Current UI State | Pending Dependency | Security / Permission Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| Auth Session & Current User | `AVAILABLE` | `GET /api/v1/users/me` | `UserProfileResponse` | Active when authenticated | None | JWT Bearer + ProtectedRoute |
| Quest / Epic / Task Domain | `AVAILABLE` | `GET /api/v1/goals`, `/milestones`, `/quests` | `Goal[]`, `Milestone[]`, `Quest[]` | Header & card shortcuts navigate to `/work/quests` | Collaborative Quest invite endpoints | Scoped strictly to authenticated owner |
| Personal Chat (1-1) & History | `PREVIEW ONLY` | `null` | Pending: `ConversationDTO`, `MessageDTO` | Local preview fixtures; local sends marked `Mô phỏng cục bộ` | Backend Messaging REST + Socket.IO + Redis | Must verify friendship & participant membership |
| Group Chat & Member List | `PREVIEW ONLY` | `null` | Pending: `GroupConversationDTO`, `GroupMemberDTO` | Preview group fixtures; Create Group & Add Member disabled/pending | Backend Group Chat & Membership APIs (`FE-06B`) | Only authorized group members may read/send |
| Online Presence & Read Receipts | `PENDING BACKEND` | `null` | Pending: `PresenceEvent`, `ReadReceiptEvent` | Never fabricated in FE-06A | Socket.IO presence & delivery pipeline | Respect user privacy settings |
| Image Upload & Shared Gallery | `PENDING BACKEND` | `null` | Pending: `PresignedUploadResponse`, `MessageAttachmentDTO` | Local `ObjectURL` preview + `SocialMediaLightbox` | Signed URL / Media Storage API | MIME/size validation + conversation-scoped access |
| Quest Invites & Duo/Group Challenges | `PENDING BACKEND` | `null` | Pending: `QuestInvitationDTO`, `ChallengeDTO` | Preview cards only; `Tham gia (Chờ API)` disabled | Backend Invitation & Challenge APIs (`FE-06B`) | Viewing preview card never grants Quest access |
| Friendship & Group Streaks | `PENDING BACKEND` | `null` | Pending: `FriendshipStreakDTO`, `GroupStreakDTO` | Static boundary note in Details panel; never incremented locally | Authoritative Streak Engine (`FE-06C`) | Backend owns streak rules & deadline enforcement |
| Voice / Video Calling | `UNSUPPORTED` | `null` | N/A | No fake call buttons rendered | Out of FE-06 scope | N/A |
