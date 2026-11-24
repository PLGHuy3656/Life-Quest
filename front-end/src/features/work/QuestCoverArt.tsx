export type QuestArtTheme = 'summit' | 'sunrise' | 'campfire' | 'trail'

// eslint-disable-next-line react-refresh/only-export-components
export function pickQuestArtTheme(id: string, title: string, isCollaborative: boolean): QuestArtTheme {
  const lower = title.toLowerCase()
  if (lower.includes('sức khỏe') || lower.includes('thể lực') || lower.includes('chạy bộ')) {
    return isCollaborative ? 'trail' : 'sunrise'
  }
  if (isCollaborative) return 'campfire'
  if (id.endsWith('2')) return 'sunrise'
  return 'summit'
}

/**
 * Crisp, warm LifeQuest-styled vector cover art for Quest Journey cards.
 * Zero external network dependencies; scales cleanly at 1024px–1920px.
 */
export function QuestCoverArt({ theme }: { theme: QuestArtTheme }) {
  if (theme === 'sunrise') {
    return (
      <svg
        viewBox="0 0 720 180"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id="lq-sun-sky" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fde6c4" />
            <stop offset="52%" stopColor="#f8c88d" />
            <stop offset="100%" stopColor="#e8f3ec" />
          </linearGradient>
        </defs>
        <rect width="720" height="180" fill="url(#lq-sun-sky)" />
        {/* Warm morning sun */}
        <circle cx="560" cy="68" r="36" fill="#fff5dc" opacity="0.92" />
        <circle cx="560" cy="68" r="54" fill="#f6c85f" opacity="0.24" />
        {/* Soft clouds */}
        <ellipse cx="150" cy="48" rx="46" ry="12" fill="#ffffff" opacity="0.55" />
        <ellipse cx="410" cy="36" rx="34" ry="9" fill="#ffffff" opacity="0.45" />
        {/* Distant hills */}
        <path d="M0 132 Q140 78 300 118 T620 102 L720 120 L720 180 L0 180 Z" fill="#89c4ab" opacity="0.65" />
        <path d="M0 148 Q190 98 370 138 T720 124 L720 180 L0 180 Z" fill="#168c78" opacity="0.82" />
        {/* Winding morning jogging path */}
        <path
          d="M110 180 C180 152, 260 154, 340 138 C420 122, 500 136, 595 112"
          fill="none"
          stroke="#fff6e6"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="1 0"
          opacity="0.72"
        />
        {/* Cozy pine silhouettes */}
        <polygon points="82,138 96,102 110,138" fill="#116658" opacity="0.85" />
        <polygon points="104,142 115,114 126,142" fill="#168c78" opacity="0.9" />
        <polygon points="622,126 636,92 650,126" fill="#116658" opacity="0.8" />
      </svg>
    )
  }

  if (theme === 'campfire') {
    return (
      <svg
        viewBox="0 0 720 180"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id="lq-camp-sky" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#16324a" />
            <stop offset="60%" stopColor="#264b6b" />
            <stop offset="100%" stopColor="#3c5e78" />
          </linearGradient>
        </defs>
        <rect width="720" height="180" fill="url(#lq-camp-sky)" />
        {/* Stars */}
        <circle cx="96" cy="36" r="2" fill="#f6c85f" opacity="0.9" />
        <circle cx="184" cy="24" r="1.6" fill="#ffffff" opacity="0.75" />
        <circle cx="290" cy="44" r="2.2" fill="#f6c85f" opacity="0.85" />
        <circle cx="468" cy="28" r="1.8" fill="#ffffff" opacity="0.7" />
        <circle cx="612" cy="40" r="2.4" fill="#f6c85f" opacity="0.9" />
        {/* Crescent moon */}
        <circle cx="584" cy="54" r="22" fill="#fff3d1" opacity="0.92" />
        <circle cx="594" cy="48" r="19" fill="#2b506e" />
        {/* Mountain ridge */}
        <path d="M0 138 L120 74 L235 128 L380 62 L525 126 L645 84 L720 120 L720 180 L0 180 Z" fill="#1b3c56" />
        <path d="M0 150 Q210 112 410 144 T720 132 L720 180 L0 180 Z" fill="#12273a" />
        {/* Warm team lantern glow & path */}
        <circle cx="380" cy="144" r="40" fill="#f26b3a" opacity="0.25" />
        <circle cx="380" cy="144" r="16" fill="#f6c85f" opacity="0.55" />
        <path d="M372 150 Q380 128 388 150 Z" fill="#f26b3a" />
        <path
          d="M90 168 Q230 140 380 146 T650 142"
          fill="none"
          stroke="#f6c85f"
          strokeWidth="3"
          strokeDasharray="6 8"
          opacity="0.65"
        />
      </svg>
    )
  }

  if (theme === 'trail') {
    return (
      <svg
        viewBox="0 0 720 180"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id="lq-trail-sky" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd7ba" />
            <stop offset="50%" stopColor="#f8b28c" />
            <stop offset="100%" stopColor="#fae8c8" />
          </linearGradient>
        </defs>
        <rect width="720" height="180" fill="url(#lq-trail-sky)" />
        <circle cx="150" cy="66" r="32" fill="#fff7e6" opacity="0.9" />
        <path d="M0 128 Q180 86 360 122 T720 96 L720 180 L0 180 Z" fill="#e58c64" opacity="0.45" />
        <path d="M0 146 Q240 106 460 138 T720 120 L720 180 L0 180 Z" fill="#16324a" opacity="0.86" />
        {/* Milestone flags along trail */}
        <line x1="250" y1="130" x2="250" y2="100" stroke="#fff5e6" strokeWidth="2.5" />
        <polygon points="250,100 272,107 250,114" fill="#f26b3a" />
        <line x1="510" y1="134" x2="510" y2="104" stroke="#fff5e6" strokeWidth="2.5" />
        <polygon points="510,104 532,111 510,118" fill="#f6c85f" />
      </svg>
    )
  }

  // Default: 'summit' (Warm LifeQuest Adventure Peaks)
  return (
    <svg
      viewBox="0 0 720 180"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <linearGradient id="lq-summit-sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e3f5b" />
          <stop offset="55%" stopColor="#2e5e78" />
          <stop offset="100%" stopColor="#f29b6b" />
        </linearGradient>
      </defs>
      <rect width="720" height="180" fill="url(#lq-summit-sky)" />
      {/* Sunset horizon glow */}
      <circle cx="575" cy="96" r="44" fill="#f6c85f" opacity="0.34" />
      <circle cx="575" cy="96" r="24" fill="#fff2cf" opacity="0.92" />
      {/* Peaks */}
      <path d="M0 142 L130 68 L250 126 L410 46 L555 128 L665 82 L720 116 L720 180 L0 180 Z" fill="#16324a" opacity="0.72" />
      <path d="M0 156 Q200 108 395 142 T720 124 L720 180 L0 180 Z" fill="#16324a" />
      {/* Summit flag */}
      <line x1="410" y1="46" x2="410" y2="20" stroke="#fff5e6" strokeWidth="2.5" />
      <polygon points="410,20 434,28 410,36" fill="#f26b3a" />
      {/* Glowing journey curve */}
      <path
        d="M70 166 C185 138, 285 144, 410 112 C495 92, 565 112, 650 102"
        fill="none"
        stroke="#f6c85f"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.75"
      />
      <circle cx="240" cy="141" r="5" fill="#168c78" stroke="#ffffff" strokeWidth="2" />
      <circle cx="410" cy="112" r="6" fill="#f26b3a" stroke="#ffffff" strokeWidth="2" />
    </svg>
  )
}
