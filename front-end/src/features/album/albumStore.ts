import { create } from 'zustand'
import type {
  ClothColor,
  MediaVisibility,
  SampleIllustrationKey,
} from '@/features/journal/JournalPrimitives'

export type AlbumCoverStyle = 'photo' | 'magazine' | 'scrapbook' | 'minimal'
export type PhotoSourceType = 'EVIDENCE' | 'QUEST_MEMORY' | 'NORMAL'

export function isWideningVisibility(from: MediaVisibility, to: MediaVisibility): boolean {
  const rank: Record<MediaVisibility, number> = { PRIVATE: 0, GROUP: 1, FRIENDS: 2 }
  return rank[to] > rank[from]
}

export interface AlbumMember {
  id: string
  name: string
  initials: string
  role: 'OWNER' | 'CAN_ADD' | 'VIEW_ONLY'
  photoCount: number
}

export interface AlbumRecord {
  id: string
  title: string
  description: string
  coverColor: ClothColor
  coverStyle: AlbumCoverStyle
  visibility: MediaVisibility
  ownerId: string
  ownerName: string
  questId?: string | null
  questTitle?: string | null
  chapters: string[]
  coverIllustration: SampleIllustrationKey
  isAutoEvidence?: boolean
  members?: AlbumMember[]
  revokedForViewer?: boolean
  createdAtLabel: string
}

export interface PhotoRecord {
  id: string
  albumIds: string[]
  chapterIndex: number
  title: string
  caption: string
  handNote?: string
  dateLabel: string
  monthGroup: string
  sourceType: PhotoSourceType
  visibility: MediaVisibility
  sharedAsMoment: boolean
  momentVisibility?: MediaVisibility
  cheerCount: number
  cheeredByMe: boolean
  isDeletedSource?: boolean
  illustrationKey: SampleIllustrationKey
  localPreviewUrl?: string | null
  taskTitle?: string | null
  questTitle?: string | null
  contributorName?: string | null
}

const INITIAL_ALBUMS: AlbumRecord[] = [
  {
    id: 'alb-run-10k',
    title: 'Chạy 10km đầu tiên',
    description: 'Từ 2km thở dốc tới 10km trọn vẹn cùng Fox V2.',
    coverColor: 'navy',
    coverStyle: 'photo',
    visibility: 'FRIENDS',
    ownerId: 'self',
    ownerName: 'Minh Anh',
    questId: 'quest-run-10k',
    questTitle: 'Chạy 10km đầu tiên',
    chapters: ['Bắt đầu', 'Về đích 5km', 'Tăng cự ly', 'Chặng 4'],
    coverIllustration: 'sunrise-run',
    createdAtLabel: 'Tháng 11/2026',
  },
  {
    id: 'alb-books-2026',
    title: 'Kệ sách 2026',
    description: 'Mỗi tuần một chương sách và vài dòng ghi chú tay.',
    coverColor: 'teal',
    coverStyle: 'magazine',
    visibility: 'FRIENDS',
    ownerId: 'user-giahuy',
    ownerName: 'Gia Huy',
    questId: 'quest-books-2026',
    questTitle: 'Đọc 12 cuốn sách 2026',
    chapters: ['Tháng 10', 'Tháng 11', 'Góc đọc sáng'],
    coverIllustration: 'book-shelf',
    createdAtLabel: 'Tháng 10/2026',
  },
  {
    id: 'alb-group-q7',
    title: 'Nhóm Chạy bộ Q7',
    description: 'Kỷ niệm các buổi chạy sáng cuối tuần của nhóm.',
    coverColor: 'plum',
    coverStyle: 'scrapbook',
    visibility: 'GROUP',
    ownerId: 'self',
    ownerName: 'Minh Anh',
    questId: 'quest-group-q7',
    questTitle: 'Thử thách cuối tuần Q7',
    chapters: ['Tuần 1', 'Tuần 2', 'Đỉnh Bà Đen'],
    coverIllustration: 'group-run',
    members: [
      { id: 'self', name: 'Minh Anh (Bạn)', initials: 'MA', role: 'OWNER', photoCount: 4 },
      { id: 'user-giahuy', name: 'Gia Huy', initials: 'GH', role: 'CAN_ADD', photoCount: 3 },
      { id: 'user-thuha', name: 'Thu Hà', initials: 'TH', role: 'CAN_ADD', photoCount: 2 },
      { id: 'user-minhkhoi', name: 'Minh Khôi', initials: 'MK', role: 'VIEW_ONLY', photoCount: 0 },
    ],
    createdAtLabel: 'Tháng 11/2026',
  },
  {
    id: 'alb-ielts',
    title: 'Nhật ký IELTS 6.5',
    description: 'Góc bàn học và bài luyện mỗi tối — chỉ mình tôi xem.',
    coverColor: 'sand',
    coverStyle: 'minimal',
    visibility: 'PRIVATE',
    ownerId: 'self',
    ownerName: 'Minh Anh',
    questId: 'quest-ielts',
    questTitle: 'Đạt IELTS 6.5',
    chapters: ['Reading', 'Writing', 'Mock Test'],
    coverIllustration: 'study-desk',
    createdAtLabel: 'Tháng 11/2026',
  },
  {
    id: 'alb-evidence',
    title: 'Minh chứng Task',
    description: 'Tự gom ảnh minh chứng từ các nhiệm vụ — mặc định Chỉ mình tôi.',
    coverColor: 'rust',
    coverStyle: 'minimal',
    visibility: 'PRIVATE',
    ownerId: 'self',
    ownerName: 'Minh Anh',
    chapters: ['Tháng 11/2026', 'Tháng 10/2026'],
    coverIllustration: 'morning-coffee',
    isAutoEvidence: true,
    createdAtLabel: 'Tự động gom',
  },
]

