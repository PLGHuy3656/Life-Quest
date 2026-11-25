import styles from './MascotHeroPanel.module.css'

/**
 * Cozy study-room backdrop inspired by the approved Claude mascot reference:
 * warm wall, cork pinboard with sticky notes, 4-pane sunlit window, cozy wooden
 * chair, and foreground wooden desk with books, steaming mug & plant.
 * Rendered behind the alpha-transparent Fox V2 WebGL canvas (pointer-events: none).
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
        <linearGradient id="lq-room-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDF6EA" />
          <stop offset="100%" stopColor="#F6E9D5" />
        </linearGradient>
        <radialGradient id="lq-room-spot" cx="50%" cy="48%" r="44%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.82" />
          <stop offset="70%" stopColor="#FFF8EC" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#FFF8EC" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lq-win-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E6F4F1" />
          <stop offset="100%" stopColor="#F6FAF6" />
        </linearGradient>
        <linearGradient id="lq-desk-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8CBA9" />
          <stop offset="100%" stopColor="#D7B28A" />
        </linearGradient>
        <linearGradient id="lq-desk-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CCA278" />
          <stop offset="100%" stopColor="#BA8E63" />
        </linearGradient>
      </defs>

      {/* Warm cozy study room wall + soft spotlight behind Fox */}
      <rect width="420" height="320" fill="url(#lq-room-wall)" />
      <circle cx="212" cy="158" r="142" fill="url(#lq-room-spot)" />

      {/* Left Wall: Cork Pinboard with 4 pastel sticky notes */}
      <g transform="translate(22, 26)">
        <rect width="104" height="94" rx="12" fill="#DFC39F" />
        <rect x="7" y="7" width="90" height="80" rx="7" fill="#EAD6BA" />

        {/* Sticky 1: Warm yellow + teal check */}
        <g transform="translate(14, 13) rotate(-2)">
          <rect width="34" height="31" rx="4" fill="#FFF3BD" />
          <circle cx="17" cy="4" r="2.6" fill="#F26B3A" />
          <path d="M9 15L13 19L21 11" stroke="#168C78" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="8" y="23" width="18" height="2.4" rx="1.2" fill="#C9B368" />
        </g>

        {/* Sticky 2: Soft mint + teal check */}
        <g transform="translate(55, 13) rotate(2)">
          <rect width="34" height="31" rx="4" fill="#DDF3EA" />
          <circle cx="17" cy="4" r="2.6" fill="#168C78" />
          <path d="M9 15L13 19L21 11" stroke="#168C78" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="8" y="23" width="16" height="2.4" rx="1.2" fill="#88BFA9" />
        </g>

        {/* Sticky 3: Soft peach/blush + lines */}
        <g transform="translate(14, 50) rotate(1.5)">
          <rect width="34" height="31" rx="4" fill="#FCE1D8" />
          <circle cx="17" cy="4" r="2.6" fill="#16324A" />
          <rect x="7" y="12" width="16" height="2.4" rx="1.2" fill="#E39B84" />
          <rect x="7" y="18" width="20" height="2.4" rx="1.2" fill="#E39B84" />
          <rect x="7" y="24" width="14" height="2.4" rx="1.2" fill="#E39B84" />
        </g>

        {/* Sticky 4: Soft sky blue + checkbox */}
        <g transform="translate(55, 50) rotate(-1.5)">
          <rect width="34" height="31" rx="4" fill="#E1EEFA" />
          <circle cx="17" cy="4" r="2.6" fill="#F26B3A" />
          <rect x="7" y="12" width="7" height="7" rx="1.5" stroke="#16324A" strokeWidth="1.6" fill="none" />
          <rect x="17" y="14.5" width="11" height="2.2" rx="1.1" fill="#8DB0D1" />
          <rect x="7" y="23" width="19" height="2.2" rx="1.1" fill="#8DB0D1" />
        </g>
      </g>

      {/* Right Wall: 4-Pane Sunlit Window with hills & sun */}
      <g transform="translate(292, 22)">
        <rect width="108" height="126" rx="10" fill="#FFFFFF" />
        <rect x="7" y="7" width="94" height="112" rx="5" fill="url(#lq-win-sky)" />
        {/* Morning sun */}
        <circle cx="72" cy="34" r="14" fill="#F6C85F" opacity="0.34" />
        <circle cx="72" cy="34" r="9" fill="#F6C85F" opacity="0.9" />
        {/* Soft hills outside */}
        <path d="M7 96C26 78 46 84 66 72C80 64 92 70 101 78V119H7V96Z" fill="#B5DBCB" />
        <path d="M7 106C32 92 58 98 101 86V119H7V106Z" fill="#7DBBA3" />
        {/* White window mullions */}
        <rect x="51" y="7" width="6" height="112" fill="#FFFFFF" />
        <rect x="7" y="61" width="94" height="6" fill="#FFFFFF" />
        {/* Subtle window sill */}
        <rect x="-4" y="124" width="116" height="7" rx="3.5" fill="#EDE2D0" />
      </g>

      {/* Cozy Wooden Study Chair (ghế) peeking behind desk on left-center */}
      <g transform="translate(114, 152)">
        {/* Chair backrest wood frame */}
        <rect x="10" y="0" width="94" height="66" rx="18" fill="#C99768" />
        <rect x="17" y="7" width="80" height="52" rx="13" fill="#E3C7A6" />
        {/* Soft quilted sage-oatmeal chair cushion */}
        <rect x="21" y="11" width="72" height="44" rx="10" fill="#DFECE5" />
        <circle cx="44" cy="32" r="2.2" fill="#9BBCAE" />
        <circle cx="70" cy="32" r="2.2" fill="#9BBCAE" />
        {/* Chair armrests */}
        <rect x="2" y="54" width="16" height="44" rx="7" fill="#BA895C" />
        <rect x="96" y="54" width="16" height="44" rx="7" fill="#BA895C" />
        {/* Chair seat base */}
        <rect x="12" y="74" width="90" height="22" rx="9" fill="#D5B18C" />
      </g>

      {/* Subtle botanical leaf accent top-center-left */}
      <g opacity="0.65">
        <path d="M276 0C270 18 262 32 250 42" stroke="#6FA88E" strokeWidth="2" strokeLinecap="round" fill="none" />
        <ellipse cx="268" cy="18" rx="10" ry="4.5" transform="rotate(-24 268 18)" fill="#9EC7B3" />
        <ellipse cx="256" cy="31" rx="9" ry="4" transform="rotate(18 256 31)" fill="#7EB49A" />
      </g>

      {/* Foreground Cozy Wooden Study Desk (bàn) */}
      <rect x="0" y="252" width="420" height="46" fill="url(#lq-desk-top)" />
      <rect x="0" y="252" width="420" height="3.5" fill="#F4DFC4" opacity="0.85" />
      <rect x="0" y="294" width="420" height="26" fill="url(#lq-desk-front)" />

      {/* Left Desk Props: Stack of colorful books */}
      <g transform="translate(26, 212)">
        <rect x="0" y="28" width="56" height="13" rx="3.5" fill="#168C78" />
        <rect x="6" y="31" width="44" height="3" rx="1.5" fill="#6CC5B5" opacity="0.65" />
        <rect x="4" y="15" width="48" height="13" rx="3.5" fill="#F6C85F" />
        <rect x="10" y="18" width="34" height="3" rx="1.5" fill="#FFF1C2" opacity="0.7" />
        <rect x="8" y="3" width="40" height="12" rx="3.5" fill="#F26B3A" />
        <rect x="14" y="6" width="24" height="2.8" rx="1.4" fill="#FFC5AE" opacity="0.7" />
      </g>

      {/* Right Desk Props: Cozy white steaming mug + tiny potted plant */}
      <g transform="translate(324, 218)">
        <ellipse cx="15" cy="36" rx="15" ry="3.5" fill="#A9805A" opacity="0.25" />
        <rect x="2" y="13" width="24" height="22" rx="6" fill="#FFFFFF" stroke="#E4D6C4" strokeWidth="1.4" />
        <path d="M26 17H30C32.8 17 35 19.2 35 22C35 24.8 32.8 27 30 27H26" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M10 8C10 5 13 5 13 2" stroke="#C5A98C" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
        <path d="M18 8C18 5 21 5 21 2" stroke="#C5A98C" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
      </g>

      <g transform="translate(370, 210)">
        <ellipse cx="14" cy="43" rx="12" ry="3" fill="#A9805A" opacity="0.24" />
        <path d="M5 26H23L20 42H8L5 26Z" fill="#D98B5F" />
        <ellipse cx="14" cy="18" rx="5" ry="9" fill="#168C78" />
        <ellipse cx="8" cy="21" rx="4.2" ry="7" transform="rotate(-24 8 21)" fill="#49B09A" />
        <ellipse cx="20" cy="21" rx="4.2" ry="7" transform="rotate(24 20 21)" fill="#49B09A" />
      </g>

      {/* Soft grounding shadow under Fox V2 on the desk surface */}
      <ellipse cx="212" cy="273" rx="72" ry="13" fill="#9A7249" opacity="0.22" />
      <ellipse cx="212" cy="273" rx="44" ry="7.5" fill="#845F39" opacity="0.16" />
    </svg>
  )
}
