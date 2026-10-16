interface IconProps {
  size?: number
  className?: string
}

export function DevSwitchIcon({ size = 48, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="8" width="18" height="14" rx="2" fill="#3d1d6b" stroke="#c9a6ff" strokeWidth="2" />
      <rect x="26" y="26" width="18" height="14" rx="2" fill="#0b3d66" stroke="#7ec8f0" strokeWidth="2" />
      <path d="M24 12 H40 V22" stroke="#ffd166" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 18 L40 22 L44 18" stroke="#ffd166" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 36 H8 V26" stroke="#ffd166" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 30 L8 26 L12 30" stroke="#ffd166" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2" y="2" width="14" height="8" rx="2" fill="#e23d3d" />
      <text
        x="9"
        y="8.4"
        textAnchor="middle"
        fill="white"
        fontFamily="monospace"
        fontSize="6.5"
        fontWeight="700"
      >
        DEV
      </text>
    </svg>
  )
}

/** Five-petal sakura mark used on the target OS Start button. */
export function SakuraMark({ size = 16 }: { size?: number }) {
  const petals = [0, 72, 144, 216, 288]
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      {petals.map((deg) => (
        <ellipse
          key={deg}
          cx="8"
          cy="3.9"
          rx="2.35"
          ry="4.4"
          fill="#ff7eb3"
          stroke="#c2185b"
          strokeWidth="0.7"
          transform={`rotate(${deg} 8 8)`}
        />
      ))}
      <circle cx="8" cy="8" r="1.85" fill="#ffe566" stroke="#e09b00" strokeWidth="0.55" />
    </svg>
  )
}

export function BrowserIcon({ size = 48, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="6" width="40" height="36" rx="4" fill="#faf7ff" stroke="#7b1fa2" strokeWidth="2" />
      <rect x="4" y="6" width="40" height="10" rx="4" fill="#7b1fa2" />
      <rect x="4" y="12" width="40" height="4" fill="#7b1fa2" />
      <circle cx="10" cy="11" r="1.6" fill="#ffcc00" />
      <circle cx="15" cy="11" r="1.6" fill="#ffffff" />
      <circle cx="20" cy="11" r="1.6" fill="#ce93d8" />
      <rect x="24" y="9" width="16" height="4" rx="2" fill="white" fillOpacity="0.85" />
      <text
        x="24"
        y="34"
        textAnchor="middle"
        fill="#7b1fa2"
        fontFamily="Georgia, Times, serif"
        fontSize="16"
        fontWeight="700"
        fontStyle="italic"
      >
        W!
      </text>
    </svg>
  )
}

export function ChatIcon({ size = 48, className, badge }: IconProps & { badge?: boolean }) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <rect x="5" y="6" width="38" height="28" rx="6" fill="#5ad4c8" stroke="#1f7a72" strokeWidth="2" />
        <path d="M16 34 L12 42 L26 34" fill="#5ad4c8" stroke="#1f7a72" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="18" cy="20" r="2.2" fill="#0b3d3a" />
        <circle cx="24" cy="20" r="2.2" fill="#0b3d3a" />
        <circle cx="30" cy="20" r="2.2" fill="#0b3d3a" />
      </svg>
      {badge ? (
        <span className="absolute top-0 right-0 h-[11px] w-[11px] rounded-full border-2 border-white bg-[#e23d3d] shadow-[0_0_6px_rgba(226,61,61,0.9)]" />
      ) : null}
    </span>
  )
}

export function ArcadeIcon({ size = 48, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="10" y="4" width="28" height="20" rx="3" fill="#1b1b32" stroke="#f0c14a" strokeWidth="2" />
      <rect x="13" y="7" width="22" height="12" fill="#3dff9a" fillOpacity="0.85" />
      <rect x="8" y="24" width="32" height="8" rx="2" fill="#2a2a44" stroke="#f0c14a" strokeWidth="2" />
      <rect x="12" y="32" width="24" height="12" fill="#1b1b32" stroke="#f0c14a" strokeWidth="2" />
      <circle cx="18" cy="28" r="2" fill="#ff6b81" />
      <rect x="24" y="26.5" width="10" height="3" rx="1" fill="#7eb6e0" />
    </svg>
  )
}