const INITIAL_PHOTOS: PhotoRecord[] = [
  {
    id: 'ph-1',
    albumIds: ['alb-run-10k', 'alb-evidence'],
    chapterIndex: 0,
    title: '6km sáng nay',
    caption: 'Minh chứng Task "Chạy 6km sáng nay" · Chỉ mình bạn thấy mặc định.',
    handNote: 'Trời 23°C, gió mát cực kỳ!',
    dateLabel: 'Hôm qua · 06:12',
    monthGroup: 'THÁNG 11 · 2026',
    sourceType: 'EVIDENCE',
    visibility: 'PRIVATE',
    sharedAsMoment: false,
    cheerCount: 0,
    cheeredByMe: false,
    illustrationKey: 'sunrise-run',
    taskTitle: 'Chạy bộ 20 phút hôm nay',
    questTitle: 'Chạy 10km đầu tiên',
    contributorName: 'Minh Anh',
  },
  {
    id: 'ph-2',
    albumIds: ['alb-run-10k'],
    chapterIndex: 1,
    title: 'Về đích chặng 2: chạy 5km',
    caption: 'Quest "Chạy 10km đầu tiên" · Chặng 2 hoàn thành đúng kế hoạch!',
    handNote: 'Không dừng lại lần nào!',
    dateLabel: '02/11 · 07:05',
    monthGroup: 'THÁNG 11 · 2026',
    sourceType: 'QUEST_MEMORY',
    visibility: 'FRIENDS',
    sharedAsMoment: true,
    momentVisibility: 'FRIENDS',
    cheerCount: 9,
    cheeredByMe: false,
    illustrationKey: 'sunrise-run',
    questTitle: 'Chạy 10km đầu tiên',
    contributorName: 'Minh Anh',
  },
  {
    id: 'ph-3',
    albumIds: ['alb-group-q7'],
    chapterIndex: 2,
    title: 'Đỉnh Bà Đen',
    caption: 'Cả nhóm Q7 hoàn thành buổi leo cuối tuần — 3 ảnh trong album nhóm.',
    handNote: 'Còn 1 chặng nữa là về đích!',
    dateLabel: '18/11 · 09:20',
    monthGroup: 'THÁNG 11 · 2026',
    sourceType: 'QUEST_MEMORY',
    visibility: 'GROUP',
    sharedAsMoment: true,
    momentVisibility: 'GROUP',
    cheerCount: 14,
    cheeredByMe: true,
    illustrationKey: 'mountain-summit',
    questTitle: 'Nhóm Chạy bộ Q7',
    contributorName: 'Gia Huy',
  },
  {
    id: 'ph-4',
    albumIds: ['alb-books-2026'],
    chapterIndex: 1,
    title: 'Xong chương 4',
    caption: 'Cuốn thứ 18 · Ghi chú thói quen nhỏ vào sổ tay.',
    handNote: 'Còn 6 cuốn nữa là về đích!',
    dateLabel: '16/11 · 21:15',
    monthGroup: 'THÁNG 11 · 2026',
    sourceType: 'QUEST_MEMORY',
    visibility: 'FRIENDS',
    sharedAsMoment: true,
    momentVisibility: 'FRIENDS',
    cheerCount: 6,
    cheeredByMe: false,
    illustrationKey: 'book-shelf',
    questTitle: 'Đọc 12 cuốn sách 2026',
    contributorName: 'Gia Huy',
  },
  {
    id: 'ph-5',
    albumIds: ['alb-ielts', 'alb-evidence'],
    chapterIndex: 0,
    title: 'Góc học tập buổi tối',
    caption: 'Hoàn thành 2 bài Reading Cambridge 18.',
    handNote: 'Đúng 34/40 câu rồi!',
    dateLabel: '14/11 · 22:00',
    monthGroup: 'THÁNG 11 · 2026',
    sourceType: 'EVIDENCE',
    visibility: 'PRIVATE',
    sharedAsMoment: false,
    cheerCount: 0,
    cheeredByMe: false,
    illustrationKey: 'study-desk',
    taskTitle: 'Luyện Reading IELTS 45 phút',
    questTitle: 'Đạt IELTS 6.5',
    contributorName: 'Minh Anh',
  },
  {
    id: 'ph-6',
    albumIds: ['alb-run-10k'],
    chapterIndex: 2,
    title: 'Cà phê sau buổi chạy',
    caption: 'Thưởng một ly cà phê ấm sau khi cán mốc 7km.',
    dateLabel: '10/11 · 07:40',
    monthGroup: 'THÁNG 11 · 2026',
    sourceType: 'NORMAL',
    visibility: 'FRIENDS',
    sharedAsMoment: false,
    cheerCount: 3,
    cheeredByMe: false,
    illustrationKey: 'morning-coffee',
    questTitle: 'Chạy 10km đầu tiên',
    contributorName: 'Minh Anh',
  },
  {
    id: 'ph-7',
    albumIds: ['alb-group-q7'],
    chapterIndex: 0,
    title: 'Khởi động công viên Phú Mỹ Hưng',
    caption: 'Buổi tập đầu tiên đủ cả 4 thành viên.',
    dateLabel: '25/10 · 06:00',
    monthGroup: 'THÁNG 10 · 2026',
    sourceType: 'QUEST_MEMORY',
    visibility: 'GROUP',
    sharedAsMoment: false,
    cheerCount: 5,
    cheeredByMe: false,
    illustrationKey: 'group-run',
    questTitle: 'Nhóm Chạy bộ Q7',
    contributorName: 'Thu Hà',
  },
  {
    id: 'ph-8',
    albumIds: ['alb-run-10k'],
    chapterIndex: 3,
    title: 'Ảnh gốc đã xóa (mẫu)',
    caption: 'Bản ghi mẫu minh họa trạng thái khi tệp nguồn bị xóa.',
    dateLabel: '20/10 · 18:00',
    monthGroup: 'THÁNG 10 · 2026',
    sourceType: 'NORMAL',
    visibility: 'PRIVATE',
    sharedAsMoment: false,
    cheerCount: 0,
    cheeredByMe: false,
    isDeletedSource: true,
    illustrationKey: 'study-desk',
    contributorName: 'Minh Anh',
  },
]

