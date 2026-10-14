import { motion, useDragControls, useMotionValue } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import { APPS } from '../../game/apps'
import { useGameStore } from '../../store/useGameStore'
import type { WindowState } from '../../types/game'
import { cn } from '../../utils/cn'

interface OSWindowProps {
  windowState: WindowState
  isActive: boolean
  cascadeIndex: number
  desktopRef: RefObject<HTMLDivElement | null>
  children: ReactNode
}

export function OSWindow({
  windowState,
  isActive,
  cascadeIndex,
  desktopRef,
  children,
}: OSWindowProps) {
  const focusWindow = useGameStore((state) => state.focusWindow)
  const closeWindow = useGameStore((state) => state.closeWindow)
  const minimizeWindow = useGameStore((state) => state.minimizeWindow)
  const toggleMaximize = useGameStore((state) => state.toggleMaximize)

  const dragControls = useDragControls()
  const app = APPS[windowState.type]
  const x = useMotionValue(48 + cascadeIndex * 32)
  const y = useMotionValue(36 + cascadeIndex * 28)
  const savedX = useRef(48 + cascadeIndex * 32)
  const savedY = useRef(36 + cascadeIndex * 28)

  useEffect(() => {
    if (windowState.isMaximized) {
      savedX.current = x.get()
      savedY.current = y.get()
      x.set(0)
      y.set(0)
      return
    }
    x.set(savedX.current)
    y.set(savedY.current)
  }, [windowState.isMaximized, x, y])

  const Icon = app.icon

  return (
    <motion.div
      drag={!windowState.isMaximized && !windowState.isMinimized}
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={desktopRef}
      onDragEnd={() => {
        savedX.current = x.get()
        savedY.current = y.get()
      }}
      onPointerDownCapture={() => focusWindow(windowState.id)}
      style={{
        x,
        y,
        zIndex: windowState.zIndex,
        width: windowState.isMaximized ? '100%' : app.defaultSize.width,
        height: windowState.isMaximized ? '100%' : app.defaultSize.height,
        display: windowState.isMinimized ? 'none' : 'flex',
      }}
      className={cn(
        'pointer-events-auto absolute top-0 left-0 flex flex-col overflow-hidden',
        windowState.isMaximized ? 'rounded-none' : 'rounded-t-[6px]',
        'shadow-[0_12px_40px_rgba(0,0,0,0.55)]',
      )}
    >
      <div
        className={cn(
          'flex h-full flex-col border backdrop-blur-md',
          windowState.isMaximized ? 'rounded-none' : 'rounded-t-[6px]',
          isActive
            ? 'border-white/60 bg-white/35'
            : 'border-white/30 bg-white/20',
        )}
      >
        <div
          className={cn(
            'flex h-[31px] shrink-0 items-stretch',
            isActive
              ? 'bg-gradient-to-b from-white/70 via-[#cfe6f8]/50 to-[#7eb6e0]/35'
              : 'bg-gradient-to-b from-white/30 via-white/15 to-white/5',
          )}
        >
          <div
            className="flex min-w-0 flex-1 items-center gap-1.5 px-2"
            onPointerDown={(event) => {
              if (windowState.isMaximized) return
              dragControls.start(event)
            }}
            onDoubleClick={() => toggleMaximize(windowState.id)}
          >
            <span className="shrink-0">
              <Icon size={16} />
            </span>
            <span
              className={cn(
                'truncate text-[12px] font-semibold',
                isActive ? 'text-[#1a1a1a] drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]' : 'text-[#4a4a4a]',
              )}
            >
              {windowState.title}
            </span>
          </div>

          <div
            className="flex shrink-0 items-start"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <WindowButton
              label="Minimize"
              onClick={() => minimizeWindow(windowState.id)}
            >
              <span className="mt-[7px] block h-[2px] w-[10px] bg-white" />
            </WindowButton>
            <WindowButton
              label={windowState.isMaximized ? 'Restore' : 'Maximize'}
              onClick={() => toggleMaximize(windowState.id)}
            >
              {windowState.isMaximized ? (
                <span className="relative block h-[9px] w-[10px]">
                  <span className="absolute top-0 right-0 h-[7px] w-[7px] border border-white" />
                  <span className="absolute bottom-0 left-0 h-[7px] w-[7px] border border-white bg-[#5a9fd6]" />
                </span>
              ) : (
                <span className="block h-[9px] w-[9px] border-2 border-white" />
              )}
            </WindowButton>
            <WindowButton
              label="Close"
              wide
              danger
              onClick={() => closeWindow(windowState.id)}
            >
              <span className="text-[13px] leading-none font-bold text-white">×</span>
            </WindowButton>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden border-[3px] border-white/25 bg-[#f0f0f0]">
          {children}
        </div>
      </div>
    </motion.div>
  )
}

function WindowButton({
  children,
  onClick,
  label,
  wide = false,
  danger = false,
}: {
  children: ReactNode
  onClick: () => void
  label: string
  wide?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex h-[20px] items-center justify-center border border-white/50',
        wide ? 'w-[45px]' : 'w-[26px]',
        danger
          ? 'bg-gradient-to-b from-[#e38a8a] via-[#d04545] to-[#9e1c1c] hover:from-[#f0a0a0] hover:via-[#e05252] hover:to-[#b42222]'
          : 'bg-gradient-to-b from-white/50 via-[#8eb8dd]/70 to-[#3e7cb0]/80 hover:from-white/70 hover:via-[#a8ccea] hover:to-[#4d8fc4]',
      )}
    >
      {children}
    </button>
  )
}
