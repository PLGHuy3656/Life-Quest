import type { SocialIllustrationKey } from '@/assets/social'
import type { PrivacyMode, QuestType } from '@/types/domain'

export type SocialCapabilityStatus = 'LIVE' | 'PENDING' | 'UNAVAILABLE'

export interface SocialCapabilityDescriptor {
  id: string
  label: string
  status: SocialCapabilityStatus
  endpoint: string | null
  note: string
}

/**
 * Factual Social & Friends capability matrix verified against:
 * - origin/develop (f9db2e1)
 * - origin/feature/friends-and-social (unmerged Backend feature branch)
 */
export const SOCIAL_CAPABILITY_MATRIX: Record<string, SocialCapabilityDescriptor> = {
  pinnedQuests: {
    id: 'pinnedQuests',
    label: 'Bảng ghim nhiệm vụ',
    status: 'LIVE',
    endpoint: 'GET /api/v1/quests & POST/DELETE /api/v1/quests/:id/pin',
    note: 'Đang hoạt động trực tiếp trên nhánh develop.'
  },
  quickCreateQuest: {
    id: 'quickCreateQuest',
    label: 'Tạo nhiệm vụ nhanh',
    status: 'LIVE',
    endpoint: 'POST /api/v1/quests',
    note: 'Ghi dữ liệu thật khi đã đăng nhập.'
  },
  defaultPrivacy: {
    id: 'defaultPrivacy',
    label: 'Cài đặt quyền riêng tư mặc định',
    status: 'LIVE',
    endpoint: 'GET/PATCH /api/v1/users/me/settings',
    note: 'Hỗ trợ PUBLIC / FRIENDS / PRIVATE.'
  },
  friendsFeed: {
    id: 'friendsFeed',
    label: 'Bảng tin bạn bè & phân trang cursor',
    status: 'PENDING',
    endpoint: 'GET /api/v1/feed?limit=20&cursor=<uuid>',
    note: 'Đang chờ hợp nhất nhánh Backend feature/friends-and-social vào develop.'
  },
  createPost: {
    id: 'createPost',
    label: 'Đăng bài chia sẻ hành trình',
    status: 'PENDING',
    endpoint: 'POST /api/v1/posts',
    note: 'Đang chờ hợp nhất nhánh Backend feature/friends-and-social vào develop.'
  },
  reactions: {
    id: 'reactions',
    label: 'Cổ vũ / Thả cảm xúc bài viết',
    status: 'PENDING',
    endpoint: 'POST/DELETE /api/v1/posts/:postId/reactions',
    note: 'Hỗ trợ LIKE / CELEBRATE / FIRE / CLAP trên nhánh feature/friends-and-social.'
  },
  comments: {
    id: 'comments',
    label: 'Bình luận bài viết',
    status: 'PENDING',
    endpoint: 'GET/POST /api/v1/posts/:postId/comments',
    note: 'Đang chờ hợp nhất nhánh Backend feature/friends-and-social vào develop.'
  },
  photoUpload: {
    id: 'photoUpload',
    label: 'Tải ảnh minh chứng trực tiếp',
    status: 'UNAVAILABLE',
    endpoint: null,
    note: 'Backend chưa có endpoint upload/presigned media storage.'
  },
  sharePost: {
    id: 'sharePost',
    label: 'Chia sẻ lại bài viết',
    status: 'UNAVAILABLE',
    endpoint: null,
    note: 'Chưa có API chia sẻ; không gian Social ưu tiên riêng tư trong nhóm bạn bè.'
  }
}

export interface SocialFeedComment {
  id: string
  author: string
  text: string
  timeLabel: string
}

export interface SocialFeedPost {
  id: string
  authorName: string
  authorTag: string
  avatarTone: 'teal' | 'coral' | 'navy' | 'gold'
  timeLabel: string
  visibility: PrivacyMode
  questBadge: string
  questType: QuestType
  caption: string
  illustrationKey: SocialIllustrationKey
  illustrationAlt: string
  likeCount: number
  comments: SocialFeedComment[]
  isPreviewFixture: true
}

/** Future Profile & Album compatibility boundary (Phase 6 — not implemented in FE-03.5I) */
export interface ProfileSectionBoundary {
  id: 'personal-posts' | 'personal-albums' | 'friends-albums' | 'quest-evidence' | 'privacy-controls'
  title: string
  description: string
  status: SocialCapabilityStatus
}

export const FUTURE_PROFILE_BOUNDARIES: ProfileSectionBoundary[] = [
  {
    id: 'personal-posts',
    title: 'Bài viết cá nhân',
    description: 'Nhật ký hành trình và các cột mốc bạn đã chia sẻ.',
    status: 'PENDING'
  },
  {
    id: 'personal-albums',
    title: 'Album cá nhân',
    description: 'Lưu giữ bộ sưu tập ảnh theo chủ đề mục tiêu và thói quen.',
    status: 'UNAVAILABLE'
  },
  {
    id: 'friends-albums',
    title: 'Album của bạn bè',
    description: 'Xem album được bạn bè chia sẻ riêng tư trong vòng kết nối.',
    status: 'UNAVAILABLE'
  },
  {
    id: 'quest-evidence',
    title: 'Ảnh minh chứng nhiệm vụ',
    description: 'Thư viện minh chứng hình ảnh gắn liền với từng Quest đã hoàn thành.',
    status: 'UNAVAILABLE'
  },
  {
    id: 'privacy-controls',
    title: 'Kiểm soát quyền riêng tư',
    description: 'Quản lý chế độ PUBLIC / FRIENDS / PRIVATE đồng bộ với UserSettings API.',
    status: 'LIVE'
  }
]
