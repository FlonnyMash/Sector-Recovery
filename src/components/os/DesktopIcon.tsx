import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface DesktopIconProps {
  title: string
  selected: boolean
  icon: ReactNode
  onSelect: () => void
  onOpen: () => void
}

export function DesktopIcon({ title, selected, icon, onSelect, onOpen }: DesktopIconProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onOpen}
      className={cn(
        'flex w-[76px] flex-col items-center gap-1 rounded-sm px-1 py-1.5 text-center',
        selected && 'bg-[#2f6cb4]/45 outline outline-1 outline-white/50',
      )}
    >
      {icon}
      <span className="w-full truncate text-[11px] leading-tight text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.9)]">
        {title}
      </span>
    </button>
  )
}
