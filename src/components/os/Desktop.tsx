import { useRef, useState } from 'react'
import { APP_LIST } from '../../game/apps'
import { useGameStore } from '../../store/useGameStore'
import type { AppType } from '../../types/game'
import { DesktopIcon } from './DesktopIcon'
import { Taskbar } from './Taskbar'
import { WindowManager } from './WindowManager'

export function Desktop() {
  const desktopRef = useRef<HTMLDivElement>(null)
  const openWindow = useGameStore((state) => state.openWindow)
  const [selectedIcon, setSelectedIcon] = useState<AppType | null>(null)
  const [startMenuOpen, setStartMenuOpen] = useState(false)

  return (
    <div className="os-chrome relative h-screen w-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#0b3d66] via-[#1a5f8a] to-[#0a7a7a]"
        onMouseDown={() => {
          setSelectedIcon(null)
          setStartMenuOpen(false)
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_42%)]" />
      </div>

      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {APP_LIST.map((app) => (
          <DesktopIcon
            key={app.type}
            title={app.title}
            selected={selectedIcon === app.type}
            icon={app.icon({ size: 48 })}
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
        className="pointer-events-none absolute inset-x-0 top-0 z-20 bottom-10"
      >
        <WindowManager desktopRef={desktopRef} />
      </div>

      <Taskbar
        startMenuOpen={startMenuOpen}
        onToggleStart={() => setStartMenuOpen((open) => !open)}
        onCloseStart={() => setStartMenuOpen(false)}
      />
    </div>
  )
}
