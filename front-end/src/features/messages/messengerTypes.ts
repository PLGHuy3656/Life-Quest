import type { SocialIllustrationKey } from '@/assets/social'

export type MessengerCapabilityStatus =
  | 'AVAILABLE'
  | 'PREVIEW ONLY'
  | 'PENDING BACKEND'
  | 'UNSUPPORTED'

export interface MessengerCapabilityEntry {
  id: string
  feature: string
  status: MessengerCapabilityStatus
  endpoint: string | null
  requestResponseTypes: string
  currentUiState: string
  pendingDependency: string
  securityBoundary: string
}

/**
 * Factual FE-06A API Capability Matrix audited against:
 * - back-end/src (no messaging, group chat, media upload, or streak-chat endpoints yet)
 * - front-end/src/services/api/* (auth, users, today, quests, goals, milestones, schedules)
 */
export const MESSENGER_API_CAPABILITY_MATRIX: readonly MessengerCapabilityEntry[] = [
  {
    id: 'auth_session',
    feature: 'Phiên đăng nhập & thông tin tài khoản hiện tại',
    status: 'AVAILABLE',
    endpoint: 'GET /api/v1/users/me',
    requestResponseTypes: 'UserProfileResponse',
    currentUiState: 'Đồng bộ tên người dùng khi đã đăng nhập',
    pendingDependency: 'Không có',
    securityBoundary: 'JWT Bearer + ProtectedRoute khi cần xác thực'
  },
  {
    id: 'quest_domain',
    feature: 'Danh sách Quest / Epic / Task hiện có',
    status: 'AVAILABLE',
    endpoint: 'GET /api/v1/goals, /api/v1/milestones, /api/v1/quests',
    requestResponseTypes: 'Goal[], Milestone[], Quest[]',
    currentUiState: 'Điều hướng mở Quest / Work Hub qua adapter đã xác thực',
    pendingDependency: 'Chưa có API chia sẻ / mời tham gia Quest qua chat',
    securityBoundary: 'Chỉ truy cập Quest thuộc quyền sở hữu user hiện tại'
  },
  {
    id: 'personal_chat',
    feature: 'Hội thoại cá nhân (1-1) & lịch sử tin nhắn',
    status: 'PREVIEW ONLY',
    endpoint: null,
    requestResponseTypes: 'Pending: ConversationDTO, MessageDTO, CursorPage<MessageDTO>',
    currentUiState: 'Hiển thị dữ liệu mẫu cục bộ (PREVIEW); gửi tin chỉ mô phỏng cục bộ',
    pendingDependency: 'Backend Messaging REST + Socket.IO + Redis Pub/Sub',
    securityBoundary: 'Backend phải kiểm tra quan hệ bạn bè & participant membership'
  },
  {
    id: 'group_chat',
    feature: 'Hội thoại nhóm & danh sách thành viên',
    status: 'PREVIEW ONLY',
    endpoint: null,
    requestResponseTypes: 'Pending: GroupConversationDTO, GroupMemberDTO',
    currentUiState: 'Hiển thị nhóm mẫu cục bộ; nút tạo nhóm & thêm thành viên ở trạng thái chờ API',
    pendingDependency: 'Backend Group Chat & Membership APIs (FE-06B)',
    securityBoundary: 'Chỉ thành viên được ủy quyền mới xem/gửi tin trong nhóm'
  },
  {
    id: 'read_receipts_presence',
    feature: 'Trạng thái đã gửi / đã nhận / đã xem & Online',
    status: 'PENDING BACKEND',
    endpoint: null,
    requestResponseTypes: 'Pending: PresenceEvent, ReadReceiptEvent',
    currentUiState: 'Không giả lập trạng thái Online hay Read Receipt',
    pendingDependency: 'Socket.IO presence & delivery receipt pipeline',
    securityBoundary: 'Tuân thủ cài đặt riêng tư trạng thái hoạt động'
  },
  {
    id: 'media_upload',
    feature: 'Gửi ảnh & thư viện ảnh chung trong chat',
    status: 'PENDING BACKEND',
    endpoint: null,
    requestResponseTypes: 'Pending: PresignedUploadResponse, MessageAttachmentDTO',
    currentUiState: 'Chọn & xem trước ảnh cục bộ (ObjectURL) + mở SocialMediaLightbox',
    pendingDependency: 'Backend Media Upload / Signed URL Storage API',
    securityBoundary: 'Kiểm tra MIME, giới hạn dung lượng & quyền xem ảnh theo hội thoại'
  },
  {
    id: 'quest_invitations',
    feature: 'Thẻ lời mời Quest & Thử thách Duo/Nhóm',
    status: 'PENDING BACKEND',
    endpoint: null,
    requestResponseTypes: 'Pending: QuestInvitationDTO, ChallengeDTO (FE-06B)',
    currentUiState: 'Hiển thị thẻ xem trước (PREVIEW); hành động Chấp nhận/Từ chối khóa chờ API',
    pendingDependency: 'Backend Collaborative Quest Invitation & Challenge APIs',
    securityBoundary: 'Mở thẻ xem trước không tự cấp quyền truy cập Quest'
  },
  {
    id: 'friendship_group_streak',
    feature: 'Chuỗi tình bạn & Chuỗi nhóm + Hiệu ứng Fox',
    status: 'PENDING BACKEND',
    endpoint: null,
    requestResponseTypes: 'Pending: FriendshipStreakDTO, GroupStreakDTO (FE-06C)',
    currentUiState: 'Hiển thị trạng thái xem trước trong chi tiết hội thoại; không tự cộng streak',
    pendingDependency: 'Backend Authoritative Streak Rules & Events',
    securityBoundary: 'Chỉ Backend quyết định streak hợp lệ, at-risk hoặc mất chuỗi'
  },
  {
    id: 'voice_video_call',
    feature: 'Gọi thoại / Gọi video trực tiếp',
    status: 'UNSUPPORTED',
    endpoint: null,
    requestResponseTypes: 'N/A',
    currentUiState: 'Không hiển thị nút gọi giả lập',
    pendingDependency: 'Ngoài phạm vi FE-06',
    securityBoundary: 'N/A'
  }
]

