import { SOCIAL_MOCK_ASSETS } from '@/assets/social'
import type { ChatMessage, Conversation } from './messengerTypes'

export const PREVIEW_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-minh-anh',
    type: 'DIRECT',
    title: 'Minh Anh',
    subtitle: 'Bạn đồng hành • Học tập & Đọc sách',
    avatarInitials: 'MA',
    avatarTone: 'coral',
    unreadCount: 2,
    muted: false,
    lastMessagePreview: 'Gửi bạn góc học tập tối nay nè, xong 2 Pomodoro rồi!',
    lastActivityLabel: '2 phút',
    members: [
      {
        id: 'u-minh-anh',
        name: 'Minh Anh',
        initials: 'MA',
        tone: 'coral',
        role: 'MEMBER',
        tagline: 'Mục tiêu: Đọc 20 phút mỗi tối'
      },
      {
        id: 'u-self',
        name: 'Bạn',
        initials: 'LQ',
        tone: 'navy',
        role: 'MEMBER',
        tagline: 'Tài khoản hiện tại'
      }
    ],
    sharedQuests: [
      {
        id: 'q-reading-7d',
        title: 'Thử thách 7 ngày đọc sách 20 phút',
        statusLabel: 'Xem trước (Chờ API)',
        route: '/work/quests'
      }
    ],
    streakLabel: 'Chuỗi tình bạn • Chờ Streak API (FE-06C)',
    isPreviewFixture: true
  },
  {
    id: 'conv-group-run',
    type: 'GROUP',
    title: 'Nhóm Chạy Bộ Sáng 6h',
    subtitle: '4 thành viên • Thói quen vận động',
    avatarInitials: 'CB',
    avatarTone: 'teal',
    groupBadges: ['HT', 'GB'],
    unreadCount: 1,
    muted: false,
    lastMessagePreview: 'Hoàng Tùng vừa chia sẻ 2 khoảnh khắc chạy sáng',
    lastActivityLabel: '18 phút',
    members: [
      {
        id: 'u-hoang-tung',
        name: 'Hoàng Tùng',
        initials: 'HT',
        tone: 'teal',
        role: 'OWNER',
        tagline: 'Trưởng nhóm chạy bộ'
      },
      {
        id: 'u-gia-bao',
        name: 'Gia Bảo',
        initials: 'GB',
        tone: 'gold',
        role: 'MEMBER',
        tagline: 'Mục tiêu 5km cuối tuần'
      },
      {
        id: 'u-minh-anh',
        name: 'Minh Anh',
        initials: 'MA',
        tone: 'coral',
        role: 'MEMBER',
        tagline: 'Đi bộ nhanh 30 phút'
      },
      {
        id: 'u-self',
        name: 'Bạn',
        initials: 'LQ',
        tone: 'navy',
        role: 'MEMBER',
        tagline: 'Thành viên'
      }
    ],
    sharedQuests: [
      {
        id: 'q-run-15km',
        title: 'Nhóm tích lũy 15km tuần này',
        statusLabel: 'Xem trước (Chờ API)',
        route: '/work/quests'
      }
    ],
    streakLabel: 'Chuỗi nhóm • Chờ Streak API (FE-06C)',
    isPreviewFixture: true
  },
  {
    id: 'conv-gia-bao',
    type: 'DIRECT',
    title: 'Gia Bảo',
    subtitle: 'Bạn cùng dự án • UI/UX & Frontend',
    avatarInitials: 'GB',
    avatarTone: 'gold',
    unreadCount: 0,
    muted: false,
    lastMessagePreview: 'Cột mốc tuần này hoàn thành đẹp luôn!',
    lastActivityLabel: '2 giờ',
    members: [
      {
        id: 'u-gia-bao',
        name: 'Gia Bảo',
        initials: 'GB',
        tone: 'gold',
        role: 'MEMBER',
        tagline: 'Xây thói quen code 1 giờ/ngày'
      },
      {
        id: 'u-self',
        name: 'Bạn',
        initials: 'LQ',
        tone: 'navy',
        role: 'MEMBER',
        tagline: 'Tài khoản hiện tại'
      }
    ],
    sharedQuests: [],
    streakLabel: 'Chuỗi tình bạn • Chờ Streak API (FE-06C)',
    isPreviewFixture: true
  },
  {
    id: 'conv-group-ielts',
    type: 'GROUP',
    title: 'Biệt Đội Ôn Thi IELTS',
    subtitle: '5 thành viên • Tự học mỗi tối',
    avatarInitials: 'IE',
    avatarTone: 'plum',
    groupBadges: ['TV', 'KN'],
    unreadCount: 0,
    muted: true,
    lastMessagePreview: 'Khánh Ngân: Tối mai 20h mình luyện Speaking nhé',
    lastActivityLabel: 'Hôm qua',
    members: [
      {
        id: 'u-khanh-ngan',
        name: 'Khánh Ngân',
        initials: 'KN',
        tone: 'plum',
        role: 'OWNER',
        tagline: 'Target 7.5 IELTS'
      },
      {
        id: 'u-thao-vy',
        name: 'Thảo Vy',
        initials: 'TV',
        tone: 'coral',
        role: 'MEMBER',
        tagline: 'Listening mỗi sáng'
      },
      {
        id: 'u-self',
        name: 'Bạn',
        initials: 'LQ',
        tone: 'navy',
        role: 'MEMBER',
        tagline: 'Thành viên'
      }
    ],
    sharedQuests: [
      {
        id: 'q-ielts-vocab',
        title: '30 từ vựng học thuật mỗi tuần',
        statusLabel: 'Xem trước (Chờ API)',
        route: '/work/quests'
      }
    ],
    streakLabel: 'Chuỗi nhóm • Chờ Streak API (FE-06C)',
    isPreviewFixture: true
  },
  {
    id: 'conv-thao-vy',
    type: 'DIRECT',
    title: 'Thảo Vy',
    subtitle: 'Bạn mới kết nối • Chưa có tin nhắn',
    avatarInitials: 'TV',
    avatarTone: 'navy',
    unreadCount: 0,
    muted: false,
    lastMessagePreview: 'Bắt đầu cuộc trò chuyện mới...',
    lastActivityLabel: 'Mới',
    members: [
      {
        id: 'u-thao-vy',
        name: 'Thảo Vy',
        initials: 'TV',
        tone: 'navy',
        role: 'MEMBER',
        tagline: 'Thích viết nhật ký buổi sáng'
      },
      {
        id: 'u-self',
        name: 'Bạn',
        initials: 'LQ',
        tone: 'navy',
        role: 'MEMBER',
        tagline: 'Tài khoản hiện tại'
      }
    ],
    sharedQuests: [],
    streakLabel: 'Chưa khởi tạo chuỗi (Chờ API)',
    isPreviewFixture: true
  }
]

