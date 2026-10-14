import { useEffect, useState } from 'react'
import { APPS } from '../../game/apps'
import { selectActiveWindowId, useGameStore } from '../../store/useGameStore'
import { cn } from '../../utils/cn'
import { StartFlag } from './icons'
import { StartMenu } from './StartMenu'

interface TaskbarProps {
  startMenuOpen: boolean
  onToggleStart: () => void
  onCloseStart: () => void
}

export function Taskbar({ startMenuOpen, onToggleStart, onCloseStart }: TaskbarProps) {
  const windows = useGameStore((state) => state.windows)
  const toggleFromTaskbar = useGameStore((state) => state.toggleFromTaskbar)
  const openWindow = useGameStore((state) => state.openWindow)
  const showDesktop = useGameStore((state) => state.showDesktop)
  const activeId = selectActiveWindowId(windows)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <>
      {startMenuOpen ? (
        <StartMenu
          onOpenApp={(type) => {
            openWindow(type)
            onCloseStart()
          }}
        />
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-50 flex h-10 items-center border-t border-white/25 bg-black/40 px-1 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <button
          type="button"
          aria-label="Start"
          onClick={(event) => {
            event.stopPropagation()
            onToggleStart()
          }}
          className={cn(
            'mr-2 flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/40',
            'bg-[radial-gradient(circle_at_30%_30%,#b7f08a,transparent_45%),radial-gradient(circle_at_70%_70%,#1b6fd4,#0b3d1f)]',
            'shadow-[inset_0_0_8px_rgba(255,255,255,0.5),0_0_10px_rgba(80,180,80,0.55)]',
            startMenuOpen && 'brightness-110',
          )}
        >
          <StartFlag size={14} />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
          {windows.map((windowState) => {
            const app = APPS[windowState.type]
            const isActive = windowState.id === activeId
            return (
              <button
                key={windowState.id}
                type="button"
                onClick={() => toggleFromTaskbar(windowState.id)}
                className={cn(
                  'flex h-[30px] min-w-[120px] max-w-[180px] items-center gap-1.5 truncate rounded-sm border px-2 text-left text-[12px] text-white',
                  isActive
                    ? 'border-white/50 bg-white/25 shadow-[inset_0_0_8px_rgba(255,255,255,0.25)]'
                    : 'border-white/20 bg-white/10',
                  windowState.isMinimized && 'opacity-70',
                )}
              >
                {app.icon({ size: 16 })}
                <span className="truncate">{windowState.title}</span>
              </button>
            )
          })}
        </div>

        <div
          className="ml-2 flex h-[30px] min-w-[70px] flex-col items-center justify-center rounded-sm border border-white/10 bg-white/5 px-2 text-[11px] leading-tight text-white"
          title={now.toLocaleDateString()}
        >
          <span>
            {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>

        <button
          type="button"
          aria-label="Show desktop"
          title="Show desktop"
          onClick={showDesktop}
          className="ml-1 h-[30px] w-[12px] border-l border-white/30 bg-white/10 hover:bg-white/20"
        />
      </div>
    </>
  )
}
