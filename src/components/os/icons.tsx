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
