import { useId, type ReactNode } from 'react'
import { CheckCircle2, Flag, Globe2, ImageOff, Lock, Sparkles, Users } from 'lucide-react'
import foxCelebrateAnim from '@/assets/landing/fox-mood-celebrate-anim.webp'
import foxCelebrateStatic from '@/assets/landing/fox-mood-celebrate-static.webp'
import foxCheerAnim from '@/assets/landing/fox-mood-cheer-anim.webp'
import foxCheerStatic from '@/assets/landing/fox-mood-cheer-static.webp'
import foxHappyAnim from '@/assets/landing/fox-mood-happy-anim.webp'
import foxHappyStatic from '@/assets/landing/fox-mood-happy-static.webp'
import foxHeroAnim from '@/assets/landing/fox-hero-anim.webp'
import foxHeroStatic from '@/assets/landing/fox-hero-static.webp'
import foxCampStatic from '@/assets/landing/fox-footer-camp-static.webp'
import { useUiStore } from '@/stores/uiStore'
import styles from './journal.module.css'

export type ClothColor = 'navy' | 'teal' | 'plum' | 'sand' | 'rust'
export type MediaVisibility = 'PRIVATE' | 'FRIENDS' | 'GROUP'
export type FoxPortraitMood = 'explorer' | 'happy' | 'cheer' | 'celebrate' | 'camp'

const CLOTH_CLASS: Record<ClothColor, string> = {
  navy: styles.clothNavy,
  teal: styles.clothTeal,
  plum: styles.clothPlum,
  sand: styles.clothSand,
  rust: styles.clothRust,
}

