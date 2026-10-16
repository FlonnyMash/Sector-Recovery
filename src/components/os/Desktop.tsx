import { useRef, useState } from 'react'
import { selectVisibleApps } from '../../game/apps'
import { selectCurrentOs, useGameStore } from '../../store/useGameStore'
import type { AppType } from '../../types/game'
import { cn } from '../../utils/cn'
import { DesktopIcon } from './DesktopIcon'
import { GhostBootBurst } from './GhostBootBurst'
import { NotificationToasts } from './NotificationToasts'
import { OsWallpaper } from './OsWallpaper'
import { Taskbar } from './Taskbar'
import { WindowManager } from './WindowManager'

export function Desktop() {
  const desktopRef = useRef<HTMLDivElement>(null)
  const openWindow = useGameStore((state) => state.openWindow)
  const systemStage = useGameStore((state) => state.systemStage)
  const bootTarget = useGameStore((state) => state.bootTarget)
  const chatBadge = useGameStore((state) => state.prologue.chatNotificationPending)
  const hasRecoveryTool = useGameStore((state) => state.hasRecoveryTool)
  const os = selectCurrentOs(systemStage, bootTarget)
  const apps = selectVisibleApps(os, hasRecoveryTool)
  const host = os === 'host_os'

  const [selectedIcon, setSelectedIcon] = useState<AppType | null>(null)
  const [startMenuOpen, setStartMenuOpen] = useState(false)

  return (
    <div className="os-chrome relative h-screen w-screen overflow-hidden">
      <div
        className="absolute inset-0"
        onMouseDown={() => {
          setSelectedIcon(null)
          setStartMenuOpen(false)
        }}
      >
        <OsWallpaper host={host} />
      </div>

      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {apps.map((app) => (
          <DesktopIcon
            key={app.type}
            title={app.title}
            selected={selectedIcon === app.type}
            variant={host ? 'modern' : 'retro'}
            icon={app.icon({
              size: 64,
              badge: app.type === 'friend-chat' && chatBadge,
            })}
            onSelect={() => setSelectedIcon(app.type)}
            onOpen={() => openWindow(app.type)}
          />
        ))}
      </div>

      {startMenuOpen ? (
        <div
          className="absolute inset-0 z-40"
          onMouseDown={() => setStartMenuOpen(false)}
        />
      ) : null}

      <div
        ref={desktopRef}
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-20',
          host ? 'bottom-24' : 'bottom-[40px]',
        )}
      >
        <WindowManager desktopRef={desktopRef} os={os} />
      </div>

      {!host ? <GhostBootBurst /> : null}

      <NotificationToasts />

      <Taskbar
        os={os}
        startMenuOpen={startMenuOpen}
        onToggleStart={() => setStartMenuOpen((open) => !open)}
        onCloseStart={() => setStartMenuOpen(false)}
      />
    </div>
  )
}
