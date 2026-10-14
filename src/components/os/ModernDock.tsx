import { motion } from 'framer-motion'
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { APP_LIST_FOR_OS } from '../../game/apps'
import { strings } from '../../i18n'
import { selectActiveWindowId, selectWindowsForOs, useGameStore } from '../../store/useGameStore'
import type { OsEnvironment } from '../../types/game'
import { cn } from '../../utils/cn'
import { StartMenu } from './StartMenu'

interface ModernDockProps {
  os: OsEnvironment
  startMenuOpen: boolean
  onToggleStart: () => void
  onCloseStart: () => void
}

export function ModernDock({ os, startMenuOpen, onToggleStart, onCloseStart }: ModernDockProps) {
  const windows = useGameStore((state) => state.windows)
  const osWindows = useMemo(() => selectWindowsForOs(windows, os), [windows, os])
  const toggleFromTaskbar = useGameStore((state) => state.toggleFromTaskbar)
  const openWindow = useGameStore((state) => state.openWindow)
  const showDesktop = useGameStore((state) => state.showDesktop)
  const chatBadge = useGameStore((state) => state.prologue.chatNotificationPending)
  const activeId = selectActiveWindowId(osWindows)
  const apps = APP_LIST_FOR_OS(os)
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

      <div className="absolute bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-end gap-1 rounded-2xl border border-white/20 bg-white/10 px-2 py-1.5 shadow-2xl backdrop-blur-xl">
        <DockTile
          label={strings.os.start}
          active={startMenuOpen}
          onClick={(event) => {
            event.stopPropagation()
            onToggleStart()
          }}
        >
          <LauncherGlyph />
        </DockTile>

        <div className="mx-1 h-8 w-px self-center bg-white/20" />

        {apps.map((app) => {
          const running = osWindows.find((windowState) => windowState.type === app.type)
          const isActive = Boolean(running && running.id === activeId && !running.isMinimized)
          const showBadge = app.type === 'friend-chat' && chatBadge

          return (
            <DockTile
              key={app.type}
              label={app.title}
              active={isActive}
              running={Boolean(running)}
              badge={showBadge}
              onClick={() => {
                if (running) {
                  toggleFromTaskbar(running.id)
                  return
                }
                openWindow(app.type)
              }}
            >
              {app.icon({ size: 28, badge: showBadge })}
            </DockTile>
          )
        })}

        <div className="mx-1 h-8 w-px self-center bg-white/20" />

        <div
          className="flex h-10 min-w-[64px] flex-col items-center justify-center rounded-xl px-2 text-[11px] leading-tight text-white/90"
          title={now.toLocaleDateString()}
        >
          <span className="font-medium">
            {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>

        <button
          type="button"
          aria-label={strings.os.showDesktop}
          title={strings.os.showDesktop}
          onClick={showDesktop}
          className="ml-0.5 h-10 w-2.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/25"
        />
      </div>
    </>
  )
}

function DockTile({
  children,
  label,
  onClick,
  active = false,
  running = false,
  badge = false,
}: {
  children: ReactNode
  label: string
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
  active?: boolean
  running?: boolean
  badge?: boolean
}) {
  return (
    <motion.button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      whileHover={{ scale: 1.08, y: -2 }}
      transition={{ type: 'spring', stiffness: 520, damping: 28 }}
      className={cn(
        'relative flex h-11 w-11 items-center justify-center rounded-xl',
        active ? 'bg-white/25' : 'bg-transparent hover:bg-white/10',
        badge && 'animate-pulse',
      )}
    >
      {children}
      {running ? (
        <span
          className={cn(
            'absolute bottom-0.5 h-1 w-1 rounded-full',
            active ? 'bg-white' : 'bg-white/55',
          )}
        />
      ) : null}
    </motion.button>
  )
}

function LauncherGlyph() {
  return (
    <span className="grid grid-cols-2 gap-[3px]">
      <span className="h-[7px] w-[7px] rounded-[2px] bg-white/90" />
      <span className="h-[7px] w-[7px] rounded-[2px] bg-white/70" />
      <span className="h-[7px] w-[7px] rounded-[2px] bg-white/70" />
      <span className="h-[7px] w-[7px] rounded-[2px] bg-white/90" />
    </span>
  )
}
