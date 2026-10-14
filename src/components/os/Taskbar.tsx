import { useEffect, useMemo, useState } from 'react'
import { APPS } from '../../game/apps'
import { strings } from '../../i18n'
import { selectActiveWindowId, selectWindowsForOs, useGameStore } from '../../store/useGameStore'
import type { OsEnvironment } from '../../types/game'
import { cn } from '../../utils/cn'
import { StartFlag } from './icons'
import { ModernDock } from './ModernDock'
import { StartMenu } from './StartMenu'

interface TaskbarProps {
  os: OsEnvironment
  startMenuOpen: boolean
  onToggleStart: () => void
  onCloseStart: () => void
}

export function Taskbar({ os, startMenuOpen, onToggleStart, onCloseStart }: TaskbarProps) {
  if (os === 'host_os') {
    return (
      <ModernDock
        os={os}
        startMenuOpen={startMenuOpen}
        onToggleStart={onToggleStart}
        onCloseStart={onCloseStart}
      />
    )
  }

  return (
    <AeroTaskbar
      os={os}
      startMenuOpen={startMenuOpen}
      onToggleStart={onToggleStart}
      onCloseStart={onCloseStart}
    />
  )
}

function AeroTaskbar({ os, startMenuOpen, onToggleStart, onCloseStart }: TaskbarProps) {
  const windows = useGameStore((state) => state.windows)
  const osWindows = useMemo(() => selectWindowsForOs(windows, os), [windows, os])
  const toggleFromTaskbar = useGameStore((state) => state.toggleFromTaskbar)
  const openWindow = useGameStore((state) => state.openWindow)
  const showDesktop = useGameStore((state) => state.showDesktop)
  const chatBadge = useGameStore((state) => state.prologue.chatNotificationPending)
  const activeId = selectActiveWindowId(osWindows)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <>
      {startMenuOpen ? (
        <StartMenu
          os={os}
          onOpenApp={(type) => {
            openWindow(type)
            onCloseStart()
          }}
          onRestart={onCloseStart}
        />
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-50 flex h-10 items-center border-t border-white/25 bg-black/40 px-1 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <button
          type="button"
          aria-label={strings.os.start}
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
          {osWindows.map((windowState) => {
            const app = APPS[windowState.type]
            const isActive = windowState.id === activeId
            const showBadge = windowState.type === 'friend-chat' && chatBadge
            return (
              <button
                key={windowState.id}
                type="button"
                onClick={() => toggleFromTaskbar(windowState.id)}
                className={cn(
                  'relative flex h-[30px] min-w-[120px] max-w-[180px] items-center gap-1.5 truncate rounded-sm border px-2 text-left text-[12px] text-white',
                  isActive
                    ? 'border-white/50 bg-white/25 shadow-[inset_0_0_8px_rgba(255,255,255,0.25)]'
                    : 'border-white/20 bg-white/10',
                  windowState.isMinimized && 'opacity-70',
                  showBadge && 'animate-pulse',
                )}
              >
                {app.icon({ size: 16, badge: showBadge })}
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
          aria-label={strings.os.showDesktop}
          title={strings.os.showDesktop}
          onClick={showDesktop}
          className="ml-1 h-[30px] w-[12px] border-l border-white/30 bg-white/10 hover:bg-white/20"
        />
      </div>
    </>
  )
}
