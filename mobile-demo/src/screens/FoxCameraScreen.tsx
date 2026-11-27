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

interface SnapHistoryItem {
  id: string
  caption: string
  author: string
  time: string
  foxPose: string
  bg: string
  tag: string
}

const FOX_POSES = [
  { id: 'cheer', label: 'Fox Cổ vũ', img: '/assets/fox/fox-mood-cheer-anim.webp', fallback: '/assets/fox/fox-mood-cheer.png', bg: 'linear-gradient(145deg, #FFE4CC 0%, #FFF5EA 55%, #FFD7B8 100%)' },
  { id: 'celebrate', label: 'Fox Ăn mừng', img: '/assets/fox/fox-mood-celebrate-anim.webp', fallback: '/assets/fox/fox-mood-celebrate.png', bg: 'linear-gradient(145deg, #FFF1C9 0%, #FFF9E8 55%, #FFE2A8 100%)' },
  { id: 'focus', label: 'Fox Tập trung', img: '/assets/fox/fox-cp1-anim.webp', fallback: '/assets/fox/fox-cp1.png', bg: 'linear-gradient(145deg, #D9F5EC 0%, #F2FCF9 55%, #C6EFE2 100%)' },
  { id: 'summit', label: 'Fox Chinh phục', img: '/assets/fox/fox-cta-summit-anim.webp', fallback: '/assets/fox/fox-cta-summit.png', bg: 'linear-gradient(145deg, #DCEBFF 0%, #F3F8FF 55%, #C9E0FF 100%)' }
]

const FRIEND_GROUPS = ['Bạn bè (4)', 'Hà My', 'Nhóm Giải tích', 'Chỉ mình tôi']

