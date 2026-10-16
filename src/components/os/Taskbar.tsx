import { useEffect, useMemo, useState } from 'react'
import { APPS } from '../../game/apps'
import { strings } from '../../i18n'
import { selectActiveWindowId, selectWindowsForOs, useGameStore } from '../../store/useGameStore'
import type { OsEnvironment } from '../../types/game'
import { cn } from '../../utils/cn'
import { formatChatClock } from '../../utils/format'
import { getGameNow } from '../../utils/gameClock'
import { SakuraMark } from './icons'
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
    <ClassicTaskbar
      os={os}
      startMenuOpen={startMenuOpen}
      onToggleStart={onToggleStart}
      onCloseStart={onCloseStart}
    />
  )
}

function ClassicTaskbar({ os, startMenuOpen, onToggleStart, onCloseStart }: TaskbarProps) {
  const windows = useGameStore((state) => state.windows)
  const osWindows = useMemo(() => selectWindowsForOs(windows, os), [windows, os])
  const toggleFromTaskbar = useGameStore((state) => state.toggleFromTaskbar)
  const openWindow = useGameStore((state) => state.openWindow)
  const showDesktop = useGameStore((state) => state.showDesktop)
  const chatBadge = useGameStore((state) => state.prologue.chatNotificationPending)
  const activeId = selectActiveWindowId(osWindows)
  const [now, setNow] = useState(() => getGameNow())

  useEffect(() => {
    const id = window.setInterval(() => setNow(getGameNow()), 1000)
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

      <div className="absolute inset-x-0 bottom-0 z-50 flex h-[40px] items-stretch gap-1 border-t-2 border-white bg-[#c0c0c0] px-[3px] py-[2px]">
        <button
          type="button"
          aria-label={strings.os.start}
          onClick={(event) => {
            event.stopPropagation()
            onToggleStart()
          }}
          className={cn(
            'flex h-full shrink-0 items-center gap-1 px-1.5 text-[16px] font-bold italic text-black',
            startMenuOpen ? 'classic-sunken' : 'classic-raised',
          )}
        >
          <SakuraMark size={20} />
          {strings.os.start}
        </button>

        <div className="flex h-full min-w-0 flex-1 items-stretch gap-0.5 overflow-hidden">
          {osWindows.map((windowState) => {
            const app = APPS[windowState.type]
            const isActive = windowState.id === activeId && !windowState.isMinimized
            const showBadge = windowState.type === 'friend-chat' && chatBadge
            return (
              <button
                key={windowState.id}
                type="button"
                onClick={() => toggleFromTaskbar(windowState.id)}
                className={cn(
                  'relative flex h-full min-w-[160px] max-w-[240px] items-center gap-1 truncate px-1.5 text-left text-[14px] text-black',
                  isActive ? 'classic-sunken font-bold' : 'classic-raised',
                  showBadge && 'animate-pulse',
                )}
              >
                {app.icon({ size: 20, badge: showBadge })}
                <span className="truncate">{windowState.title}</span>
              </button>
            )
          })}
        </div>

        <div
          className="classic-sunken ml-auto flex h-full min-w-[84px] items-center justify-center px-2 text-[14px] leading-none text-black"
          title={now.toLocaleDateString()}
        >
          {formatChatClock(now)}
        </div>

        <button
          type="button"
          aria-label={strings.os.showDesktop}
          title={strings.os.showDesktop}
          onClick={showDesktop}
          className="classic-raised ml-0.5 h-full w-[10px] shrink-0"
        />
      </div>
    </>
  )
}