export function ClothCover({
  color = 'navy',
  stitched = true,
  elasticBand = true,
  bookmark = true,
  className = '',
  children,
}: {
  color?: ClothColor
  stitched?: boolean
  elasticBand?: boolean
  bookmark?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`${styles.clothCover} ${CLOTH_CLASS[color]} ${className}`.trim()}>
      {stitched && <span className={styles.clothStitched} aria-hidden="true" />}
      {elasticBand && <span className={styles.clothElastic} aria-hidden="true" />}
      {bookmark && (
        <span
          className={`${styles.bookmarkRibbon} ${color === 'teal' ? styles.bookmarkOrange : ''}`.trim()}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  )
}

export function PaperPage({
  side = 'single',
  className = '',
  children,
}: {
  side?: 'left' | 'right' | 'single'
  className?: string
  children: ReactNode
}) {
  const sideCls =
    side === 'left' ? styles.paperLeft : side === 'right' ? styles.paperRight : styles.paperSingle
  return <div className={`${styles.paperPage} ${sideCls} ${className}`.trim()}>{children}</div>
}

export function BookSpine() {
  return <div className={styles.bookSpine} aria-hidden="true" />
}

export function PrivacyPill({ visibility }: { visibility: MediaVisibility }) {
  if (visibility === 'PRIVATE') {
    return (
      <span className={`${styles.privacyPill} ${styles.pillPrivate}`}>
        <Lock size={11} aria-hidden="true" />
        <span>Chỉ mình tôi</span>
      </span>
    )
  }
  if (visibility === 'FRIENDS') {
    return (
      <span className={`${styles.privacyPill} ${styles.pillFriends}`}>
        <Users size={11} aria-hidden="true" />
        <span>Bạn bè</span>
      </span>
    )
  }
  return (
    <span className={`${styles.privacyPill} ${styles.pillGroup}`}>
      <Globe2 size={11} aria-hidden="true" />
      <span>Nhóm</span>
    </span>
  )
}

export function EvidenceChip() {
  return (
    <span className={`${styles.privacyPill} ${styles.pillEvidence}`}>
      <CheckCircle2 size={11} aria-hidden="true" />
      <span>Minh chứng Task</span>
    </span>
  )
}

export function MomentChip() {
  return (
    <span className={`${styles.privacyPill} ${styles.pillMoment}`}>
      <Sparkles size={11} aria-hidden="true" />
      <span>Moment</span>
    </span>
  )
}

export function DecorativeLabel() {
  return <span className={`${styles.privacyPill} ${styles.pillDecorative}`}>TRANG TRÍ</span>
}

export function RouteLine({ dark = false }: { dark?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const stroke = dark ? 'rgba(251, 247, 239, 0.78)' : '#F26B3A'
  const glow = dark ? 'rgba(251, 247, 239, 0.22)' : 'rgba(242, 107, 58, 0.22)'
  const accent = dark ? '#F7C96B' : '#168C78'
  const nodeFill = dark ? '#1C3A54' : '#FBF7EF'

  return (
    <div className={styles.routeLineWrap} aria-hidden="true">
      <svg
        className={styles.routeLineSvg}
        viewBox="0 0 420 32"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`rt-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accent} />
            <stop offset="55%" stopColor={stroke} />
            <stop offset="100%" stopColor="#F26B3A" />
          </linearGradient>
        </defs>
        {/* Soft winding trail shadow/glow */}
        <path
          d="M 10 19 C 72 5, 126 30, 194 16 C 262 2, 322 28, 396 14"
          fill="none"
          stroke={glow}
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Winding dashed adventure trail */}
        <path
          className={styles.routePathDash}
          d="M 10 19 C 72 5, 126 30, 194 16 C 262 2, 322 28, 396 14"
          fill="none"
          stroke={`url(#rt-grad-${uid})`}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray="6 7"
        />
        {/* Start compass pin */}
        <circle cx="10" cy="19" r="5" fill={accent} opacity="0.22" />
        <circle cx="10" cy="19" r="3.2" fill={accent} stroke={nodeFill} strokeWidth="1.4" />
        {/* Milestone waypoints */}
        <circle cx="132" cy="21" r="6" fill={glow} className={styles.routePulse} />
        <circle cx="132" cy="21" r="3.4" fill={stroke} stroke={nodeFill} strokeWidth="1.5" />
        <circle cx="268" cy="12" r="6" fill={glow} className={styles.routePulse} />
        <circle cx="268" cy="12" r="3.4" fill={accent} stroke={nodeFill} strokeWidth="1.5" />
        {/* Tiny decorative sparkles along the path */}
        <path
          d="M 78 10 L 79.5 13 L 82.5 14.5 L 79.5 16 L 78 19 L 76.5 16 L 73.5 14.5 L 76.5 13 Z"
          fill={stroke}
          opacity="0.7"
        />
        <path
          d="M 334 19 L 335.2 21.5 L 337.7 22.7 L 335.2 23.9 L 334 26.4 L 332.8 23.9 L 330.3 22.7 L 332.8 21.5 Z"
          fill={accent}
          opacity="0.75"
        />
        {/* Destination milestone node */}
        <circle cx="396" cy="14" r="5.5" fill="rgba(242, 107, 58, 0.25)" />
        <circle cx="396" cy="14" r="3.2" fill="#F26B3A" stroke={nodeFill} strokeWidth="1.4" />
      </svg>
      <span className={styles.routeFlagBadge}>
        <Flag size={13} color={dark ? '#FBF7EF' : '#F26B3A'} />
      </span>
    </div>
  )
}

export function MilestonePill({ label }: { label: string }) {
  return (
    <span className={styles.milestonePill}>
      <Flag size={12} aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}

export function PassportStamp({ top, bottom }: { top: string; bottom: string }) {
  return (
    <span className={styles.passportStamp} aria-label={`${top} ${bottom}`}>
      <span>{top}</span>
      <span>{bottom}</span>
    </span>
  )
}

export function TicketStat({
  icon,
  value,
  label,
  hidden = false,
  hiddenText = 'Đã ẩn bởi chủ hồ sơ',
}: {
  icon: ReactNode
  value?: string | number
  label: string
  hidden?: boolean
  hiddenText?: string
}) {
  if (hidden) {
    return (
      <div className={`${styles.ticketStat} ${styles.ticketHidden}`} data-testid="ticket-stat-hidden">
        <Lock size={15} aria-hidden="true" />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div>
          <div style={{ fontSize: 11 }}>{hiddenText}</div>
        </div>
      </div>
    )
  }
  return (
    <div className={styles.ticketStat}>
      <span aria-hidden="true" style={{ display: 'inline-flex', color: '#F26B3A' }}>
        {icon}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15 }}>{value}</div>
        <div style={{ fontSize: 11.5, color: '#5A6B7A', fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  )
}

export function WashiTape({
  tone = 'cream',
  angle = -6,
  style,
}: {
  tone?: 'cream' | 'teal' | 'orange'
  angle?: number
  style?: React.CSSProperties
}) {
  const toneCls =
    tone === 'teal' ? styles.washiTeal : tone === 'orange' ? styles.washiOrange : styles.washiCream
  return (
    <span
      className={`${styles.washiTape} ${toneCls}`}
      style={{ transform: `rotate(${angle}deg)`, ...style }}
      aria-hidden="true"
    />
  )
}

const FOX_ASSETS: Record<FoxPortraitMood, { anim: string; static: string; alt: string }> = {
  explorer: {
    anim: foxHeroAnim,
    static: foxHeroStatic,
    alt: 'Fox V2 Thám hiểm đồng hành cùng bạn',
  },
  happy: {
    anim: foxHappyAnim,
    static: foxHappyStatic,
    alt: 'Fox V2 vui vẻ',
  },
  cheer: {
    anim: foxCheerAnim,
    static: foxCheerStatic,
    alt: 'Fox V2 cổ vũ hành trình',
  },
  celebrate: {
    anim: foxCelebrateAnim,
    static: foxCelebrateStatic,
    alt: 'Fox V2 ăn mừng cột mốc',
  },
  camp: {
    anim: foxCampStatic,
    static: foxCampStatic,
    alt: 'Fox V2 nghỉ ngơi bên trại',
  },
}

export function FoxStage({
  mood = 'explorer',
  caption,
  badge,
  compact = false,
}: {
  mood?: FoxPortraitMood
  caption?: string
  badge?: string
  compact?: boolean
}) {
  const reducedMotion = useUiStore((s) => s.reducedMotion)
  const asset = FOX_ASSETS[mood]
  const src = reducedMotion ? asset.static : asset.anim

  return (
    <div className={styles.foxStage} data-testid="fox-stage">
      <span className={`${styles.photoCorner} ${styles.cornerTL}`} aria-hidden="true" />
      <span className={`${styles.photoCorner} ${styles.cornerTR}`} aria-hidden="true" />
      <span className={`${styles.photoCorner} ${styles.cornerBL}`} aria-hidden="true" />
      <span className={`${styles.photoCorner} ${styles.cornerBR}`} aria-hidden="true" />
      {badge && (
        <span
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: '#16324A',
            color: '#FBF7EF',
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: 999,
          }}
        >
          {badge}
        </span>
      )}
      <img
        src={src}
        alt={asset.alt}
        className={styles.foxStageImg}
        style={compact ? { width: 120, height: 120 } : undefined}
        draggable={false}
      />
      {caption && <span className={styles.foxStageCaption}>{caption}</span>}
    </div>
  )
}

export type SampleIllustrationKey =
  | 'sunrise-run'
  | 'mountain-summit'
  | 'study-desk'
  | 'book-shelf'
  | 'morning-coffee'
  | 'group-run'

export function JournalIllustration({
  kind,
  alt,
}: {
  kind: SampleIllustrationKey
  alt: string
}) {
  const uid = useId().replace(/:/g, '')

  switch (kind) {
    case 'sunrise-run':
      return (
        <svg viewBox="0 0 320 200" role="img" aria-label={alt}>
          <defs>
            <linearGradient id={`sr-sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFE9C7" />
              <stop offset="55%" stopColor="#FFC185" />
              <stop offset="100%" stopColor="#F58D56" />
            </linearGradient>
            <radialGradient id={`sr-sun-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF7D6" />
              <stop offset="55%" stopColor="#FFB057" />
              <stop offset="100%" stopColor="#F26B3A" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`sr-hill-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C96A3F" />
              <stop offset="100%" stopColor="#7A3E2A" />
            </linearGradient>
            <linearGradient id={`sr-road-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#284863" />
              <stop offset="100%" stopColor="#16324A" />
            </linearGradient>
          </defs>
          <rect width="320" height="200" fill={`url(#sr-sky-${uid})`} />
          {/* Warm sun halo & core */}
          <circle cx="164" cy="106" r="68" fill={`url(#sr-sun-${uid})`} />
          <circle cx="164" cy="106" r="28" fill="#FFF3C4" opacity="0.95" />
          {/* Drifting morning clouds */}
          <path d="M28 52 Q42 40 58 46 Q72 38 86 48 Q98 48 100 56 L24 56 Z" fill="#FFF7EB" opacity="0.72" />
          <path d="M214 42 Q228 32 246 38 Q260 32 272 42 Q284 42 286 49 L210 49 Z" fill="#FFF7EB" opacity="0.65" />
          {/* Distant birds */}
          <path d="M96 72 Q101 66 106 72 Q111 66 116 72" fill="none" stroke="#8E4A30" strokeWidth="1.6" strokeLinecap="round" opacity="0.65" />
          <path d="M226 68 Q230 63 234 68 Q238 63 242 68" fill="none" stroke="#8E4A30" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
          {/* Far misty hills */}
          <path d="M0 128 Q75 94 162 118 T320 108 L320 200 L0 200 Z" fill="#DF8958" opacity="0.82" />
          {/* Foreground rolling hills */}
          <path d="M0 140 Q90 112 170 132 T320 124 L320 200 L0 200 Z" fill={`url(#sr-hill-${uid})`} />
          {/* Pine tree silhouettes */}
          <polygon points="34,132 42,108 50,132" fill="#4E2B22" opacity="0.75" />
          <polygon points="48,136 55,116 62,136" fill="#4E2B22" opacity="0.68" />
          <polygon points="274,126 283,100 292,126" fill="#4E2B22" opacity="0.78" />
          <polygon points="258,130 265,110 272,130" fill="#4E2B22" opacity="0.65" />
          {/* Winding perspective running trail */}
          <path d="M104 200 Q138 158 155 126 L169 126 Q182 156 220 200 Z" fill={`url(#sr-road-${uid})`} />
          <path d="M161 130 Q162 158 162 196" fill="none" stroke="#FFE9C7" strokeWidth="2.8" strokeDasharray="8 7" strokeLinecap="round" />
          {/* Trail side glow */}
          <path d="M104 200 Q138 158 155 126" fill="none" stroke="#FFC185" strokeWidth="1.5" opacity="0.6" />
          <path d="M220 200 Q182 156 169 126" fill="none" stroke="#FFC185" strokeWidth="1.5" opacity="0.6" />
          {/* Milestone flag beside trail */}
          <line x1="208" y1="158" x2="208" y2="134" stroke="#FBF7EF" strokeWidth="2" />
          <polygon points="208,134 224,139 208,145" fill="#F26B3A" />
        </svg>
      )
    case 'mountain-summit':
      return (
        <svg viewBox="0 0 320 200" role="img" aria-label={alt}>
          <defs>
            <linearGradient id={`ms-sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9EDFD5" />
              <stop offset="55%" stopColor="#DCF4EE" />
              <stop offset="100%" stopColor="#FFF5E1" />
            </linearGradient>
            <linearGradient id={`ms-peak1-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1B9C86" />
              <stop offset="100%" stopColor="#125C52" />
            </linearGradient>
            <linearGradient id={`ms-peak2-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#264E70" />
              <stop offset="100%" stopColor="#142C42" />
            </linearGradient>
          </defs>
          <rect width="320" height="200" fill={`url(#ms-sky-${uid})`} />
          {/* Sun + soft halo */}
          <circle cx="256" cy="48" r="32" fill="#FFE6A3" opacity="0.45" />
          <circle cx="256" cy="48" r="18" fill="#F7C96B" />
          {/* Clouds */}
          <path d="M24 62 Q40 48 60 54 Q74 44 92 56 Q104 56 106 64 L20 64 Z" fill="#FFFFFF" opacity="0.82" />
          <path d="M188 76 Q200 66 216 70 Q228 64 238 74 L184 76 Z" fill="#FFFFFF" opacity="0.65" />
          {/* Distant range */}
          <polygon points="-10,200 66,94 148,200" fill="#7AC0B4" opacity="0.65" />
          {/* Main emerald summit with sunlit & shaded facet */}
          <polygon points="16,200 128,58 238,200" fill={`url(#ms-peak1-${uid})`} />
          <polygon points="128,58 168,200 238,200" fill="#0F4B43" opacity="0.35" />
          {/* Snow cap */}
          <polygon points="128,58 104,92 118,86 128,96 140,86 152,92" fill="#FBF7EF" />
          {/* Right navy peak */}
          <polygon points="134,200 228,84 328,200" fill={`url(#ms-peak2-${uid})`} />
          <polygon points="228,84 210,110 222,105 232,112 246,108" fill="#E8F1F5" opacity="0.92" />
          {/* Winding summit trail */}
          <path d="M84 200 Q116 174 106 152 T128 104" fill="none" stroke="#F7C96B" strokeWidth="2.4" strokeDasharray="5 5" strokeLinecap="round" />
          {/* Summit flag & sparkles */}
          <line x1="128" y1="58" x2="128" y2="32" stroke="#16324A" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M128 33 L154 40 L128 48 Z" fill="#F26B3A" />
          <circle cx="158" cy="30" r="2.2" fill="#F26B3A" opacity="0.8" />
          <circle cx="112" cy="40" r="1.8" fill="#F7C96B" />
          {/* Foreground pine treeline */}
          <polygon points="14,200 26,166 38,200" fill="#123836" />
          <polygon points="32,200 46,158 60,200" fill="#164A45" />
          <polygon points="266,200 280,162 294,200" fill="#10293D" />
          <polygon points="286,200 302,154 318,200" fill="#16324A" />
        </svg>
      )
    case 'study-desk':
      return (
        <svg viewBox="0 0 320 200" role="img" aria-label={alt}>
          <defs>
            <linearGradient id={`sd-wall-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F9F2E4" />
              <stop offset="100%" stopColor="#EADCC6" />
            </linearGradient>
            <linearGradient id={`sd-win-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1C3A54" />
              <stop offset="100%" stopColor="#3B6B8C" />
            </linearGradient>
            <linearGradient id={`sd-lamp-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFE09E" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#FFE09E" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="320" height="200" fill={`url(#sd-wall-${uid})`} />
          {/* Evening window with moon & stars */}
          <rect x="26" y="18" width="84" height="74" rx="8" fill={`url(#sd-win-${uid})`} stroke="#FFFFFF" strokeWidth="4" />
          <circle cx="52" cy="42" r="9" fill="#FFE6A3" />
          <circle cx="56" cy="40" r="8" fill="#234866" />
          <circle cx="82" cy="36" r="1.8" fill="#FFF7D6" />
          <circle cx="94" cy="54" r="1.4" fill="#FFF7D6" />
          <circle cx="72" cy="60" r="1.3" fill="#FFF7D6" />
          {/* Warm desk lamp & light cone */}
          <polygon points="218,54 166,142 268,142" fill={`url(#sd-lamp-${uid})`} />
          <path d="M238 140 L238 72 Q238 56 222 54" fill="none" stroke="#16324A" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M204 58 L228 48 L234 62 Z" fill="#F26B3A" />
          {/* Wooden desk surface */}
          <rect x="18" y="140" width="284" height="16" rx="6" fill="#C49A6C" />
          <rect x="18" y="152" width="284" height="5" rx="2" fill="#9E764D" opacity="0.65" />
          {/* Open laptop with glowing LifeQuest dashboard */}
          <rect x="78" y="72" width="112" height="68" rx="8" fill="#16324A" />
          <rect x="85" y="79" width="98" height="52" rx="4" fill="#CBECE4" />
          <rect x="93" y="88" width="44" height="8" rx="3" fill="#168C78" opacity="0.85" />
          <rect x="93" y="101" width="76" height="6" rx="3" fill="#1C3A54" opacity="0.3" />
          <rect x="93" y="112" width="58" height="6" rx="3" fill="#F26B3A" opacity="0.75" />
          <rect x="68" y="136" width="132" height="6" rx="3" fill="#2C4D69" />
          {/* Stacked notebook + mug + cozy plant */}
          <rect x="26" y="128" width="42" height="12" rx="3" fill="#F26B3A" />
          <rect x="30" y="120" width="36" height="8" rx="2" fill="#168C78" />
          <rect x="210" y="114" width="26" height="26" rx="6" fill="#FBF7EF" stroke="#16324A" strokeWidth="2" />
          <path d="M236 120 C244 120 244 134 236 134" fill="none" stroke="#16324A" strokeWidth="2.5" />
          <path d="M220 107 Q223 100 220 94" fill="none" stroke="#F26B3A" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          {/* Potted plant */}
          <rect x="258" y="114" width="28" height="26" rx="5" fill="#D47746" />
          <ellipse cx="264" cy="104" rx="10" ry="15" transform="rotate(-24 264 104)" fill="#168C78" />
          <ellipse cx="280" cy="102" rx="10" ry="15" transform="rotate(22 280 102)" fill="#1E9E86" />
          <ellipse cx="272" cy="96" rx="7" ry="14" fill="#136E5E" />
        </svg>
      )
    case 'book-shelf':
      return (
        <svg viewBox="0 0 320 200" role="img" aria-label={alt}>
          <defs>
            <linearGradient id={`bs-bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FAF2E3" />
              <stop offset="100%" stopColor="#E6D9C3" />
            </linearGradient>
            <linearGradient id={`bs-beam-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF8DE" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#FFF8DE" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="320" height="200" fill={`url(#bs-bg-${uid})`} />
          {/* Sunbeam diagonal */}
          <polygon points="0,0 130,0 240,200 70,200" fill={`url(#bs-beam-${uid})`} />
          {/* Trailing vine leaves from top right */}
          <path d="M270 0 Q262 34 276 62" fill="none" stroke="#14594F" strokeWidth="2" />
          <ellipse cx="262" cy="22" rx="9" ry="5" transform="rotate(-25 262 22)" fill="#168C78" />
          <ellipse cx="276" cy="40" rx="10" ry="5" transform="rotate(20 276 40)" fill="#1FA38B" />
          <ellipse cx="266" cy="56" rx="8" ry="4.5" transform="rotate(-18 266 56)" fill="#168C78" />
          {/* Wooden shelf */}
          <rect x="22" y="148" width="276" height="14" rx="5" fill="#9A7E60" />
          <rect x="22" y="158" width="276" height="4" rx="2" fill="#735B42" opacity="0.6" />
          {/* Cloth books with gold spine details & bookmark */}
          <rect x="40" y="64" width="26" height="84" rx="4" fill="#1C3A54" />
          <rect x="44" y="76" width="18" height="3" rx="1" fill="#F7C96B" />
          <rect x="44" y="132" width="18" height="3" rx="1" fill="#F7C96B" />

          <rect x="70" y="80" width="24" height="68" rx="4" fill="#168C78" />
          <rect x="74" y="92" width="16" height="4" rx="1" fill="#FBF7EF" opacity="0.7" />

          <rect x="98" y="56" width="30" height="92" rx="4" fill="#F26B3A" />
          <rect x="103" y="68" width="20" height="3" rx="1" fill="#FFF2D6" />
          <polygon points="118,56 124,56 124,74 121,69 118,74" fill="#16324A" />

          <rect x="132" y="74" width="26" height="74" rx="4" fill="#4A3A5C" />
          <circle cx="145" cy="108" r="5" fill="#F7C96B" opacity="0.85" />

          {/* Leaning book */}
          <g transform="rotate(-14 176 146)">
            <rect x="164" y="80" width="22" height="68" rx="4" fill="#D99B1E" />
            <rect x="168" y="92" width="14" height="3" rx="1" fill="#FFF7E2" />
          </g>

          {/* Mini brass globe ornament */}
          <circle cx="242" cy="108" r="22" fill="#CBECE4" stroke="#1C3A54" strokeWidth="2.5" />
          <path d="M226 102 Q242 94 258 104 Q244 118 228 112 Z" fill="#168C78" opacity="0.75" />
          <path d="M242 130 L242 144 M228 144 L256 144" stroke="#8E4A30" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      )
    case 'morning-coffee':
      return (
        <svg viewBox="0 0 320 200" role="img" aria-label={alt}>
          <defs>
            <linearGradient id={`mc-bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF6E5" />
              <stop offset="100%" stopColor="#F0DEC2" />
            </linearGradient>
          </defs>
          <rect width="320" height="200" fill={`url(#mc-bg-${uid})`} />
          {/* Sunlight window patches */}
          <polygon points="0,0 110,0 60,120 0,90" fill="#FFFFFF" opacity="0.4" />
          {/* Pocket journal on the left */}
          <g transform="rotate(-8 68 122)">
            <rect x="30" y="86" width="66" height="82" rx="7" fill="#168C78" />
            <rect x="38" y="96" width="44" height="6" rx="2" fill="#FBF7EF" opacity="0.8" />
            <rect x="38" y="108" width="32" height="4" rx="2" fill="#FBF7EF" opacity="0.5" />
            <rect x="86" y="86" width="6" height="82" fill="#F26B3A" />
          </g>
          {/* Saucer shadow & saucer */}
          <ellipse cx="170" cy="156" rx="68" ry="15" fill="#D4C2A6" />
          <ellipse cx="170" cy="151" rx="62" ry="12" fill="#FBF7EF" />
          {/* Artisan coffee cup */}
          <path d="M126 84 L214 84 L206 142 Q204 152 170 152 Q136 152 134 142 Z" fill="#1C3A54" />
          <ellipse cx="170" cy="84" rx="44" ry="10" fill="#B56C3D" />
          {/* Latte art heart */}
          <path d="M170 89 C162 84 162 79 167 79 C169 79 170 81 170 82 C170 81 171 79 173 79 C178 79 178 84 170 89 Z" fill="#FFF7EB" />
          {/* Cup handle */}
          <path d="M212 96 C234 96 234 130 208 130" stroke="#1C3A54" strokeWidth="9" fill="none" strokeLinecap="round" />
          {/* Rising aroma steam ribbons */}
          <path d="M150 66 Q142 52 152 40 T150 22" stroke="#F26B3A" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.72" />
          <path d="M172 64 Q180 50 170 36 T174 18" stroke="#168C78" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M192 68 Q186 56 194 46" stroke="#D99B1E" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.65" />
          {/* Croissant accent on right */}
          <ellipse cx="268" cy="150" rx="30" ry="11" fill="#E8A252" />
          <path d="M244 150 Q268 130 292 150 Q268 144 244 150 Z" fill="#D47746" />
        </svg>
      )
    case 'group-run':
    default:
      return (
        <svg viewBox="0 0 320 200" role="img" aria-label={alt}>
          <defs>
            <linearGradient id={`gr-sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BFECE3" />
              <stop offset="100%" stopColor="#EEF9F6" />
            </linearGradient>
            <linearGradient id={`gr-track-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#14594F" />
              <stop offset="100%" stopColor="#1C786A" />
            </linearGradient>
          </defs>
          <rect width="320" height="200" fill={`url(#gr-sky-${uid})`} />
          {/* Sun & clouds */}
          <circle cx="272" cy="40" r="18" fill="#F7C96B" opacity="0.9" />
          <path d="M30 46 Q46 34 64 42 Q78 34 92 46 L26 48 Z" fill="#FFFFFF" opacity="0.85" />
          {/* Park trees in background */}
          <circle cx="48" cy="118" r="24" fill="#6EC2B2" opacity="0.65" />
          <circle cx="82" cy="124" r="18" fill="#52AF9E" opacity="0.6" />
          <circle cx="268" cy="116" r="26" fill="#6EC2B2" opacity="0.65" />
          {/* Finish / Quest banner arch */}
          <path d="M104 66 Q160 48 216 66" fill="none" stroke="#F26B3A" strokeWidth="6" strokeLinecap="round" />
          <line x1="106" y1="66" x2="106" y2="138" stroke="#16324A" strokeWidth="3" />
          <line x1="214" y1="66" x2="214" y2="138" stroke="#16324A" strokeWidth="3" />
          {/* Park running track */}
          <path d="M0 138 Q160 124 320 138 L320 200 L0 200 Z" fill={`url(#gr-track-${uid})`} />
          <path d="M0 166 Q160 154 320 166" fill="none" stroke="#FBF7EF" strokeWidth="2" strokeDasharray="10 8" opacity="0.55" />
          {/* 3 lively runners with dynamic motion */}
          {/* Runner 1 (Orange) */}
          <circle cx="96" cy="96" r="16" fill="#F26B3A" />
          <path d="M84 92 Q96 86 108 92" fill="none" stroke="#FBF7EF" strokeWidth="3" strokeLinecap="round" />
          <rect x="81" y="114" width="30" height="32" rx="11" fill="#F26B3A" />
          <path d="M62 104 L74 104 M58 112 L72 112" stroke="#F26B3A" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
          {/* Runner 2 (Center Navy Leader) */}
          <circle cx="160" cy="88" r="19" fill="#1C3A54" />
          <path d="M146 83 Q160 76 174 83" fill="none" stroke="#F7C96B" strokeWidth="3.2" strokeLinecap="round" />
          <rect x="142" y="110" width="36" height="38" rx="12" fill="#1C3A54" />
          <rect x="150" y="120" width="20" height="12" rx="3" fill="#FBF7EF" opacity="0.9" />
          {/* Runner 3 (Gold) */}
          <circle cx="224" cy="96" r="16" fill="#D99B1E" />
          <path d="M212 92 Q224 86 236 92" fill="none" stroke="#FBF7EF" strokeWidth="3" strokeLinecap="round" />
          <rect x="209" y="114" width="30" height="32" rx="11" fill="#D99B1E" />
          {/* Celebration sparkles */}
          <circle cx="130" cy="68" r="2.5" fill="#F7C96B" />
          <circle cx="192" cy="64" r="2.5" fill="#F26B3A" />
        </svg>
      )
  }
}

export function MountedPhoto({
  illustrationKey,
  imageUrl,
  alt,
  visibility,
  corners = true,
  isDeletedSource = false,
  className = '',
  onRemoveDeleted,
}: {
  illustrationKey: SampleIllustrationKey
  imageUrl?: string | null
  alt: string
  visibility?: MediaVisibility
  corners?: boolean
  isDeletedSource?: boolean
  className?: string
  onRemoveDeleted?: () => void
}) {
  if (isDeletedSource) {
    return (
      <div className={`${styles.mountedPhoto} ${styles.deletedPhotoTile} ${className}`.trim()}>
        <ImageOff size={22} aria-hidden="true" />
        <strong>Ảnh gốc đã xóa</strong>
        <span>Tệp nguồn không còn khả dụng</span>
        {onRemoveDeleted && (
          <button
            type="button"
            onClick={onRemoveDeleted}
            style={{
              marginTop: 4,
              border: '1px solid rgba(22,50,74,0.2)',
              background: '#fff',
              borderRadius: 10,
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              color: '#16324A',
            }}
          >
            Gỡ khỏi trang
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`${styles.mountedPhoto} ${className}`.trim()}>
      {corners && (
        <>
          <span className={`${styles.photoCorner} ${styles.cornerTL}`} aria-hidden="true" />
          <span className={`${styles.photoCorner} ${styles.cornerTR}`} aria-hidden="true" />
          <span className={`${styles.photoCorner} ${styles.cornerBL}`} aria-hidden="true" />
          <span className={`${styles.photoCorner} ${styles.cornerBR}`} aria-hidden="true" />
        </>
      )}
      {visibility && (
        <div className={styles.photoPrivacySlot}>
          <PrivacyPill visibility={visibility} />
        </div>
      )}
      {imageUrl ? (
        <img src={imageUrl} alt={alt} />
      ) : (
        <JournalIllustration kind={illustrationKey} alt={alt} />
      )}
    </div>
  )
}
