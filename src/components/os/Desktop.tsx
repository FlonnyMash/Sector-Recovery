import { useRef, useState } from 'react'
import { APP_LIST_FOR_OS } from '../../game/apps'
import { selectCurrentOs, useGameStore } from '../../store/useGameStore'
import type { AppType } from '../../types/game'
import { cn } from '../../utils/cn'
import { DesktopIcon } from './DesktopIcon'
import { NotificationToasts } from './NotificationToasts'
import { Taskbar } from './Taskbar'
import { WindowManager } from './WindowManager'

export function Desktop() {
  const desktopRef = useRef<HTMLDivElement>(null)
  const openWindow = useGameStore((state) => state.openWindow)
  const systemStage = useGameStore((state) => state.systemStage)
  const bootTarget = useGameStore((state) => state.bootTarget)
  const chatBadge = useGameStore((state) => state.prologue.chatNotificationPending)
  const os = selectCurrentOs(systemStage, bootTarget)
  const apps = APP_LIST_FOR_OS(os)
  const host = os === 'host_os'

  const [selectedIcon, setSelectedIcon] = useState<AppType | null>(null)
  const [startMenuOpen, setStartMenuOpen] = useState(false)

  return (
    <div className="os-chrome relative h-screen w-screen overflow-hidden">
      <div
        className={
          host
            ? 'absolute inset-0 bg-gradient-to-br from-[#1a1440] via-[#3d1d6b] to-[#c45c78]'
            : 'absolute inset-0 bg-gradient-to-br from-[#0b3d66] via-[#1a5f8a] to-[#0a7a7a]'
        }
        onMouseDown={() => {
          setSelectedIcon(null)
          setStartMenuOpen(false)
        }}
      >
        {host ? (
          <>
            <div className="absolute -top-24 -left-16 h-[520px] w-[520px] rounded-full bg-[#7c5cff]/35 blur-3xl" />
            <div className="absolute right-[-80px] bottom-[-40px] h-[480px] w-[480px] rounded-full bg-[#ff8a6a]/28 blur-3xl" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_42%)]" />
        )}
      </div>

      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {apps.map((app) => (
          <DesktopIcon
            key={app.type}
            title={app.title}
            selected={selectedIcon === app.type}
            variant={host ? 'modern' : 'retro'}
            icon={app.icon({
              size: 48,
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
          host ? 'bottom-20' : 'bottom-10',
        )}
      >
        <WindowManager desktopRef={desktopRef} os={os} />
      </div>

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
