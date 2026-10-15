interface IconProps {
  size?: number
  className?: string
}

export function IeIcon({ size = 48, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wahoo2011Glass" x1="12" y1="6" x2="36" y2="42">
          <stop offset="0%" stopColor="#d4a4ff" />
          <stop offset="45%" stopColor="#6a1b9a" />
          <stop offset="100%" stopColor="#3d1466" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="18" fill="url(#wahoo2011Glass)" stroke="#ffcc00" strokeWidth="2.4" />
      <ellipse cx="18" cy="16" rx="8" ry="4" fill="white" fillOpacity="0.28" />
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fill="#ffcc00"
        fontFamily="Georgia, Times, serif"
        fontSize="18"
        fontWeight="700"
        fontStyle="italic"
      >
        W!
      </text>
    </svg>
  )
}

export function RecoverToolIcon({ size = 48, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="6" y="12" width="28" height="24" rx="3" fill="#6b7380" stroke="#2f3540" strokeWidth="2" />
      <rect x="9" y="15" width="22" height="10" fill="#1c2430" />
      <rect x="11" y="18" width="8" height="4" fill="#3ea74a" />
      <rect x="10" y="28" width="6" height="4" rx="1" fill="#c9d0d8" />
      <rect x="18" y="28" width="6" height="4" rx="1" fill="#c9d0d8" />
      <circle cx="34" cy="32" r="8" fill="#dce6f2" stroke="#2f5f90" strokeWidth="2.4" />
      <circle cx="34" cy="32" r="4" fill="none" stroke="#2f5f90" strokeWidth="1.6" />
      <path d="M39.5 37.5 L44 44" stroke="#2f5f90" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
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

export function NotesIcon({ size = 48, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="8" y="4" width="28" height="38" fill="#f7f1c8" stroke="#c2a84a" strokeWidth="2" />
      <rect x="12" y="4" width="28" height="38" fill="#fff8d2" stroke="#b89a3c" strokeWidth="2" />
      <path d="M16 14 H36 M16 20 H36 M16 26 H32 M16 32 H28" stroke="#8a7a3a" strokeWidth="2" />
    </svg>
  )
}

export function StartFlag({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1" y="1" width="6.5" height="6.5" fill="#f25f29" />
      <rect x="8.5" y="1" width="6.5" height="6.5" fill="#8cc63f" />
      <rect x="1" y="8.5" width="6.5" height="6.5" fill="#00aeef" />
      <rect x="8.5" y="8.5" width="6.5" height="6.5" fill="#ffc20e" />
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

export function ComputerIcon({ size = 48, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="6" width="26" height="20" rx="2" fill="#dce6f0" stroke="#3a4a58" strokeWidth="2" />
      <rect x="7" y="9" width="20" height="13" fill="#1a4a78" />
      <rect x="10" y="26" width="14" height="3" fill="#8a96a4" />
      <rect x="7" y="29" width="20" height="2" rx="1" fill="#c5ced6" />
      <rect x="32" y="10" width="12" height="24" rx="1.5" fill="#b8c2cc" stroke="#3a4a58" strokeWidth="2" />
      <rect x="35" y="14" width="6" height="4" fill="#2a2a32" />
      <circle cx="38" cy="22" r="1.4" fill="#3ea74a" />
      <rect x="35" y="26" width="6" height="2" fill="#8a96a4" />
      <rect x="35" y="29" width="6" height="2" fill="#8a96a4" />
    </svg>
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