interface AlbumStoreState {
  albums: AlbumRecord[]
  photos: PhotoRecord[]
  createAlbum: (input: {
    title: string
    description: string
    coverColor: ClothColor
    coverStyle: AlbumCoverStyle
    visibility: MediaVisibility
    questTitle?: string
    coverIllustration?: SampleIllustrationKey
  }) => AlbumRecord
  updateAlbum: (
    albumId: string,
    patch: Partial<
      Pick<AlbumRecord, 'title' | 'description' | 'coverColor' | 'coverStyle' | 'visibility' | 'questTitle'>
    >,
  ) => void
  deleteAlbum: (albumId: string) => void
  addUploadedPhotos: (
    items: Array<{
      title: string
      caption: string
      sourceType: PhotoSourceType
      visibility: MediaVisibility
      albumIds: string[]
      sharedAsMoment: boolean
      taskTitle?: string | null
      questTitle?: string | null
      localPreviewUrl?: string | null
      illustrationKey?: SampleIllustrationKey
    }>,
  ) => PhotoRecord[]
  addPhotosToAlbum: (photoIds: string[], albumId: string) => void
  removePhotoFromAlbum: (photoId: string, albumId: string) => void
  setPhotosVisibility: (photoIds: string[], visibility: MediaVisibility) => void
  sharePhotoAsMoment: (photoId: string, momentVisibility: MediaVisibility) => void
  deletePhotos: (photoIds: string[]) => void
  toggleCheerPhoto: (photoId: string) => void
  leaveGroupAlbum: (albumId: string) => void
  resetAlbumStore: () => void
}