export const PREVIEW_MESSAGES_BY_CONVERSATION: Record<string, ChatMessage[]> = {
  'conv-minh-anh': [
    {
      id: 'm-ma-1',
      conversationId: 'conv-minh-anh',
      senderId: 'u-minh-anh',
      senderName: 'Minh Anh',
      senderInitials: 'MA',
      senderTone: 'coral',
      isSelf: false,
      timeLabel: '20:10',
      dateGroupLabel: 'Hôm nay',
      kind: 'TEXT',
      text: 'Tối nay bạn đã bật đồng hồ Pomodoro chưa? Mình vừa hoàn thành phiên đầu tiên rồi nè!'
    },
    {
      id: 'm-ma-2',
      conversationId: 'conv-minh-anh',
      senderId: 'u-minh-anh',
      senderName: 'Minh Anh',
      senderInitials: 'MA',
      senderTone: 'coral',
      isSelf: false,
      timeLabel: '20:11',
      dateGroupLabel: 'Hôm nay',
      kind: 'MIXED',
      text: 'Gửi bạn góc học tập tối nay nè, xong 2 Pomodoro rồi!',
      images: [
        {
          id: 'img-ma-study',
          src: SOCIAL_MOCK_ASSETS['study-corner'].src,
          alt: SOCIAL_MOCK_ASSETS['study-corner'].defaultAlt,
          illustrationKey: 'study-corner',
          caption: 'Góc học tập 25 phút tập trung'
        }
      ]
    },
    {
      id: 'm-ma-3',
      conversationId: 'conv-minh-anh',
      senderId: 'u-self',
      senderName: 'Bạn',
      senderInitials: 'LQ',
      senderTone: 'navy',
      isSelf: true,
      timeLabel: '20:14',
      dateGroupLabel: 'Hôm nay',
      kind: 'TEXT',
      text: 'Đỉnh quá! Mình cũng đang chuẩn bị vào phiên 25 phút đọc tài liệu kiến trúc.'
    },
    {
      id: 'm-ma-4',
      conversationId: 'conv-minh-anh',
      senderId: 'u-minh-anh',
      senderName: 'Minh Anh',
      senderInitials: 'MA',
      senderTone: 'coral',
      isSelf: false,
      timeLabel: '20:16',
      dateGroupLabel: 'Hôm nay',
      kind: 'QUEST_INVITE',
      questInvite: {
        id: 'qi-1',
        title: 'Thử thách 7 ngày đọc sách 20 phút',
        inviterName: 'Minh Anh',
        participantCount: 2,
        deadlineLabel: 'Chủ nhật 23:00',
        status: 'PENDING',
        targetRoute: '/work/quests'
      }
    }
  ],
  'conv-group-run': [
    {
      id: 'm-gr-0',
      conversationId: 'conv-group-run',
      senderId: 'system',
      senderName: 'Hệ thống',
      senderInitials: 'LQ',
      senderTone: 'teal',
      isSelf: false,
      timeLabel: '06:00',
      dateGroupLabel: 'Hôm nay',
      kind: 'SYSTEM',
      text: 'Đây là phòng chat nhóm mô phỏng cục bộ (FE-06A Preview). Tin nhắn thật sẽ đồng bộ khi Backend Messaging API sẵn sàng.'
    },
    {
      id: 'm-gr-1',
      conversationId: 'conv-group-run',
      senderId: 'u-hoang-tung',
      senderName: 'Hoàng Tùng',
      senderInitials: 'HT',
      senderTone: 'teal',
      isSelf: false,
      timeLabel: '06:25',
      dateGroupLabel: 'Hôm nay',
      kind: 'MIXED',
      text: 'Sáng nay trời mát quá cả nhà ơi! Xong 3km công viên + nạp đủ nước luôn.',
      images: [
        {
          id: 'img-gr-run',
          src: SOCIAL_MOCK_ASSETS['morning-run'].src,
          alt: SOCIAL_MOCK_ASSETS['morning-run'].defaultAlt,
          illustrationKey: 'morning-run'
        },
        {
          id: 'img-gr-water',
          src: SOCIAL_MOCK_ASSETS['hydration-habit'].src,
          alt: SOCIAL_MOCK_ASSETS['hydration-habit'].defaultAlt,
          illustrationKey: 'hydration-habit'
        }
      ]
    },
    {
      id: 'm-gr-2',
      conversationId: 'conv-group-run',
      senderId: 'u-gia-bao',
      senderName: 'Gia Bảo',
      senderInitials: 'GB',
      senderTone: 'gold',
      isSelf: false,
      timeLabel: '06:28',
      dateGroupLabel: 'Hôm nay',
      kind: 'TEXT',
      text: 'Chờ mình 5 phút nhé, đang buộc dây giày ra công viên đây!'
    },
    {
      id: 'm-gr-3',
      conversationId: 'conv-group-run',
      senderId: 'u-hoang-tung',
      senderName: 'Hoàng Tùng',
      senderInitials: 'HT',
      senderTone: 'teal',
      isSelf: false,
      timeLabel: '06:30',
      dateGroupLabel: 'Hôm nay',
      kind: 'CHALLENGE',
      challenge: {
        id: 'ch-run-1',
        mode: 'GROUP',
        title: 'Thử thách Nhóm: 15km cuối tuần',
        challengerName: 'Hoàng Tùng',
        goalLabel: 'Mỗi người hoàn thành ít nhất 3 buổi chạy',
        durationLabel: '7 ngày',
        progressLabel: 'Chờ đồng bộ tiến độ Backend',
        status: 'PENDING'
      }
    },
    {
      id: 'm-gr-4',
      conversationId: 'conv-group-run',
      senderId: 'u-self',
      senderName: 'Bạn',
      senderInitials: 'LQ',
      senderTone: 'navy',
      isSelf: true,
      timeLabel: '06:32',
      dateGroupLabel: 'Hôm nay',
      kind: 'TEXT',
      text: 'Mình vừa điểm danh thói quen vận động xong rồi, cố lên cả nhóm!'
    }
  ],
  'conv-gia-bao': [
    {
      id: 'm-gb-1',
      conversationId: 'conv-gia-bao',
      senderId: 'u-gia-bao',
      senderName: 'Gia Bảo',
      senderInitials: 'GB',
      senderTone: 'gold',
      isSelf: false,
      timeLabel: '16:40',
      dateGroupLabel: 'Hôm nay',
      kind: 'MIXED',
      text: 'Cột mốc tuần này hoàn thành đẹp luôn!',
      images: [
        {
          id: 'img-gb-mile',
          src: SOCIAL_MOCK_ASSETS['milestone-moment'].src,
          alt: SOCIAL_MOCK_ASSETS['milestone-moment'].defaultAlt,
          illustrationKey: 'milestone-moment'
        }
      ]
    },
    {
      id: 'm-gb-2',
      conversationId: 'conv-gia-bao',
      senderId: 'u-self',
      senderName: 'Bạn',
      senderInitials: 'LQ',
      senderTone: 'navy',
      isSelf: true,
      timeLabel: '16:44',
      dateGroupLabel: 'Hôm nay',
      kind: 'TEXT',
      text: 'Tuyệt vời, cuối tuần cùng chốt Epic mới nhé!'
    }
  ],
  'conv-group-ielts': [
    {
      id: 'm-ie-1',
      conversationId: 'conv-group-ielts',
      senderId: 'u-khanh-ngan',
      senderName: 'Khánh Ngân',
      senderInitials: 'KN',
      senderTone: 'plum',
      isSelf: false,
      timeLabel: '21:15',
      dateGroupLabel: 'Hôm qua',
      kind: 'TEXT',
      text: 'Tối mai 20h mình luyện Speaking Part 2 chủ đề thói quen hàng ngày nhé cả nhà.'
    }
  ],
  'conv-thao-vy': []
}

export const QUICK_EMOJIS = ['🔥', '🦊', '🎉', '💪', '👏', '✨', '📚', '🏃', '💧', '❤️', '😊', '🙌'] as const