export type ConversationType = 'DIRECT' | 'GROUP'
export type ConversationFilter = 'ALL' | 'DIRECT' | 'GROUP'
export type AvatarTone = 'coral' | 'teal' | 'navy' | 'gold' | 'plum'
export type MessengerViewState = 'READY' | 'EMPTY' | 'PENDING_API' | 'UNAUTHORIZED'

export interface ChatImageItem {
  id: string
  src: string
  alt: string
  illustrationKey?: SocialIllustrationKey
  isLocalObjectUrl?: boolean
  caption?: string
}

export interface QuestInviteCardData {
  id: string
  title: string
  inviterName: string
  participantCount: number
  deadlineLabel: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED'
  targetRoute: string
}

export interface ChallengeCardData {
  id: string
  mode: 'DUO' | 'GROUP'
  title: string
  challengerName: string
  goalLabel: string
  durationLabel: string
  progressLabel: string
  status: 'PENDING' | 'ACTIVE'
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderInitials: string
  senderTone: AvatarTone
  isSelf: boolean
  timeLabel: string
  dateGroupLabel: string
  kind: 'TEXT' | 'IMAGE' | 'MIXED' | 'SYSTEM' | 'QUEST_INVITE' | 'CHALLENGE' | 'STREAK_NOTICE'
  text?: string
  images?: ChatImageItem[]
  questInvite?: QuestInviteCardData
  challenge?: ChallengeCardData
  isLocalPreviewSimulation?: boolean
}

export interface ConversationMember {
  id: string
  name: string
  initials: string
  tone: AvatarTone
  role: 'OWNER' | 'MEMBER'
  tagline: string
}

export interface SharedQuestRef {
  id: string
  title: string
  statusLabel: string
  route: string
}

export interface Conversation {
  id: string
  type: ConversationType
  title: string
  subtitle: string
  avatarInitials: string
  avatarTone: AvatarTone
  groupBadges?: readonly [string, string]
  unreadCount: number
  muted: boolean
  lastMessagePreview: string
  lastActivityLabel: string
  members: ConversationMember[]
  sharedQuests: SharedQuestRef[]
  streakLabel: string
  isPreviewFixture: true
}

export interface LocalAttachmentDraft {
  id: string
  fileName: string
  objectUrl: string
  sizeLabel: string
}
