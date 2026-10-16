import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface DesktopIconProps {
  title: string
  selected: boolean
  icon: ReactNode
  onSelect: () => void
  onOpen: () => void
  variant?: 'modern' | 'retro'
}

export function DesktopIcon({
  title,
  selected,
  icon,
  onSelect,
  onOpen,
  variant = 'retro',
}: DesktopIconProps) {
  const modern = variant === 'modern'

  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onOpen}
      className={cn(
        'flex w-[100px] cursor-pointer flex-col items-center gap-1 px-1 py-1.5 text-center',
        modern
          ? cn(
              'rounded-xl hover:bg-white/10',
              selected && 'bg-white/20 ring-1 ring-white/30',
            )
          : cn(
              'rounded-sm',
              selected && 'bg-[#2f6cb4]/45 outline outline-1 outline-white/50',
            ),
      )}
    >
      {icon}
      <span
        className={cn(
          'w-full truncate text-[14px] leading-tight text-white',
          modern ? 'font-medium' : '[text-shadow:1px_1px_2px_rgba(0,0,0,0.9)]',
        )}
      >
        {title}
      </span>
    </button>
  )
}