export const useAlbumStore = create<AlbumStoreState>((set) => ({
  albums: INITIAL_ALBUMS,
  photos: INITIAL_PHOTOS,

  createAlbum: (input) => {
    const created: AlbumRecord = {
      id: `alb-${Date.now()}`,
      title: input.title.trim(),
      description: input.description.trim(),
      coverColor: input.coverColor,
      coverStyle: input.coverStyle,
      visibility: input.visibility,
      ownerId: 'self',
      ownerName: 'Minh Anh',
      questTitle: input.questTitle?.trim() || null,
      chapters: ['Chương 1', 'Chương 2'],
      coverIllustration: input.coverIllustration ?? 'sunrise-run',
      createdAtLabel: 'Vừa tạo (Xem trước)',
    }
    set((s) => ({ albums: [created, ...s.albums] }))
    return created
  },

  updateAlbum: (albumId, patch) =>
    set((s) => ({
      albums: s.albums.map((a) => (a.id === albumId ? { ...a, ...patch } : a)),
    })),

  // Deleting an album keeps all photos safe in the Gallery
  deleteAlbum: (albumId) =>
    set((s) => ({
      albums: s.albums.filter((a) => a.id !== albumId),
      photos: s.photos.map((p) => ({
        ...p,
        albumIds: p.albumIds.filter((id) => id !== albumId),
      })),
    })),

  addUploadedPhotos: (items) => {
    const created: PhotoRecord[] = items.map((item, idx) => ({
      id: `ph-local-${Date.now()}-${idx}`,
      albumIds: item.sourceType === 'EVIDENCE'
        ? Array.from(new Set([...item.albumIds, 'alb-evidence']))
        : item.albumIds,
      chapterIndex: 0,
      title: item.title,
      caption: item.caption,
      dateLabel: 'Vừa thêm (Cục bộ)',
      monthGroup: 'THÁNG 11 · 2026',
      sourceType: item.sourceType,
      visibility: item.visibility,
      sharedAsMoment: item.sharedAsMoment,
      momentVisibility: item.sharedAsMoment ? item.visibility : undefined,
      cheerCount: 0,
      cheeredByMe: false,
      illustrationKey: item.illustrationKey ?? 'sunrise-run',
      localPreviewUrl: item.localPreviewUrl ?? null,
      taskTitle: item.taskTitle ?? null,
      questTitle: item.questTitle ?? null,
      contributorName: 'Minh Anh',
    }))
    set((s) => ({ photos: [...created, ...s.photos] }))
    return created
  },

  addPhotosToAlbum: (photoIds, albumId) =>
    set((s) => ({
      photos: s.photos.map((p) =>
        photoIds.includes(p.id)
          ? { ...p, albumIds: Array.from(new Set([...p.albumIds, albumId])) }
          : p,
      ),
    })),

  removePhotoFromAlbum: (photoId, albumId) =>
    set((s) => ({
      photos: s.photos.map((p) =>
        p.id === photoId ? { ...p, albumIds: p.albumIds.filter((id) => id !== albumId) } : p,
      ),
    })),

  setPhotosVisibility: (photoIds, visibility) =>
    set((s) => ({
      photos: s.photos.map((p) => (photoIds.includes(p.id) ? { ...p, visibility } : p)),
    })),

  sharePhotoAsMoment: (photoId, momentVisibility) =>
    set((s) => ({
      photos: s.photos.map((p) =>
        p.id === photoId ? { ...p, sharedAsMoment: true, momentVisibility } : p,
      ),
    })),

  deletePhotos: (photoIds) =>
    set((s) => ({
      photos: s.photos.filter((p) => !photoIds.includes(p.id)),
    })),

  toggleCheerPhoto: (photoId) =>
    set((s) => ({
      photos: s.photos.map((p) =>
        p.id === photoId
          ? {
              ...p,
              cheeredByMe: !p.cheeredByMe,
              cheerCount: p.cheeredByMe ? Math.max(0, p.cheerCount - 1) : p.cheerCount + 1,
            }
          : p,
      ),
    })),

  leaveGroupAlbum: (albumId) =>
    set((s) => ({
      albums: s.albums.map((a) => (a.id === albumId ? { ...a, revokedForViewer: true } : a)),
    })),

  resetAlbumStore: () => set({ albums: INITIAL_ALBUMS, photos: INITIAL_PHOTOS }),
}))
