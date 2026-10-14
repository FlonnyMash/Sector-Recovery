interface IconProps {
  size?: number
  className?: string
}

export function TerminalIcon({ size = 48, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="42" height="38" rx="3" fill="#1b3a4a" stroke="#8ec8e8" strokeWidth="2" />
      <rect x="6" y="8" width="36" height="24" fill="#062016" />
      <path d="M10 14 L16 18 L10 22" stroke="#7CFF9A" strokeWidth="2" strokeLinecap="square" fill="none" />
      <path d="M18 22 H28" stroke="#7CFF9A" strokeWidth="2" />
      <rect x="8" y="35" width="32" height="4" fill="#2f6f8a" />
      <rect x="8" y="35" width="18" height="4" fill="#5ad4ff" />
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
      <rect x="4" y="6" width="40" height="36" rx="4" fill="#fff5f8" stroke="#d46a8a" strokeWidth="2" />
      <rect x="4" y="6" width="40" height="10" rx="4" fill="#f4a4b8" />
      <rect x="4" y="12" width="40" height="4" fill="#f4a4b8" />
      <circle cx="10" cy="11" r="1.6" fill="#ff6b81" />
      <circle cx="15" cy="11" r="1.6" fill="#ffd166" />
      <circle cx="20" cy="11" r="1.6" fill="#7CFF9A" />
      <rect x="24" y="9" width="16" height="4" rx="2" fill="white" fillOpacity="0.85" />
      <path d="M18 22 C18 18 30 18 30 24 C30 30 18 28 18 34 C24 30 32 32 32 26" stroke="#e56b8c" strokeWidth="2" fill="none" />
      <circle cx="24" cy="26" r="7" stroke="#7eb6e0" strokeWidth="1.5" fill="none" />
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
