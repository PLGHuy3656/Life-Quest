import React, { useState, useRef, useEffect } from 'react'
import {
  User,
  Users,
  MessageCircle,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Send,
  RotateCcw,
  Sparkles,
  Camera,
  ChevronRight
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface FoxCameraScreenProps {
  onCloseToDashboard: () => void
  onOpenProfile: () => void
  onOpenMessages: () => void
}

interface SnapFeedItem {
  id: string
  caption: string
  author: string
  authorInitial: string
  authorColor: string
  time: string
  imageUrl?: string
  foxPose: string
  foxFallback: string
  bg: string
  tag: string
  reactions: Record<string, number>
}

const FOX_POSES = [
  {
    id: 'cheer',
    label: 'Fox Cổ vũ',
    img: '/assets/fox/fox-mood-cheer-anim.webp',
    fallback: '/assets/fox/fox-mood-cheer.png',
    bg: 'linear-gradient(145deg, #FFE4CC 0%, #FFF5EA 55%, #FFD7B8 100%)'
  },
  {
    id: 'celebrate',
    label: 'Fox Ăn mừng',
    img: '/assets/fox/fox-mood-celebrate-anim.webp',
    fallback: '/assets/fox/fox-mood-celebrate.png',
    bg: 'linear-gradient(145deg, #FFF1C9 0%, #FFF9E8 55%, #FFE2A8 100%)'
  },
  {
    id: 'focus',
    label: 'Fox Tập trung',
    img: '/assets/fox/fox-cp1-anim.webp',
    fallback: '/assets/fox/fox-cp1.png',
    bg: 'linear-gradient(145deg, #D9F5EC 0%, #F2FCF9 55%, #C6EFE2 100%)'
  },
  {
    id: 'summit',
    label: 'Fox Chinh phục',
    img: '/assets/fox/fox-cta-summit-anim.webp',
    fallback: '/assets/fox/fox-cta-summit.png',
    bg: 'linear-gradient(145deg, #DCEBFF 0%, #F3F8FF 55%, #C9E0FF 100%)'
  }
]

const FRIEND_GROUPS = ['Bạn bè (4)', 'Hà My', 'Nhóm Giải tích', 'Chỉ mình tôi']

const INITIAL_FEED: SnapFeedItem[] = [
  {
    id: 'snap-1',
    caption: 'Hoàn thành 20 phút chạy bộ giữ chuỗi 12 ngày! 🔥',
    author: 'Minh Anh (Bạn)',
    authorInitial: 'MA',
    authorColor: '#F26B3A',
    time: 'Hôm nay · 18:40',
    foxPose: '/assets/fox/fox-mood-celebrate-anim.webp',
    foxFallback: '/assets/fox/fox-mood-celebrate.png',
    bg: 'linear-gradient(145deg, #FFE5CC 0%, #FFF6EC 55%, #FFD7B8 100%)',
    tag: '+30 XP',
    reactions: { '🔥': 3, '❤️': 2 }
  },
  {
    id: 'snap-2',
    caption: 'Đang ôn Chương 3 Giải tích cùng Fox tập trung 📚',
    author: 'Hà My',
    authorInitial: 'HM',
    authorColor: '#168C78',
    time: 'Hôm nay · 15:15',
    foxPose: '/assets/fox/fox-cp1-anim.webp',
    foxFallback: '/assets/fox/fox-cp1.png',
    bg: 'linear-gradient(145deg, #DDF6EE 0%, #F3FCF9 55%, #C2EDE0 100%)',
    tag: 'Chuỗi 7 ngày',
    reactions: { '🔥': 4, '🦊': 2 }
  },
  {
    id: 'snap-3',
    caption: 'Vừa chinh phục cột mốc Cấp 7 rồi nè!! 🎉',
    author: 'Tuấn Kiệt',
    authorInitial: 'TK',
    authorColor: '#3B82F6',
    time: 'Hôm qua · 21:05',
    foxPose: '/assets/fox/fox-cta-summit-anim.webp',
    foxFallback: '/assets/fox/fox-cta-summit.png',
    bg: 'linear-gradient(145deg, #FFF2CC 0%, #FFF9EB 55%, #FFE29E 100%)',
    tag: 'Cấp 7',
    reactions: { '🎉': 5, '❤️': 3 }
  },
  {
    id: 'snap-4',
    caption: 'Buổi sáng học từ vựng 15 phút nhẹ nhàng ✨',
    author: 'Linh Chi',
    authorInitial: 'LC',
    authorColor: '#A855F7',
    time: 'Hôm qua · 07:45',
    foxPose: '/assets/fox/fox-mood-cheer-anim.webp',
    foxFallback: '/assets/fox/fox-mood-cheer.png',
    bg: 'linear-gradient(145deg, #F3E8FF 0%, #FAF5FF 55%, #E9D5FF 100%)',
    tag: 'Habit sáng',
    reactions: { '❤️': 4, '🦊': 1 }
  }
]

const QUICK_EMOJIS = ['🔥', '❤️', '🎉', '🦊']

export const FoxCameraScreen: React.FC<FoxCameraScreenProps> = ({
  onCloseToDashboard,
  onOpenProfile,
  onOpenMessages
}) => {
  const [flashOn, setFlashOn] = useState(false)
  const [poseIdx, setPoseIdx] = useState(0)
  const [friendIdx, setFriendIdx] = useState(0)
  const [isFlashing, setIsFlashing] = useState(false)
  const [captured, setCaptured] = useState(false)
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | undefined>(undefined)
  const [caption, setCaption] = useState('')
  const [feed, setFeed] = useState<SnapFeedItem[]>(INITIAL_FEED)
  const [sentToast, setSentToast] = useState(false)
  const [replyMap, setReplyMap] = useState<Record<string, string>>({})
  const [replySentId, setReplySentId] = useState<string | null>(null)

  // Real webcam support
  const [useRealCamera, setUseRealCamera] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Vertical snap-scroll container ref + mouse drag helper for desktop testing
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const mouseDragRef = useRef<{
    active: boolean
    startX: number
    startY: number
    startScrollTop: number
    locked: 'x' | 'y' | null
  }>({ active: false, startX: 0, startY: 0, startScrollTop: 0, locked: null })

  const currentPose = FOX_POSES[poseIdx]

  useEffect(() => {
    if (!useRealCamera) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      return
    }

    let cancelled = false
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setCameraError('')
      })
      .catch(() => {
        setCameraError('Không mở được camera thiết bị — đang dùng Fox Studio')
        setUseRealCamera(false)
      })

    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [useRealCamera])

  // Mouse vertical drag-to-scroll so PC users can pull up/down just like touch swipe
  const handleMouseDownScroll = (e: React.MouseEvent<HTMLDivElement>) => {
    const tag = (e.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return
    const el = scrollContainerRef.current
    if (!el) return
    mouseDragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startScrollTop: el.scrollTop,
      locked: null
    }
  }

  const handleMouseMoveScroll = (e: React.MouseEvent<HTMLDivElement>) => {
    const d = mouseDragRef.current
    const el = scrollContainerRef.current
    if (!d.active || !el) return

    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY

    if (!d.locked) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      d.locked = Math.abs(dy) >= Math.abs(dx) ? 'y' : 'x'
    }

    if (d.locked === 'y') {
      el.scrollTop = d.startScrollTop - dy
    }
  }

  const handleMouseUpScroll = () => {
    mouseDragRef.current.active = false
    mouseDragRef.current.locked = null
  }

  const scrollToFeed = () => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ top: el.clientHeight, behavior: 'smooth' })
  }

  const scrollToCamera = () => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCapture = () => {
    // Capture real webcam frame to dataURL if real camera is active
    let frameDataUrl: string | undefined
    if (useRealCamera && videoRef.current && videoRef.current.videoWidth > 0) {
      const video = videoRef.current
      const size = Math.min(video.videoWidth, video.videoHeight)
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 640
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const sx = (video.videoWidth - size) / 2
        const sy = (video.videoHeight - size) / 2
        ctx.translate(640, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 640, 640)
        frameDataUrl = canvas.toDataURL('image/jpeg', 0.85)
      }
    }

    setIsFlashing(true)
    setTimeout(() => {
      setIsFlashing(false)
      setCapturedImageUrl(frameDataUrl)
      setCaptured(true)
    }, 180)
  }

  const handleSendSnap = () => {
    const newSnap: SnapFeedItem = {
      id: `snap-${Date.now()}`,
      caption: caption.trim() || `${currentPose.label} · Check-in LifeQuest! ✨`,
      author: 'Minh Anh (Bạn)',
      authorInitial: 'MA',
      authorColor: '#F26B3A',
      time: 'Vừa xong',
      imageUrl: capturedImageUrl,
      foxPose: currentPose.img,
      foxFallback: currentPose.fallback,
      bg: currentPose.bg,
      tag: '+25 XP',
      reactions: { '🔥': 1 }
    }
    setFeed((prev) => [newSnap, ...prev])
    setCaptured(false)
    setCapturedImageUrl(undefined)
    setCaption('')
    setSentToast(true)
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.65 } })
    setTimeout(() => setSentToast(false), 2400)
  }

  const handleReact = (snapId: string, emoji: string) => {
    setFeed((prev) =>
      prev.map((item) => {
        if (item.id !== snapId) return item
        return {
          ...item,
          reactions: {
            ...item.reactions,
            [emoji]: (item.reactions[emoji] || 0) + 1
          }
        }
      })
    )
  }

  const handleSendReply = (snapId: string) => {
    if (!replyMap[snapId]?.trim()) return
    setReplyMap((prev) => ({ ...prev, [snapId]: '' }))
    setReplySentId(snapId)
    setTimeout(() => setReplySentId(null), 1800)
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background:
          'radial-gradient(circle at 50% 28%, #213F5C 0%, #12263A 56%, #0B1826 100%)',
        color: '#FFFFFF',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* Subtle Ambient Fox-Orange Glow */}
      <div
        style={{
          position: 'absolute',
          top: '18%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(242, 107, 58, 0.2) 0%, rgba(242, 107, 58, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Vertical Snap-Scroll Feed Container: Page 0 = Camera, Pages 1..N = Shared Photos */}
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDownScroll}
        onMouseMove={handleMouseMoveScroll}
        onMouseUp={handleMouseUpScroll}
        onMouseLeave={handleMouseUpScroll}
        className="phone-content"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          paddingBottom: 0
        }}
      >
        {/* ================================================================ */}
        {/* PAGE 0: FOX SNAP CAMERA CAPTURE                                  */}
        {/* ================================================================ */}
        <section
          style={{
            height: '100%',
            minHeight: '100%',
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '18px 18px 20px'
          }}
        >
          {/* 1. Top Bar (Profile · Bạn bè · Tin nhắn) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 4
            }}
          >
            <button
              onClick={onOpenProfile}
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1.5px solid rgba(255, 255, 255, 0.18)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer'
              }}
              title="Hồ sơ cá nhân"
            >
              <User size={19} />
            </button>

            <button
              onClick={() => setFriendIdx((i) => (i + 1) % FRIEND_GROUPS.length)}
              style={{
                height: 40,
                padding: '0 16px',
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.13)',
                border: '1.5px solid rgba(246, 200, 95, 0.32)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)'
              }}
              title="Đổi nhóm bạn nhận ảnh"
            >
              <Users size={15} color="#F6C85F" />
              <span>{FRIEND_GROUPS[friendIdx]}</span>
            </button>

            <button
              onClick={onOpenMessages}
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1.5px solid rgba(255, 255, 255, 0.18)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer'
              }}
              title="Tin nhắn"
            >
              <MessageCircle size={19} />
            </button>
          </div>

          {/* 2. Center Iconic Rounded-Square Fox Viewfinder */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              marginTop: 22
            }}
          >
            <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
              {/* Fox Mascot perched playfully ON TOP of the viewfinder */}
              <div
                onClick={() => setPoseIdx((i) => (i + 1) % FOX_POSES.length)}
                title="Chạm vào Fox để đổi biểu cảm"
                style={{
                  position: 'absolute',
                  top: -54,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 6,
                  cursor: 'pointer'
                }}
              >
                <img
                  src={currentPose.img}
                  alt={currentPose.label}
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.42))'
                  }}
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = currentPose.fallback
                  }}
                />
              </div>

              {/* Cute Fox Ears on top corners of viewfinder */}
              <svg
                width="100%"
                height="34"
                viewBox="0 0 320 34"
                fill="none"
                style={{
                  position: 'absolute',
                  top: -18,
                  left: 0,
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              >
                <path
                  d="M36 32 L28 6 C27.2 3.2 30.2 1.2 32.8 2.8 L64 21 Z"
                  fill="#F26B3A"
                  stroke="#F6C85F"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
                <path d="M40 27 L35 11 L54 22 Z" fill="#FFF2E0" />
                <path
                  d="M284 32 L292 6 C292.8 3.2 289.8 1.2 287.2 2.8 L256 21 Z"
                  fill="#F26B3A"
                  stroke="#F6C85F"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
                <path d="M280 27 L285 11 L266 22 Z" fill="#FFF2E0" />
              </svg>

              {/* Rounded Square Camera Frame */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: 42,
                  background: currentPose.bg,
                  border: '3px solid rgba(246, 200, 95, 0.78)',
                  boxShadow:
                    '0 0 0 4px rgba(242, 107, 58, 0.24), 0 22px 44px rgba(0, 0, 0, 0.45)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {captured && capturedImageUrl ? (
                  <img
                    src={capturedImageUrl}
                    alt="Ảnh vừa chụp"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : useRealCamera ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: '24px',
                      gap: 10
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 22,
                        background: 'rgba(242, 107, 58, 0.14)',
                        border: '2px dashed rgba(242, 107, 58, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#F26B3A'
                      }}
                    >
                      <Camera size={28} />
                    </div>
                    <b style={{ fontSize: 15, color: '#16324A' }}>Khung chụp Fox Snap</b>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#586D80',
                        maxWidth: 210,
                        lineHeight: 1.4
                      }}
                    >
                      Bấm <b>Bật Cam</b> ở góc trên để chụp ảnh thật hoặc bấm nút chụp để lưu khoảnh khắc!
                    </span>
                  </div>
                )}

                {/* Top-left Tag */}
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    zIndex: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'rgba(22, 50, 74, 0.72)',
                    backdropFilter: 'blur(6px)',
                    color: '#FFFFFF',
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 99
                  }}
                >
                  <Sparkles size={11} color="#F6C85F" />
                  <span>{captured ? 'Xem trước ảnh' : currentPose.label}</span>
                </div>

                {/* Top-right Live Webcam Toggle */}
                {!captured && (
                  <button
                    onClick={() => setUseRealCamera((v) => !v)}
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      zIndex: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: useRealCamera
                        ? 'var(--lq-accent)'
                        : 'rgba(22, 50, 74, 0.72)',
                      backdropFilter: 'blur(6px)',
                      color: '#FFFFFF',
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: '5px 10px',
                      borderRadius: 99,
                      border: '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer'
                    }}
                  >
                    <Camera size={12} />
                    <span>{useRealCamera ? 'Cam thật' : 'Bật Cam'}</span>
                  </button>
                )}

                {/* Caption Input Bar when Captured */}
                {captured && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 14,
                      left: 14,
                      right: 14,
                      zIndex: 5,
                      background: 'rgba(22, 50, 74, 0.84)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 16,
                      padding: '8px 12px',
                      border: '1px solid rgba(255, 255, 255, 0.22)'
                    }}
                  >
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Thêm lời nhắn khoe thành tích..."
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        color: '#FFFFFF',
                        fontSize: 12.5,
                        fontWeight: 600
                      }}
                    />
                  </div>
                )}

                {isFlashing && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: '#FFFFFF',
                      zIndex: 10
                    }}
                  />
                )}
              </div>
            </div>

            {cameraError && (
              <div style={{ fontSize: 11, color: '#F6C85F', fontWeight: 700 }}>
                {cameraError}
              </div>
            )}
            {sentToast && (
              <div
                className="animate-fade-in"
                style={{
                  background: 'rgba(22, 140, 120, 0.92)',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '6px 14px',
                  borderRadius: 99,
                  boxShadow: '0 6px 16px rgba(22, 140, 120, 0.4)'
                }}
              >
                Đã gửi lên bảng tin! Kéo từ dưới lên để xem ngay ✨
              </div>
            )}
          </div>

          {/* 3. Camera Controls Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '6px 10px 2px'
            }}
          >
            {!captured ? (
              <>
                {/* Left Special Button: 3D Amber-Gold Flash Jewel */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <button
                    onClick={() => setFlashOn((v) => !v)}
                    style={{
                      position: 'relative',
                      width: 54,
                      height: 54,
                      borderRadius: 18,
                      background: flashOn
                        ? 'linear-gradient(145deg, #FFE27A 0%, #F2AC22 100%)'
                        : 'linear-gradient(155deg, rgba(246, 200, 95, 0.24) 0%, rgba(196, 130, 18, 0.14) 100%)',
                      border: flashOn
                        ? '2px solid #FFF4C2'
                        : '1.5px solid rgba(246, 200, 95, 0.45)',
                      color: flashOn ? '#6E4600' : '#F6C85F',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: flashOn
                        ? '0 4px 0 #B57606, 0 10px 22px rgba(246, 200, 95, 0.5)'
                        : '0 4px 0 rgba(10, 22, 34, 0.65), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                      cursor: 'pointer'
                    }}
                    title="Bật/tắt đèn flash"
                  >
                    <Zap
                      size={23}
                      strokeWidth={2.4}
                      fill={flashOn ? '#6E4600' : 'rgba(246, 200, 95, 0.25)'}
                    />
                    {flashOn && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -5,
                          right: -5,
                          background: '#F26B3A',
                          color: '#FFFFFF',
                          fontSize: 8.5,
                          fontWeight: 900,
                          padding: '2px 5px',
                          borderRadius: 99,
                          border: '1.5px solid #12263A'
                        }}
                      >
                        ON
                      </span>
                    )}
                  </button>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: flashOn ? '#F6C85F' : 'rgba(255,255,255,0.68)'
                    }}
                  >
                    Flash
                  </span>
                </div>

                {/* Center Standout Hero Shutter */}
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg
                    width="82"
                    height="28"
                    viewBox="0 0 82 28"
                    fill="none"
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      pointerEvents: 'none',
                      zIndex: 1
                    }}
                  >
                    <path
                      d="M15 24 L10 5 C9.6 2.8 11.9 1.4 13.8 2.6 L30 13 Z"
                      fill="#F26B3A"
                      stroke="#F6C85F"
                      strokeWidth="2.4"
                      strokeLinejoin="round"
                    />
                    <path d="M17 19 L14.5 9 L24 15 Z" fill="#FFF3E0" />
                    <path
                      d="M67 24 L72 5 C72.4 2.8 70.1 1.4 68.2 2.6 L52 13 Z"
                      fill="#F26B3A"
                      stroke="#F6C85F"
                      strokeWidth="2.4"
                      strokeLinejoin="round"
                    />
                    <path d="M65 19 L67.5 9 L58 15 Z" fill="#FFF3E0" />
                  </svg>

                  <button
                    onClick={handleCapture}
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      width: 82,
                      height: 82,
                      borderRadius: '50%',
                      background:
                        'linear-gradient(145deg, #FF995C 0%, #F26B3A 55%, #D94A1E 100%)',
                      border: '3.5px solid #F6C85F',
                      padding: 5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow:
                        '0 5px 0 #9E3010, 0 0 0 5px rgba(242, 107, 58, 0.28), 0 12px 30px rgba(242, 107, 58, 0.65)',
                      cursor: 'pointer'
                    }}
                    title="Chụp Fox Snap"
                  >
                    <span
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background:
                          'linear-gradient(160deg, #FFFFFF 0%, #FFF1E3 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow:
                          'inset 0 -3px 6px rgba(242, 107, 58, 0.22), inset 0 2px 4px #FFFFFF'
                      }}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="14.6" r="4.5" fill="#F26B3A" />
                        <circle cx="6.8" cy="9.2" r="2.1" fill="#F26B3A" />
                        <circle cx="12" cy="7" r="2.2" fill="#F26B3A" />
                        <circle cx="17.2" cy="9.2" r="2.1" fill="#F26B3A" />
                      </svg>
                      <span
                        style={{
                          position: 'absolute',
                          top: 7,
                          right: 11,
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#F6C85F',
                          boxShadow: '0 0 6px #F6C85F'
                        }}
                      />
                    </span>
                  </button>
                </div>

                {/* Right Special Button: 3D Emerald-Teal Pose Jewel */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <button
                    onClick={() => setPoseIdx((i) => (i + 1) % FOX_POSES.length)}
                    style={{
                      position: 'relative',
                      width: 54,
                      height: 54,
                      borderRadius: 18,
                      background:
                        'linear-gradient(155deg, rgba(46, 196, 166, 0.3) 0%, rgba(22, 140, 120, 0.18) 100%)',
                      border: '1.5px solid rgba(68, 224, 192, 0.5)',
                      color: '#7CF2D9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow:
                        '0 4px 0 rgba(10, 48, 42, 0.85), inset 0 1px 1px rgba(255, 255, 255, 0.22)',
                      cursor: 'pointer'
                    }}
                    title="Đổi biểu cảm Fox"
                  >
                    <RefreshCw size={22} strokeWidth={2.4} />
                    <span
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        background: '#168C78',
                        color: '#FFFFFF',
                        fontSize: 8.5,
                        fontWeight: 900,
                        padding: '2px 5px',
                        borderRadius: 99,
                        border: '1.5px solid #12263A'
                      }}
                    >
                      {poseIdx + 1}/4
                    </span>
                  </button>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: 'rgba(124, 242, 217, 0.9)'
                    }}
                  >
                    Đổi Fox
                  </span>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setCaptured(false)
                    setCapturedImageUrl(undefined)
                    setCaption('')
                  }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 18,
                    background: 'rgba(255, 255, 255, 0.14)',
                    border: '1.5px solid rgba(255, 255, 255, 0.22)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Chụp lại"
                >
                  <RotateCcw size={21} />
                </button>

                <button
                  onClick={handleSendSnap}
                  style={{
                    height: 58,
                    padding: '0 28px',
                    borderRadius: 999,
                    background:
                      'linear-gradient(145deg, #FF9357 0%, #F26B3A 100%)',
                    border: '2px solid #F6C85F',
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow:
                      '0 4px 0 #B83D18, 0 12px 26px rgba(242, 107, 58, 0.5)',
                    cursor: 'pointer'
                  }}
                >
                  <Send size={18} />
                  <span>Gửi ngay</span>
                </button>

                <div style={{ width: 52 }} />
              </>
            )}
          </div>

          {/* 4. Bottom Pull-Up History Trigger & Swipe-to-Home Hint */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6
            }}
          >
            <button
              onClick={scrollToFeed}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                padding: '2px 16px'
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: '0.02em' }}>
                Kéo lên xem ảnh ({feed.length})
              </span>
              <ChevronDown size={18} color="#F6C85F" />
            </button>

            <button
              onClick={onCloseToDashboard}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: 99,
                padding: '4px 12px',
                color: 'rgba(255, 255, 255, 0.78)',
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer'
              }}
            >
              <span>Vuốt sang trái để về Trang chủ</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </section>

        {/* ================================================================ */}
        {/* PAGES 1..N: FULL-SCREEN LOCKET FEED OF FRIENDS & MY SNAPS        */}
        {/* ================================================================ */}
        {feed.map((item, idx) => (
          <section
            key={item.id}
            style={{
              height: '100%',
              minHeight: '100%',
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '18px 18px 22px',
              position: 'relative'
            }}
          >
            {/* Top Bar inside Feed Page */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 4
              }}
            >
              <button
                onClick={scrollToCamera}
                style={{
                  height: 38,
                  padding: '0 13px',
                  borderRadius: 999,
                  background: 'rgba(242, 107, 58, 0.22)',
                  border: '1.5px solid rgba(242, 107, 58, 0.5)',
                  color: '#FFB88C',
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer'
                }}
              >
                <ChevronUp size={15} />
                <span>Chụp ảnh</span>
              </button>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'rgba(255, 255, 255, 0.72)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '5px 12px',
                  borderRadius: 99
                }}
              >
                Ảnh {idx + 1} / {feed.length}
              </span>

              <button
                onClick={onOpenMessages}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1.5px solid rgba(255, 255, 255, 0.18)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <MessageCircle size={17} />
              </button>
            </div>

            {/* Center Photo Card (Matching Locket Rounded Square) */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}
            >
              {/* Photo Frame */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 326,
                  aspectRatio: '1 / 1',
                  borderRadius: 42,
                  background: item.bg,
                  border: '3px solid rgba(246, 200, 95, 0.65)',
                  boxShadow: '0 22px 44px rgba(0, 0, 0, 0.48)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.caption}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <img
                    src={item.foxPose}
                    alt={item.caption}
                    style={{
                      width: 225,
                      height: 225,
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 12px 22px rgba(22, 50, 74, 0.22))'
                    }}
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = item.foxFallback
                    }}
                  />
                )}

                {/* Top-right Quest Badge */}
                <span
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    background: 'rgba(22, 50, 74, 0.78)',
                    backdropFilter: 'blur(6px)',
                    color: '#F6C85F',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 99,
                    border: '1px solid rgba(246, 200, 95, 0.35)'
                  }}
                >
                  {item.tag}
                </span>

                {/* Bottom Caption Pill overlaid on photo */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 14,
                    left: 14,
                    right: 14,
                    background: 'rgba(16, 34, 52, 0.82)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 16,
                    padding: '9px 14px',
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    lineHeight: 1.35,
                    border: '1px solid rgba(255, 255, 255, 0.14)'
                  }}
                >
                  {item.caption}
                </div>
              </div>

              {/* Author Info Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: item.authorColor,
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(255, 255, 255, 0.85)'
                  }}
                >
                  {item.authorInitial}
                </div>
                <b style={{ fontSize: 14, color: '#FFFFFF' }}>{item.author}</b>
                <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.58)', fontWeight: 600 }}>
                  · {item.time}
                </span>
              </div>
            </div>

            {/* Bottom Reaction & Quick Reply Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Quick Emoji Reactions */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                {QUICK_EMOJIS.map((emoji) => {
                  const count = item.reactions[emoji] || 0
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReact(item.id, emoji)}
                      style={{
                        height: 36,
                        padding: '0 12px',
                        borderRadius: 99,
                        background:
                          count > 0
                            ? 'rgba(242, 107, 58, 0.24)'
                            : 'rgba(255, 255, 255, 0.1)',
                        border:
                          count > 0
                            ? '1px solid rgba(246, 200, 95, 0.45)'
                            : '1px solid rgba(255, 255, 255, 0.14)',
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        cursor: 'pointer'
                      }}
                    >
                      <span>{emoji}</span>
                      {count > 0 && <span style={{ fontSize: 11.5 }}>{count}</span>}
                    </button>
                  )
                })}
              </div>

              {/* Quick Message Input */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  borderRadius: 99,
                  padding: '6px 8px 6px 16px'
                }}
              >
                <input
                  type="text"
                  value={replyMap[item.id] || ''}
                  onChange={(e) =>
                    setReplyMap((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendReply(item.id)
                  }}
                  placeholder={
                    replySentId === item.id
                      ? 'Đã gửi lời nhắn! ✨'
                      : `Gửi lời nhắn cho ${item.author.split(' ')[0]}...`
                  }
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    color: '#FFFFFF',
                    fontSize: 12.5,
                    fontWeight: 600
                  }}
                />
                <button
                  onClick={() => handleSendReply(item.id)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'var(--lq-accent)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <Send size={15} />
                </button>
              </div>

              {/* Bottom Scroll Hint */}
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.5)'
                }}
              >
                {idx === 0
                  ? 'Kéo từ trên xuống để quay về chụp hình · Kéo lên xem ảnh tiếp'
                  : idx < feed.length - 1
                  ? 'Kéo lên xem ảnh tiếp · Kéo hết lên trên để về chụp hình'
                  : 'Đã xem hết ảnh · Kéo xuống để quay về chỗ chụp hình'}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default FoxCameraScreen
