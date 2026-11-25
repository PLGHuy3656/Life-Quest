import type { OutfitId } from '@/mascot/cosmetics/cosmeticContract'

interface HangingOutfitSvgProps {
  outfitId: OutfitId
  className?: string
}

/**
 * Dimensional, fabric-shaded hanging garment illustrations draped on a beveled wooden
 * coat hanger with a metallic hook wrapping around the horizontal closet rod.
 */
export function HangingOutfitSvg({ outfitId, className }: HangingOutfitSvgProps) {
  const uid = `hg-${outfitId}`
  return (
    <svg className={className} viewBox="0 0 96 112" fill="none" aria-hidden="true">
      <defs>
        {/* Soft vertical 3D fabric volume highlight/shadow overlay */}
        <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.18" />
          <stop offset="28%" stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.04" />
          <stop offset="82%" stopColor="#000000" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
        </linearGradient>
        {/* Subtle bottom gravity drape shadow */}
        <linearGradient id={`${uid}-drop`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.14" />
          <stop offset="65%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
        </linearGradient>
        {/* Wooden hanger gradient */}
        <linearGradient id={`${uid}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EBC799" />
          <stop offset="55%" stopColor="#CFA068" />
          <stop offset="100%" stopColor="#A6743E" />
        </linearGradient>
        {/* Metallic hook gradient */}
        <linearGradient id={`${uid}-hook`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E6C58D" />
          <stop offset="50%" stopColor="#B8894A" />
          <stop offset="100%" stopColor="#7C5623" />
        </linearGradient>
      </defs>

      {/* Curved metallic hook gripping the closet rod */}
      <path
        d="M48 18V11C48 7 50.8 4.2 54.4 4.2C57.5 4.2 59.8 6.4 59.8 9.1C59.8 11.4 58.2 13.1 56 13.6"
        stroke={`url(#${uid}-hook)`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Beveled wooden coat hanger */}
      <path
        d="M48 17.5L15 31.5C12.8 32.4 13.5 35.5 15.8 35.5H80.2C82.5 35.5 83.2 32.4 81 31.5L48 17.5Z"
        fill={`url(#${uid}-wood)`}
        stroke="#8B5E30"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Inner collar recess behind neckline */}
      <path d="M35 28.5C40 32.5 56 32.5 61 28.5L59 35H37L35 28.5Z" fill="#2A1D14" opacity="0.45" />

      {outfitId === 'outfit_student' && (
        <g>
          {/* Draped teal jacket body & natural downward sleeves */}
          <path
            d="M34 28L18 35L10 61C9.5 62.8 10.8 64.5 12.6 64.8L22 66.2L26 48L25 96C25 98.8 27.2 101 30 101H66C68.8 101 71 98.8 71 96L70 48L74 66.2L83.4 64.8C85.2 64.5 86.5 62.8 86 61L78 35L62 28C57 32.5 39 32.5 34 28Z"
            fill="#1E7F8C"
          />
          {/* Inner soft cream tee peeking cleanly through open front */}
          <path d="M40 31.5H56L54.5 100H41.5L40 31.5Z" fill="#FAF2E4" />
          {/* Tailored navy lapels */}
          <path d="M36 29L42 100H36.5L32.5 38L36 29Z" fill="#183452" />
          <path d="M60 29L54 100H59.5L63.5 38L60 29Z" fill="#183452" />
          {/* Sleeve cuffs */}
          <path d="M11.5 57.5L22.5 60" stroke="#183452" strokeWidth="5" strokeLinecap="round" />
          <path d="M84.5 57.5L73.5 60" stroke="#183452" strokeWidth="5" strokeLinecap="round" />
          {/* Soft fabric drape folds */}
          <path d="M31 54V94M65 54V94" stroke="#0F464E" strokeWidth="1.2" opacity="0.32" strokeLinecap="round" />
          {/* Fox orange crest pin */}
          <circle cx="61.5" cy="49" r="3.4" fill="#F26B3A" stroke="#FFF4E8" strokeWidth="1" />
          {/* 3D cloth lighting overlay */}
          <path
            d="M34 28L18 35L10 61C9.5 62.8 10.8 64.5 12.6 64.8L22 66.2L26 48L25 96C25 98.8 27.2 101 30 101H66C68.8 101 71 98.8 71 96L70 48L74 66.2L83.4 64.8C85.2 64.5 86.5 62.8 86 61L78 35L62 28C57 32.5 39 32.5 34 28Z"
            fill={`url(#${uid}-shade)`}
          />
          <path
            d="M34 28L18 35L10 61C9.5 62.8 10.8 64.5 12.6 64.8L22 66.2L26 48L25 96C25 98.8 27.2 101 30 101H66C68.8 101 71 98.8 71 96L70 48L74 66.2L83.4 64.8C85.2 64.5 86.5 62.8 86 61L78 35L62 28C57 32.5 39 32.5 34 28Z"
            fill={`url(#${uid}-drop)`}
            stroke="#134D55"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
      )}

      {outfitId === 'outfit_sports' && (
        <g>
          {/* Draped sleeveless athletic jersey */}
          <path
            d="M34 28L23 34L27.5 52L26 96C26 98.8 28.2 101 31 101H65C67.8 101 70 98.8 70 96L68.5 52L73 34L62 28C57.5 36.5 38.5 36.5 34 28Z"
            fill="#1F6FD1"
          />
          {/* White & gold woven chest band */}
          <rect x="26.8" y="54" width="42.4" height="12" fill="#F8FAFC" />
          <rect x="26.8" y="49.5" width="42.4" height="4.5" fill="#F2C14E" />
          {/* Ribbed V-neck & armhole trim */}
          <path d="M35 28.5L48 40L61 28.5" stroke="#F8FAFC" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M23.5 35L27.5 52M72.5 35L68.5 52" stroke="#F8FAFC" strokeWidth="2.4" strokeLinecap="round" />
          {/* Jersey number */}
          <text x="48" y="87" textAnchor="middle" fill="#F8FAFC" fontSize="16" fontWeight="900">
            07
          </text>
          {/* Subtle vertical cloth drape lines */}
          <path d="M34 68V96M62 68V96" stroke="#113D78" strokeWidth="1.2" opacity="0.28" strokeLinecap="round" />
          {/* 3D cloth shading */}
          <path
            d="M34 28L23 34L27.5 52L26 96C26 98.8 28.2 101 31 101H65C67.8 101 70 98.8 70 96L68.5 52L73 34L62 28C57.5 36.5 38.5 36.5 34 28Z"
            fill={`url(#${uid}-shade)`}
          />
          <path
            d="M34 28L23 34L27.5 52L26 96C26 98.8 28.2 101 31 101H65C67.8 101 70 98.8 70 96L68.5 52L73 34L62 28C57.5 36.5 38.5 36.5 34 28Z"
            fill={`url(#${uid}-drop)`}
            stroke="#13458A"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
      )}

      {outfitId === 'outfit_explorer' && (
        <g>
          {/* Khaki canvas explorer jacket/vest */}
          <path
            d="M34 28L19 35L13 56C12.5 57.8 13.8 59.5 15.6 59.8L24 61L27 48L26 96C26 98.8 28.2 101 31 101H65C67.8 101 70 98.8 70 96L69 48L72 61L80.4 59.8C82.2 59.5 83.5 57.8 83 56L77 35L62 28C57 33 39 33 34 28Z"
            fill="#D8C08A"
          />
          {/* Olive explorer straps */}
          <rect x="31" y="30" width="6.5" height="69" rx="3" fill="#5E7A3A" />
          <rect x="58.5" y="30" width="6.5" height="69" rx="3" fill="#5E7A3A" />
          {/* Stitched cargo pockets with flaps */}
          <rect x="29.5" y="68" width="14" height="14" rx="2.5" fill="#C4A66A" stroke="#856530" strokeWidth="1.2" />
          <path d="M29.5 72H43.5" stroke="#856530" strokeWidth="1.2" />
          <rect x="52.5" y="68" width="14" height="14" rx="2.5" fill="#C4A66A" stroke="#856530" strokeWidth="1.2" />
          <path d="M52.5 72H66.5" stroke="#856530" strokeWidth="1.2" />
          {/* Brass compass badge */}
          <circle cx="48" cy="49" r="5.2" fill="#F2C14E" stroke="#8B5E34" strokeWidth="1.4" />
          <circle cx="48" cy="49" r="1.8" fill="#8B5E34" />
          {/* 3D cloth shading */}
          <path
            d="M34 28L19 35L13 56C12.5 57.8 13.8 59.5 15.6 59.8L24 61L27 48L26 96C26 98.8 28.2 101 31 101H65C67.8 101 70 98.8 70 96L69 48L72 61L80.4 59.8C82.2 59.5 83.5 57.8 83 56L77 35L62 28C57 33 39 33 34 28Z"
            fill={`url(#${uid}-shade)`}
          />
          <path
            d="M34 28L19 35L13 56C12.5 57.8 13.8 59.5 15.6 59.8L24 61L27 48L26 96C26 98.8 28.2 101 31 101H65C67.8 101 70 98.8 70 96L69 48L72 61L80.4 59.8C82.2 59.5 83.5 57.8 83 56L77 35L62 28C57 33 39 33 34 28Z"
            fill={`url(#${uid}-drop)`}
            stroke="#856530"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
      )}

      {outfitId === 'outfit_mage' && (
        <g>
          {/* Flowing royal-purple wizard cloak & capelet */}
          <path
            d="M36 28L12 78C11 80.5 12.8 83 15.5 83H26L22 98.5C21.7 100.2 23 101.5 24.7 101.5H71.3C73 101.5 74.3 100.2 74 98.5L70 83H80.5C83.2 83 85 80.5 84 78L60 28C54.5 32.5 41.5 32.5 36 28Z"
            fill="#5B3A9C"
          />
          {/* Soft fabric cape folds */}
          <path d="M35 42L24 80M61 42L72 80M48 44V98" stroke="#311761" strokeWidth="1.4" opacity="0.34" strokeLinecap="round" />
          {/* Golden embroidered hem trims */}
          <path d="M14.5 78.5H81.5" stroke="#F2C14E" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M24.5 96.5H71.5" stroke="#F2C14E" strokeWidth="3" strokeLinecap="round" />
          {/* Golden cloak clasp & mystic star */}
          <circle cx="48" cy="37.5" r="4.5" fill="#F2C14E" stroke="#341B63" strokeWidth="1.3" />
          <path
            d="M48 50L50.6 56.2L57.2 56.7L52.1 61L53.7 67.5L48 63.9L42.3 67.5L43.9 61L38.8 56.7L45.4 56.2L48 50Z"
            fill="#F2C14E"
          />
          {/* 3D cloth shading */}
          <path
            d="M36 28L12 78C11 80.5 12.8 83 15.5 83H26L22 98.5C21.7 100.2 23 101.5 24.7 101.5H71.3C73 101.5 74.3 100.2 74 98.5L70 83H80.5C83.2 83 85 80.5 84 78L60 28C54.5 32.5 41.5 32.5 36 28Z"
            fill={`url(#${uid}-shade)`}
          />
          <path
            d="M36 28L12 78C11 80.5 12.8 83 15.5 83H26L22 98.5C21.7 100.2 23 101.5 24.7 101.5H71.3C73 101.5 74.3 100.2 74 98.5L70 83H80.5C83.2 83 85 80.5 84 78L60 28C54.5 32.5 41.5 32.5 36 28Z"
            fill={`url(#${uid}-drop)`}
            stroke="#341B63"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
      )}

      {outfitId === 'outfit_ninja' && (
        <g>
          {/* Draped charcoal ninja gi */}
          <path
            d="M34 28L18 35L10 61C9.5 62.8 10.8 64.5 12.6 64.8L22 66.2L26 48L25 96C25 98.8 27.2 101 30 101H66C68.8 101 71 98.8 71 96L70 48L74 66.2L83.4 64.8C85.2 64.5 86.5 62.8 86 61L78 35L62 28C57 33 39 33 34 28Z"
            fill="#283040"
          />
          {/* Crossed kimono collar lapels */}
          <path d="M36 29L54 64" stroke="#121722" strokeWidth="3" strokeLinecap="round" />
          <path d="M60 29L44 58" stroke="#121722" strokeWidth="3" strokeLinecap="round" />
          {/* Crimson Obi sash with draped knot tails */}
          <rect x="25.5" y="65" width="45" height="11.5" fill="#E0533A" />
          <path d="M45 76.5L40 95M51 76.5L56 95" stroke="#E0533A" strokeWidth="4.2" strokeLinecap="round" />
          <rect x="42" y="67.5" width="12" height="6.5" rx="2" fill="#94A3B8" stroke="#1F2533" strokeWidth="1" />
          {/* 3D cloth shading */}
          <path
            d="M34 28L18 35L10 61C9.5 62.8 10.8 64.5 12.6 64.8L22 66.2L26 48L25 96C25 98.8 27.2 101 30 101H66C68.8 101 71 98.8 71 96L70 48L74 66.2L83.4 64.8C85.2 64.5 86.5 62.8 86 61L78 35L62 28C57 33 39 33 34 28Z"
            fill={`url(#${uid}-shade)`}
          />
          <path
            d="M34 28L18 35L10 61C9.5 62.8 10.8 64.5 12.6 64.8L22 66.2L26 48L25 96C25 98.8 27.2 101 30 101H66C68.8 101 71 98.8 71 96L70 48L74 66.2L83.4 64.8C85.2 64.5 86.5 62.8 86 61L78 35L62 28C57 33 39 33 34 28Z"
            fill={`url(#${uid}-drop)`}
            stroke="#131722"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
      )}

      {outfitId === 'outfit_tet' && (
        <g>
          {/* Draped crimson silk Tet Ao Dai */}
          <path
            d="M34 28L18 35L10 62C9.5 63.8 10.8 65.5 12.6 65.8L22 67L26 49L25 98C25 100.2 26.8 102 29 102H67C69.2 102 71 100.2 71 98L70 49L74 67L83.4 65.8C85.2 65.5 86.5 63.8 86 62L78 35L62 28C57 32.5 39 32.5 34 28Z"
            fill="#C41422"
          />
          {/* Silk drape sheen lines */}
          <path d="M33 56V96M63 56V96" stroke="#7A0911" strokeWidth="1.2" opacity="0.32" strokeLinecap="round" />
          {/* Golden mandarin collar, cuffs & hem */}
          <path d="M36 28.5C40 33.5 56 33.5 60 28.5" stroke="#ECC052" strokeWidth="3.6" strokeLinecap="round" />
          <path d="M11.5 58.5L22.5 61" stroke="#ECC052" strokeWidth="4.2" strokeLinecap="round" />
          <path d="M84.5 58.5L73.5 61" stroke="#ECC052" strokeWidth="4.2" strokeLinecap="round" />
          <path d="M26.5 97.5H69.5" stroke="#ECC052" strokeWidth="3.4" strokeLinecap="round" />
          {/* Golden circular Tet medallion */}
          <circle cx="48" cy="60" r="10.5" stroke="#FFE599" strokeWidth="3" fill="rgba(236, 192, 82, 0.2)" />
          <circle cx="48" cy="60" r="3.8" fill="#FFE599" />
          {/* 3D cloth shading */}
          <path
            d="M34 28L18 35L10 62C9.5 63.8 10.8 65.5 12.6 65.8L22 67L26 49L25 98C25 100.2 26.8 102 29 102H67C69.2 102 71 100.2 71 98L70 49L74 67L83.4 65.8C85.2 65.5 86.5 63.8 86 62L78 35L62 28C57 32.5 39 32.5 34 28Z"
            fill={`url(#${uid}-shade)`}
          />
          <path
            d="M34 28L18 35L10 62C9.5 63.8 10.8 65.5 12.6 65.8L22 67L26 49L25 98C25 100.2 26.8 102 29 102H67C69.2 102 71 100.2 71 98L70 49L74 67L83.4 65.8C85.2 65.5 86.5 63.8 86 62L78 35L62 28C57 32.5 39 32.5 34 28Z"
            fill={`url(#${uid}-drop)`}
            stroke="#7F0B14"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  )
}

export function MiniHangerHook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 16" fill="none" aria-hidden="true">
      <path
        d="M20 6V4C20 2.3 21.3 1.2 22.8 1.2C24 1.2 25 2.1 25 3.1"
        stroke="#8F5C2A"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M20 6L4 14H36L20 6Z"
        fill="#D9A874"
        stroke="#7D4E24"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Delicate trailing forest vines and warm autumn maple leaves framing the wooden closet corners.
 * Purely decorative (pointer-events: none, aria-hidden) with gentle CSS breeze sway.
 */
export function ClosetBotanicalDecor({
  vineLeftClass,
  vineRightClass,
  leafClass
}: {
  vineLeftClass: string
  vineRightClass: string
  leafClass: string
}) {
  return (
    <>
      {/* Top-left trailing vine with maple leaf accents */}
      <svg className={vineLeftClass} viewBox="0 0 150 96" fill="none" aria-hidden="true">
        <path
          d="M4 4C28 14 54 12 82 22C102 29 120 24 142 14"
          stroke="#5E8B57"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M12 10C18 32 10 56 22 82"
          stroke="#6A9860"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        {/* Green vine leaves */}
        <path d="M36 14C32 6 42 2 47 9C44 14 40 15 36 14Z" fill="#6F9F62" />
        <path d="M64 17C69 10 78 12 76 20C71 21 67 20 64 17Z" fill="#5B8953" />
        <path d="M104 24C108 16 118 18 115 26C110 27 107 26 104 24Z" fill="#7AAA6C" />
        <path d="M15 36C6 34 4 43 12 46C15 43 16 40 15 36Z" fill="#6F9F62" />
        <path d="M16 58C24 55 28 63 20 67C17 65 16 62 16 58Z" fill="#5B8953" />
        {/* Warm autumn maple leaves nestled on the vine */}
        <path
          d="M24 22L28 17L29 21L34 19L31 24L35 27L29 27L27 31L25 27L20 27L24 24L21 20L24 22Z"
          fill="#E25A2B"
        />
        <path
          d="M84 24L88 20L89 24L93 22L90 26L94 29L89 29L87 32L85 29L81 29L84 26L82 23L84 24Z"
          fill="#EE9B36"
        />
        <path
          d="M20 77L23 73L24 76L28 75L26 79L29 81L24 81L23 85L21 81L17 81L20 79L18 76L20 77Z"
          fill="#D44820"
        />
      </svg>

      {/* Top-right trailing vine with maple leaves */}
      <svg className={vineRightClass} viewBox="0 0 130 92" fill="none" aria-hidden="true">
        <path
          d="M126 6C106 16 86 14 62 24C44 31 26 28 10 18"
          stroke="#5E8B57"
          strokeWidth="2.3"
          strokeLinecap="round"
        />
        <path
          d="M118 12C112 34 120 56 108 82"
          stroke="#6A9860"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path d="M94 16C98 8 88 5 84 12C87 16 90 17 94 16Z" fill="#7AAA6C" />
        <path d="M52 24C48 16 38 18 41 26C46 27 49 26 52 24Z" fill="#5B8953" />
        <path d="M115 44C123 41 126 49 118 53C115 50 114 47 115 44Z" fill="#6F9F62" />
        {/* Maple leaves */}
        <path
          d="M104 22L108 17L109 21L114 19L111 24L115 27L109 27L107 31L105 27L100 27L104 24L101 20L104 22Z"
          fill="#E9722E"
        />
        <path
          d="M109 73L112 69L113 72L117 71L115 75L118 77L113 77L112 81L110 77L106 77L109 75L107 72L109 73Z"
          fill="#F0A83C"
        />
      </svg>

      {/* 3 gentle drifting maple leaves */}
      {[
        { key: 'leaf-1', left: '16%', delay: '0s', duration: '11s', fill: '#E35B2B' },
        { key: 'leaf-2', left: '54%', delay: '3.6s', duration: '13s', fill: '#F09B36' },
        { key: 'leaf-3', left: '84%', delay: '7.1s', duration: '12s', fill: '#D44820' }
      ].map((leaf) => (
        <svg
          key={leaf.key}
          className={leafClass}
          style={{
            left: leaf.left,
            animationDelay: leaf.delay,
            animationDuration: leaf.duration
          }}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 2L14.2 7.2L19 5.5L16.5 10.6L21.5 12.8L16.2 14.5L17.4 18.8L12.8 16.5L12 22L11.2 16.5L6.6 18.8L7.8 14.5L2.5 12.8L7.5 10.6L5 5.5L9.8 7.2L12 2Z"
            fill={leaf.fill}
          />
        </svg>
      ))}
    </>
  )
}
