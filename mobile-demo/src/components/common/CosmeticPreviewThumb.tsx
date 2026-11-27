import React from 'react'

export type CosmeticIconKind =
  | 'cap'
  | 'headband'
  | 'safari'
  | 'mage_hat'
  | 'ninja_band'
  | 'khan_dong'
  | 'glasses'
  | 'jacket'
  | 'jersey'
  | 'ninja_gi'
  | 'ao_dai'
  | 'backpack'
  | 'capelet'
  | 'scroll'
  | 'magnifier'
  | 'wand'
  | 'lixi'
  | 'sneakers'
  | 'default_scarf'
  | 'default_backpack'

export interface CosmeticPreviewThumbProps {
  kind: CosmeticIconKind
  palette: readonly [string, string, string]
  size?: number
}

export const CosmeticPreviewThumb: React.FC<CosmeticPreviewThumbProps> = ({
  kind,
  palette,
  size = 56
}) => {
  const [c1, c2, c3] = palette

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect x="2" y="2" width="60" height="60" rx="16" fill="#FAF6EE" stroke="#EFE6D8" />
      <ellipse cx="32" cy="52" rx="16" ry="3.5" fill="rgba(22, 50, 74, 0.08)" />

      {kind === 'cap' && (
        <g>
          <path d="M16 36 C16 22 44 22 44 36 Z" fill={c1} />
          <path d="M15 35 L49 35 C52 35 53 39 48 40 L17 39 Z" fill={c2} />
          <circle cx="30" cy="23" r="2.6" fill={c2} />
          <path d="M18 33 H43" stroke={c3} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}

      {kind === 'headband' && (
        <g>
          <rect x="13" y="26" width="38" height="12" rx="6" fill={c1} />
          <rect x="14" y="30.5" width="36" height="3" rx="1.5" fill={c2} />
          <circle cx="32" cy="32" r="3" fill={c3} />
        </g>
      )}

      {kind === 'safari' && (
        <g>
          <ellipse cx="32" cy="39" rx="22" ry="5.5" fill={c1} stroke={c3} strokeWidth="1.5" />
          <path d="M20 37 C20 22 44 22 44 37 Z" fill={c1} />
          <rect x="20" y="33" width="24" height="4" rx="1.5" fill={c2} />
          <circle cx="32" cy="35" r="2.2" fill="#F2C14E" />
        </g>
      )}

      {kind === 'mage_hat' && (
        <g>
          <ellipse cx="32" cy="43" rx="21" ry="5" fill={c1} />
          <path d="M18 42 L31 13 L45 42 Z" fill={c1} />
          <path d="M31 13 L39 18 L35 23" fill={c3} />
          <rect x="20" y="37" width="24" height="4" rx="2" fill={c2} />
          <polygon points="32,24 33.5,27.5 37,27.8 34.3,30 35.2,33.5 32,31.6 28.8,33.5 29.7,30 27,27.8 30.5,27.5" fill={c2} />
        </g>
      )}

      {kind === 'ninja_band' && (
        <g>
          <rect x="13" y="25" width="38" height="11" rx="5" fill={c1} />
          <rect x="22" y="26.8" width="20" height="7.4" rx="2.5" fill={c2} />
          <circle cx="25" cy="30.5" r="1.2" fill={c1} />
          <circle cx="39" cy="30.5" r="1.2" fill={c1} />
          <path d="M48 33 L54 43 L47 41 Z" fill={c1} />
          <path d="M44 35 L48 45 L42 42 Z" fill={c3} />
        </g>
      )}

      {kind === 'khan_dong' && (
        <g>
          <rect x="15" y="23" width="34" height="19" rx="9" fill={c1} />
          <path d="M16 32 Q32 27 48 32" stroke={c2} strokeWidth="2.5" fill="none" />
          <path d="M16 37 Q32 32 48 37" stroke={c2} strokeWidth="2" fill="none" />
          <circle cx="32" cy="27" r="3.2" fill={c2} />
        </g>
      )}

      {kind === 'glasses' && (
        <g>
          <circle cx="22" cy="33" r="8.5" fill={c2} fillOpacity="0.45" stroke={c1} strokeWidth="3" />
          <circle cx="42" cy="33" r="8.5" fill={c2} fillOpacity="0.45" stroke={c1} strokeWidth="3" />
          <path d="M30.5 33 H33.5" stroke={c1} strokeWidth="2.8" strokeLinecap="round" />
          <path d="M12 31 L14 32 M50 32 L52 31" stroke={c3} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}

      {kind === 'jacket' && (
        <g>
          <path d="M20 19 L12 28 L17 34 L21 30 V47 H43 V30 L47 34 L52 28 L44 19 L37 22 H27 Z" fill={c1} />
          <path d="M32 22 V47" stroke={c2} strokeWidth="2.4" />
          <path d="M26 20 L32 25 L38 20" stroke={c3} strokeWidth="2.2" fill="none" />
        </g>
      )}

      {kind === 'jersey' && (
        <g>
          <path d="M21 18 L15 26 L20 30 V47 H44 V30 L49 26 L43 18 L37 22 L32 27 L27 22 Z" fill={c1} />
          <path d="M27 22 L32 27 L37 22" stroke={c3} strokeWidth="2.4" fill="none" />
          <rect x="26" y="33" width="12" height="4" rx="2" fill={c2} />
        </g>
      )}

      {kind === 'ninja_gi' && (
        <g>
          <path d="M20 19 L12 29 L17 34 L21 30 V47 H43 V30 L47 34 L52 29 L44 19 L36 22 H28 Z" fill={c1} />
          <path d="M25 20 L36 36" stroke={c3} strokeWidth="2.6" />
          <rect x="20" y="35" width="24" height="5" rx="1.5" fill={c2} />
        </g>
      )}

      {kind === 'ao_dai' && (
        <g>
          <path d="M21 18 L13 28 L18 33 L22 29 V48 H42 V29 L46 33 L51 28 L43 18 L36 20 H28 Z" fill={c1} />
          <rect x="28" y="17" width="8" height="4" rx="1.5" fill={c2} />
          <circle cx="32" cy="31" r="3.5" fill={c2} />
          <circle cx="32" cy="31" r="1.4" fill={c1} />
          <path d="M22 45 H42" stroke={c2} strokeWidth="2" />
        </g>
      )}

      {(kind === 'backpack' || kind === 'default_backpack') && (
        <g>
          <path d="M23 18 C23 13 41 13 41 18" stroke={c2} strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="18" y="19" width="28" height="29" rx="9" fill={c1} />
          <path d="M18 28 Q32 33 46 28 V24 C46 21 43 19 40 19 H24 C21 19 18 21 18 24 Z" fill={c2} />
          <rect x="24" y="34" width="16" height="10" rx="4" fill={c3} />
          <rect x="30" y="28" width="4" height="6" rx="1.5" fill="#F2C14E" />
        </g>
      )}

      {kind === 'capelet' && (
        <g>
          <path d="M24 19 H40 L51 44 Q32 49 13 44 Z" fill={c1} />
          <path d="M15 42 Q32 47 49 42" stroke={c2} strokeWidth="2.6" fill="none" />
          <circle cx="32" cy="22" r="3.2" fill={c2} />
        </g>
      )}

      {kind === 'scroll' && (
        <g transform="rotate(-24 32 32)">
          <rect x="14" y="24" width="36" height="16" rx="4" fill={c1} stroke={c2} strokeWidth="2" />
          <rect x="11" y="22" width="5" height="20" rx="2.5" fill={c2} />
          <rect x="48" y="22" width="5" height="20" rx="2.5" fill={c2} />
          <rect x="29" y="24" width="6" height="16" fill={c3} />
        </g>
      )}

      {kind === 'magnifier' && (
        <g>
          <circle cx="28" cy="27" r="11" fill={c3} stroke={c2} strokeWidth="3.5" />
          <line x1="36.5" y1="35.5" x2="47" y2="46" stroke={c1} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M23 23 A6 6 0 0 1 30 20" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
      )}

      {kind === 'wand' && (
        <g>
          <line x1="17" y1="47" x2="38" y2="26" stroke={c1} strokeWidth="4" strokeLinecap="round" />
          <polygon
            points="41,14 43.3,20.2 50,20.6 44.8,24.6 46.5,31 41,27.4 35.5,31 37.2,24.6 32,20.6 38.7,20.2"
            fill={c2}
            stroke={c3}
            strokeWidth="1.2"
          />
        </g>
      )}

      {kind === 'lixi' && (
        <g>
          <rect x="20" y="16" width="24" height="33" rx="4" fill={c1} />
          <path d="M20 22 L32 30 L44 22" fill="none" stroke={c2} strokeWidth="2.2" />
          <circle cx="32" cy="31" r="5" fill={c2} />
          <circle cx="32" cy="31" r="2.2" fill={c1} />
        </g>
      )}

      {kind === 'sneakers' && (
        <g>
          <path d="M14 38 C14 31 21 27 28 27 L35 33 H48 C51 33 52 36 52 40 H14 Z" fill={c1} stroke={c2} strokeWidth="2" />
          <rect x="13" y="40" width="40" height="5" rx="2.5" fill={c2} />
          <path d="M24 33 L32 38" stroke={c3} strokeWidth="2.6" strokeLinecap="round" />
        </g>
      )}

      {kind === 'default_scarf' && (
        <g>
          <rect x="15" y="22" width="34" height="12" rx="6" fill={c1} />
          <path d="M34 32 H44 V47 L39 44 L34 47 Z" fill={c2} />
          <circle cx="24" cy="28" r="2.4" fill={c3} />
        </g>
      )}
    </svg>
  )
}
