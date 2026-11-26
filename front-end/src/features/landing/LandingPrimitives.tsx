import type { CSSProperties } from 'react'
import type { FoxAssetPair } from './landingAssets'
import styles from './LandingPage.module.css'

export interface FoxPictureProps {
  asset: FoxAssetPair
  alt: string
  style?: CSSProperties
  className?: string
  loading?: 'eager' | 'lazy'
}

export function FoxPicture({ asset, alt, style, className, loading = 'lazy' }: FoxPictureProps) {
  return (
    <picture>
      <source srcSet={asset.static} media="(prefers-reduced-motion: reduce)" />
      <img
        src={asset.anim}
        alt={alt}
        style={style}
        className={className}
        loading={loading}
        decoding="async"
      />
    </picture>
  )
}

export function BrandLogo({ size = 'desktop' }: { size?: 'desktop' | 'mobile' }) {
  const isDesktop = size === 'desktop'
  return (
    <span className={isDesktop ? styles.brandRowDesktop : styles.brandRowMobile}>
      <svg
        viewBox="0 0 48 40"
        width={isDesktop ? 40 : 32}
        height={isDesktop ? 33 : 27}
        aria-hidden="true"
      >
        <path d="M6 6L16 17L7 24L6 6Z" fill="#F26B3A" />
        <path d="M42 6L32 17L41 24L42 6Z" fill="#F26B3A" />
        <ellipse cx="24" cy="23" rx="15" ry="13" fill="#F26B3A" />
        <path d="M12 25C16 21 32 21 36 25C34 32 29 36 24 36C19 36 14 32 12 25Z" fill="#FFF4E8" />
        <circle cx="19" cy="22" r="2.2" fill="#16324A" />
        <circle cx="29" cy="22" r="2.2" fill="#16324A" />
        <path
          d="M22 27L24 29L26 27"
          stroke="#16324A"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className={isDesktop ? styles.brandWordmarkDesktop : styles.brandWordmarkMobile}>
        Life<span className={styles.accentOrange}>Quest</span>
      </span>
    </span>
  )
}

export type LandingIconName =
  | 'flag'
  | 'check'
  | 'flame'
  | 'clock'
  | 'star'
  | 'lock'
  | 'map'
  | 'users'
  | 'photo'
  | 'chat'
  | 'trophy'
  | 'heart'

export function LandingIcon({
  name,
  size = 18,
  color = 'currentColor',
  strokeWidth = 2.6,
}: {
  name: LandingIconName
  size?: number
  color?: string
  strokeWidth?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'flag' && <path d="M5 21V4M5 4h11l-2 4 2 4H5" />}
      {name === 'check' && <path d="M5 12.5l4.5 4.5L19 7.5" />}
      {name === 'flame' && (
        <path d="M12 3c1 3 4.5 4.6 4.5 9a4.5 4.5 0 0 1-9 0c0-2.3 1.2-3.5 2-5 .6 1.2 1.3 1.8 2 2 .3-2.3-.2-4 .5-6z" />
      )}
      {name === 'clock' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      )}
      {name === 'star' && (
        <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
      )}
      {name === 'lock' && (
        <>
          <rect x="5" y="10" width="14" height="10" rx="2.5" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </>
      )}
      {name === 'map' && (
        <>
          <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" />
          <path d="M9 4v14M15 6v14" />
        </>
      )}
      {name === 'users' && (
        <>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" />
        </>
      )}
      {name === 'photo' && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <circle cx="9" cy="10" r="2" />
          <path d="M21 16l-5-5-9 9" />
        </>
      )}
      {name === 'chat' && <path d="M4 5h16v11H9l-5 4z" />}
      {name === 'trophy' && (
        <>
          <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
          <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7" />
        </>
      )}
      {name === 'heart' && (
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
      )}
    </svg>
  )
}