const INITIAL_HISTORY: SnapHistoryItem[] = [
  {
    id: 'snap-1',
    caption: 'Hoàn thành 20 phút chạy bộ! 🔥',
    author: 'Minh Anh',
    time: 'Hôm nay · 18:40',
    foxPose: '/assets/fox/fox-mood-celebrate-anim.webp',
    bg: 'linear-gradient(145deg, #FFE5CC, #FFF6EC)',
    tag: '+30 XP'
  },
  {
    id: 'snap-2',
    caption: 'Đang ôn Chương 3 cùng Fox 📚',
    author: 'Hà My',
    time: 'Hôm nay · 15:15',
    foxPose: '/assets/fox/fox-cp1-anim.webp',
    bg: 'linear-gradient(145deg, #DDF6EE, #F3FCF9)',
    tag: 'Chuỗi 7 ngày'
  },
  {
    id: 'snap-3',
    caption: 'Lên cấp 7 rồi nè!! 🎉',
    author: 'Minh Anh',
    time: 'Hôm qua · 21:05',
    foxPose: '/assets/fox/fox-cta-summit-anim.webp',
    bg: 'linear-gradient(145deg, #FFF2CC, #FFF9EB)',
    tag: 'Cấp 7'
  }
]

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
  const [caption, setCaption] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<SnapHistoryItem[]>(INITIAL_HISTORY)
  const [sentToast, setSentToast] = useState(false)

  // Optional real webcam support
  const [useRealCamera, setUseRealCamera] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

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

  const handleCapture = () => {
    setIsFlashing(true)
    setTimeout(() => {
      setIsFlashing(false)
      setCaptured(true)
    }, 180)
  }

  const handleSendSnap = () => {
    const newSnap: SnapHistoryItem = {
      id: `snap-${Date.now()}`,
      caption: caption.trim() || `${currentPose.label} · Check-in LifeQuest! ✨`,
      author: 'Minh Anh',
      time: 'Vừa xong',
      foxPose: currentPose.img,
      bg: currentPose.bg,
      tag: '+25 XP'
    }
    setHistory((prev) => [newSnap, ...prev])
    setCaptured(false)
    setCaption('')
    setSentToast(true)
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.65 } })
    setTimeout(() => setSentToast(false), 2400)
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
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '18px 18px 22px',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* Subtle Ambient Fox-Orange Glow Behind Viewfinder */}
      <div
        style={{
          position: 'absolute',
          top: '18%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(242, 107, 58, 0.22) 0%, rgba(242, 107, 58, 0) 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* 1. Top Bar (Profile · Bạn bè · Tin nhắn) */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 6
        }}
      >
        {/* Profile Circle Button */}
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

        {/* Center Friends Pill */}
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

        {/* Chat Circle Button */}
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
          position: 'relative',
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          marginTop: 22
        }}
      >
        <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
          {/* Fox Mascot perched playfully ON TOP of the viewfinder (never blocks your face!) */}
          <div
            onClick={() => setPoseIdx((i) => (i + 1) % FOX_POSES.length)}
            title="Chạm vào Fox để đổi biểu cảm"
            style={{
              position: 'absolute',
              top: -54,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 6,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 6,
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
                filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.42))',
                transition: 'transform 0.2s ease'
              }}
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = currentPose.fallback
              }}
            />
          </div>

          {/* Cute Fox Ears peeking from top corners of the viewfinder */}
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
            {/* Left Fox Ear */}
            <path
              d="M36 32 L28 6 C27.2 3.2 30.2 1.2 32.8 2.8 L64 21 Z"
              fill="#F26B3A"
              stroke="#F6C85F"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <path d="M40 27 L35 11 L54 22 Z" fill="#FFF2E0" />
            {/* Right Fox Ear */}
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
            {/* Real Camera Stream (if enabled) — 100% clear & unobstructed */}
            {useRealCamera ? (
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
              /* Clean Studio Placeholder when real camera is off */
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
                <span style={{ fontSize: 12, fontWeight: 600, color: '#586D80', maxWidth: 210, lineHeight: 1.4 }}>
                  Bấm <b>Bật Cam</b> ở góc trên để chụp ảnh thật hoặc bấm nút chụp để lưu khoảnh khắc!
                </span>
              </div>
            )}

            {/* Top-left Fox Snap Live Tag */}
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
                  background: 'rgba(22, 50, 74, 0.82)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 16,
                  padding: '8px 12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
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

            {/* Shutter Flash Overlay */}
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

        {/* Camera Error / Sent Toast */}
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
            Đã gửi Fox Snap cho {FRIEND_GROUPS[friendIdx]} · +25 XP!
          </div>
        )}
      </div>

      {/* 3. Camera Controls Row (Special Jewel Flash · Standout Fox-Eared Shutter · Special Emerald Flip) */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '8px 10px 2px'
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
                <Zap size={23} strokeWidth={2.4} fill={flashOn ? '#6E4600' : 'rgba(246, 200, 95, 0.25)'} />
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
              <span style={{ fontSize: 10.5, fontWeight: 700, color: flashOn ? '#F6C85F' : 'rgba(255,255,255,0.68)' }}>
                Flash
              </span>
            </div>

            {/* Center Standout Hero Shutter: Tactile 3D Fox-Eared Orange & Gold Shutter */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Mini Fox Ears on top of the Shutter Button */}
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
                  background: 'linear-gradient(145deg, #FF995C 0%, #F26B3A 55%, #D94A1E 100%)',
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
                    background: 'linear-gradient(160deg, #FFFFFF 0%, #FFF1E3 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 -3px 6px rgba(242, 107, 58, 0.22), inset 0 2px 4px #FFFFFF'
                  }}
                >
                  {/* Bold Fox Paw Print Emblem */}
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="14.6" r="4.5" fill="#F26B3A" />
                    <circle cx="6.8" cy="9.2" r="2.1" fill="#F26B3A" />
                    <circle cx="12" cy="7" r="2.2" fill="#F26B3A" />
                    <circle cx="17.2" cy="9.2" r="2.1" fill="#F26B3A" />
                  </svg>
                  {/* Tiny Golden Sparkle */}
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

            {/* Right Special Button: 3D Emerald-Teal Pose/Flip Jewel */}
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
                title="Đổi biểu cảm Fox / Camera"
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
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(124, 242, 217, 0.9)' }}>
                Đổi Fox
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Retake Button */}
            <button
              onClick={() => {
                setCaptured(false)
                setCaption('')
              }}
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
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

            {/* Send Fox Snap Button */}
            <button
              onClick={handleSendSnap}
              style={{
                height: 58,
                padding: '0 28px',
                borderRadius: 999,
                background: 'linear-gradient(145deg, #FF9357 0%, #F26B3A 100%)',
                border: '2px solid #F6C85F',
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 0 #B83D18, 0 12px 26px rgba(242, 107, 58, 0.5)',
                cursor: 'pointer'
              }}
            >
              <Send size={18} />
              <span>Gửi ngay</span>
            </button>

            <div style={{ width: 50 }} />
          </>
        )}
      </div>

      {/* 4. Bottom History Trigger & Swipe Hint */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6
        }}
      >
        <button
          onClick={() => setShowHistory(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer',
            padding: '4px 16px'
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: '0.02em' }}>
            Lịch sử ({history.length})
          </span>
          <ChevronDown size={18} color="#F6C85F" />
        </button>

        {/* Quick Swipe-back / Tap-back hint */}
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

      {/* Slide-Up History Drawer */}
      {showHistory && (
        <div
          className="animate-fade-in"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            background: 'rgba(11, 24, 38, 0.94)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 16px 24px',
            gap: 14
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <b style={{ fontSize: 17, color: '#FFFFFF' }}>Lịch sử Fox Snap</b>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.65)' }}>
                Khoảnh khắc hoàn thành nhiệm vụ cùng bạn bè
              </div>
            </div>

            <button
              onClick={() => setShowHistory(false)}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ChevronUp size={20} />
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            {history.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 20,
                  padding: 12,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: item.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <img
                    src={item.foxPose}
                    alt={item.caption}
                    style={{ width: 54, height: 54, objectFit: 'contain' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <b style={{ fontSize: 13, color: '#FFFFFF' }}>{item.author}</b>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: 99,
                        background: 'rgba(246, 200, 95, 0.2)',
                        color: '#F6C85F'
                      }}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: 'rgba(255, 255, 255, 0.9)',
                      marginTop: 3,
                      lineHeight: 1.35
                    }}
                  >
                    {item.caption}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginTop: 4
                    }}
                  >
                    {item.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FoxCameraScreen
