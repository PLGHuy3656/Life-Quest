import styles from './MascotHeroPanel.module.css'

/**
 * Pure decorative botanical & cozy interior backdrop rendered behind the
 * alpha-transparent Fox V2 WebGL canvas. Pointer-events disabled so Fox
 * interactions (head pat, tail tap, look-at) remain completely unobstructed.
 */
export function MascotSceneBackdrop() {
  return (
    <svg
      className={styles.sceneBackdrop}
      viewBox="0 0 420 320"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="lq-scene-glow" cx="50%" cy="36%" r="58%">
          <stop offset="0%" stopColor="#FFFBF0" stopOpacity="0.96" />
          <stop offset="56%" stopColor="#FBF2E1" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#F3E5CE" stopOpacity="0.96" />
        </radialGradient>
        <linearGradient id="lq-arch-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#FFF6E5" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id="lq-floor-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EFE0C6" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#E6D2B1" stopOpacity="0.92" />
        </linearGradient>
      </defs>

      {/* Warm cream-amber atmosphere */}
      <rect width="420" height="320" fill="url(#lq-scene-glow)" />

      {/* Soft arched sunlit alcove behind Fox */}
      <path
        d="M96 254V122C96 59 147 16 210 16C273 16 324 59 324 122V254H96Z"
        fill="url(#lq-arch-fill)"
      />

      {/* Warm sunlight orb hint */}
      <circle cx="294" cy="64" r="28" fill="#F6C85F" opacity="0.22" />
      <circle cx="294" cy="64" r="15" fill="#F6C85F" opacity="0.34" />

      {/* Top-left hanging botanical vine & eucalyptus leaves */}
      <g opacity="0.85">
        <path
          d="M-6 12C28 24 54 48 68 88C74 106 72 126 62 146"
          stroke="#6FA88E"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="26" cy="28" rx="16" ry="7" transform="rotate(-24 26 28)" fill="#9EC7B3" />
        <ellipse cx="48" cy="44" rx="15" ry="6.5" transform="rotate(24 48 44)" fill="#7EB49A" />
        <ellipse cx="44" cy="70" rx="14" ry="6" transform="rotate(-32 44 70)" fill="#B4D6C5" />
        <ellipse cx="68" cy="86" rx="13" ry="5.5" transform="rotate(18 68 86)" fill="#6FA88E" />
        <ellipse cx="56" cy="112" rx="12" ry="5" transform="rotate(-22 56 112)" fill="#9EC7B3" />
        <circle cx="38" cy="54" r="3" fill="#F26B3A" opacity="0.55" />
        <circle cx="62" cy="100" r="2.5" fill="#F26B3A" opacity="0.48" />
      </g>

      {/* Top-right soft branch & warm sage leaves */}
      <g opacity="0.82">
        <path
          d="M426 18C392 30 366 54 352 92C345 110 348 128 358 144"
          stroke="#6FA88E"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="394" cy="34" rx="16" ry="7" transform="rotate(22 394 34)" fill="#9EC7B3" />
        <ellipse cx="372" cy="52" rx="15" ry="6.5" transform="rotate(-22 372 52)" fill="#7EB49A" />
        <ellipse cx="376" cy="78" rx="14" ry="6" transform="rotate(28 376 78)" fill="#B4D6C5" />
        <ellipse cx="352" cy="96" rx="13" ry="5.5" transform="rotate(-16 352 96)" fill="#6FA88E" />
        <ellipse cx="362" cy="120" rx="11" ry="4.8" transform="rotate(20 362 120)" fill="#A9CFC0" />
        <circle cx="382" cy="64" r="2.8" fill="#F6C85F" opacity="0.8" />
      </g>

      {/* Cozy interior horizon shelf / floor band */}
      <path d="M0 248Q210 236 420 248V320H0V248Z" fill="url(#lq-floor-fill)" />
      <path
        d="M0 248Q210 236 420 248"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        opacity="0.65"
        fill="none"
      />

      {/* Soft grounding shadow directly under Fox V2 */}
      <ellipse cx="210" cy="272" rx="76" ry="14" fill="#9A7852" opacity="0.2" />
      <ellipse cx="210" cy="272" rx="46" ry="8" fill="#8A6842" opacity="0.16" />

      {/* Subtle warm sparkles */}
      <path
        d="M118 74L120 79.5L125.5 81.5L120 83.5L118 89L116 83.5L110.5 81.5L116 79.5L118 74Z"
        fill="#F6C85F"
        opacity="0.72"
      />
      <circle cx="316" cy="144" r="3" fill="#F26B3A" opacity="0.34" />
      <circle cx="96" cy="186" r="2.5" fill="#168C78" opacity="0.3" />
    </svg>
  )
}