export function DesktopCheckpointBadge({ step, label }: { step: string; label: string }) {
  return (
    <div className={`${styles.lqReveal} ${styles.cpBadgeWrap}`}>
      <span className={styles.cpBadgePill}>
        <span className={styles.cpBadgeIcon}>
          <LandingIcon name="flag" size={17} color="#FFFFFF" />
        </span>
        <span className={styles.cpBadgeStep}>{step}</span>
        <span className={styles.cpBadgeDot} />
        <span className={styles.cpBadgeLabel}>{label}</span>
      </span>
    </div>
  )
}

export function MobileCheckpointHeader({ step, label }: { step: string; label: string }) {
  return (
    <div className={styles.mobileCpHeader}>
      <span className={styles.mobileCpIcon}>
        <LandingIcon name="flag" size={19} color="#FFFFFF" />
      </span>
      <div>
        <div className={styles.mobileCpStep}>{step}</div>
        <div className={styles.mobileCpLabel}>{label}</div>
      </div>
    </div>
  )
}

export function CampfireSvg({
  gradientId,
  width,
  height,
}: {
  gradientId: string
  width: number
  height: number
}) {
  return (
    <svg
      viewBox="0 0 200 160"
      width={width}
      height={height}
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <radialGradient id={gradientId}>
          <stop offset="0" stopColor="#FFB25E" stopOpacity="0.65" />
          <stop offset="1" stopColor="#FFB25E" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse className={styles.lqGlow} cx="100" cy="120" rx="150" ry="90" fill={`url(#${gradientId})`} />
      <ellipse cx="100" cy="142" rx="54" ry="10" fill="#0F2233" opacity="0.5" />
      <g fill="#8F6A48">
        <rect x="58" y="126" width="84" height="12" rx="6" transform="rotate(-14 100 132)" />
        <rect x="58" y="126" width="84" height="12" rx="6" fill="#B98E66" transform="rotate(14 100 132)" />
      </g>
      <path
        className={styles.lqFlame}
        d="M100 52 C 122 80 132 98 126 114 C 121 128 79 128 74 114 C 68 98 80 80 100 52 Z"
        fill="#F26B3A"
      />
      <path
        className={styles.lqFlame2}
        d="M100 74 C 114 92 118 104 114 116 C 110 126 90 126 86 116 C 82 104 88 92 100 74 Z"
        fill="#F6C85F"
      />
      <path
        className={styles.lqFlame}
        style={{ animationDelay: '0.4s' }}
        d="M100 94 C 107 104 109 110 107 117 C 105 122 95 122 93 117 C 91 110 93 104 100 94 Z"
        fill="#FFF1C9"
      />
      <circle
        className={styles.lqSpark}
        style={{ '--sx': '-14px', animationDelay: '0s' } as CSSProperties}
        cx="92"
        cy="70"
        r="2.2"
        fill="#FFD27A"
      />
      <circle
        className={styles.lqSpark}
        style={{ '--sx': '12px', animationDelay: '0.7s' } as CSSProperties}
        cx="104"
        cy="70"
        r="2.2"
        fill="#FFD27A"
      />
      <circle
        className={styles.lqSpark}
        style={{ '--sx': '4px', animationDelay: '1.4s' } as CSSProperties}
        cx="98"
        cy="70"
        r="2.2"
        fill="#FFD27A"
      />
      <circle
        className={styles.lqSpark}
        style={{ '--sx': '18px', animationDelay: '1.9s' } as CSSProperties}
        cx="110"
        cy="70"
        r="2.2"
        fill="#FFD27A"
      />
    </svg>
  )
}

export function TreeGroup({
  x,
  y,
  scale,
  variant = 'primary',
}: {
  x: number
  y: number
  scale: number
  variant?: 'primary' | 'soft'
}) {
  const topColor = variant === 'primary' ? '#9CCFC1' : '#AEDACD'
  const leftColor = variant === 'primary' ? '#7FBFAE' : '#8CC7B7'
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="-5" y="-6" width="10" height="34" rx="4" fill="#C79E78" />
      <circle cx="0" cy="-30" r="30" fill={topColor} />
      <circle cx="-16" cy="-12" r="20" fill={leftColor} />
      <circle cx="16" cy="-14" r="22" fill={topColor} />
    </g>
  )
}
