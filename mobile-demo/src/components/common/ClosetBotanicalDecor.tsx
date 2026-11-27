import React from 'react'

export function MiniHangerHook({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 16" width="32" height="13" fill="none" aria-hidden="true" style={{ display: 'block' }}>
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

export function ClosetBotanicalDecor() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, pointerEvents: 'none', overflow: 'hidden', zIndex: 2 }}>
      {/* Top-left trailing vine */}
      <svg viewBox="0 0 150 40" width="120" height="32" fill="none" style={{ position: 'absolute', top: 0, left: 0 }}>
        <path d="M0 4C24 14 50 12 76 18C96 23 114 20 134 12" stroke="#5E8B57" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="28" cy="14" r="3" fill="#6A9860" />
        <circle cx="64" cy="17" r="3.5" fill="#7BAA6E" />
        <circle cx="102" cy="17" r="3" fill="#6A9860" />
        <circle cx="48" cy="22" r="2.5" fill="#F26B3A" />
      </svg>

      {/* Top-right trailing vine */}
      <svg viewBox="0 0 150 40" width="120" height="32" fill="none" style={{ position: 'absolute', top: 0, right: 0, transform: 'scaleX(-1)' }}>
        <path d="M0 4C24 14 50 12 76 18C96 23 114 20 134 12" stroke="#5E8B57" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="30" cy="14" r="3" fill="#6A9860" />
        <circle cx="68" cy="17" r="3.5" fill="#7BAA6E" />
        <circle cx="52" cy="22" r="2.5" fill="#F26B3A" />
      </svg>
    </div>
  )
}
