import { motion, useDragControls, useMotionValue, type DragControls } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode, RefObject } from 'react'
import { APPS } from '../../game/apps'
import { useGameStore } from '../../store/useGameStore'
import type { WindowState } from '../../types/game'
import { cn } from '../../utils/cn'

const FALLBACK_MIN_WIDTH = 320
const FALLBACK_MIN_HEIGHT = 220

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

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
  const systemStage = useGameStore((state) => state.systemStage)
  const modern = systemStage === 'host_os'

  const dragControls = useDragControls()
  const app = APPS[windowState.type]
  const x = useMotionValue(48 + cascadeIndex * 32)
  const y = useMotionValue(36 + cascadeIndex * 28)
  const width = useMotionValue(app.defaultSize.width)
  const height = useMotionValue(app.defaultSize.height)
  const savedX = useRef(48 + cascadeIndex * 32)
  const savedY = useRef(36 + cascadeIndex * 28)
  const savedW = useRef(app.defaultSize.width)
  const savedH = useRef(app.defaultSize.height)
  const resizeRef = useRef<{
    edge: ResizeEdge
    pointerX: number
    pointerY: number
    startX: number
    startY: number
    startW: number
    startH: number
  } | null>(null)

  useEffect(() => {
    if (windowState.isMaximized) {
      savedX.current = x.get()
      savedY.current = y.get()
      savedW.current = width.get()
      savedH.current = height.get()
      x.set(0)
      y.set(0)
      return
    }
    x.set(savedX.current)
    y.set(savedY.current)
    width.set(savedW.current)
    height.set(savedH.current)
  }, [windowState.isMaximized, x, y, width, height])

  function applyResize(clientX: number, clientY: number) {
    const session = resizeRef.current
    if (!session) return
    const desktop = desktopRef.current?.getBoundingClientRect()
    const maxW = desktop?.width ?? window.innerWidth
    const maxH = desktop?.height ?? window.innerHeight
    const minW = Math.min(app.minSize?.width ?? FALLBACK_MIN_WIDTH, maxW)
    const minH = Math.min(app.minSize?.height ?? FALLBACK_MIN_HEIGHT, maxH)
    const dx = clientX - session.pointerX
    const dy = clientY - session.pointerY
    const { edge, startX, startY, startW, startH } = session

    let nextW = startW
    let nextH = startH
    let nextX = startX
    let nextY = startY

    if (edge.includes('e')) nextW = startW + dx
    if (edge.includes('s')) nextH = startH + dy
    if (edge.includes('w')) {
      nextW = startW - dx
      nextX = startX + dx
    }
    if (edge.includes('n')) {
      nextH = startH - dy
      nextY = startY + dy
    }

    nextW = Math.max(minW, nextW)
    nextH = Math.max(minH, nextH)

    if (edge.includes('w')) {
      nextX = startX + (startW - nextW)
      if (nextX < 0) {
        nextW = Math.max(minW, nextW + nextX)
        nextX = 0
      }
    }
    if (edge.includes('n')) {
      nextY = startY + (startH - nextH)
      if (nextY < 0) {
        nextH = Math.max(minH, nextH + nextY)
        nextY = 0
      }
    }
    if (edge.includes('e')) nextW = Math.min(nextW, maxW - nextX)
    if (edge.includes('s')) nextH = Math.min(nextH, maxH - nextY)

    nextW = Math.max(minW, Math.min(nextW, maxW))
    nextH = Math.max(minH, Math.min(nextH, maxH))

    width.set(nextW)
    height.set(nextH)
    x.set(nextX)
    y.set(nextY)
  }

  function startResize(edge: ResizeEdge, event: ReactPointerEvent<HTMLDivElement>) {
    event.stopPropagation()
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    resizeRef.current = {
      edge,
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: x.get(),
      startY: y.get(),
      startW: width.get(),
      startH: height.get(),
    }
  }

  function endResize() {
    if (!resizeRef.current) return
    resizeRef.current = null
    savedX.current = x.get()
    savedY.current = y.get()
    savedW.current = width.get()
    savedH.current = height.get()
  }

  const Icon = app.icon
  const rounded = windowState.isMaximized ? 'rounded-none' : modern ? 'rounded-xl' : 'rounded-t-[6px]'

  return (
    <motion.div
      drag={!windowState.isMaximized && !windowState.isMinimized}
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={desktopRef}
      initial={modern ? { opacity: 0, scale: 0.96 } : false}
      animate={modern ? { opacity: 1, scale: 1 } : undefined}
      transition={modern ? { type: 'spring', stiffness: 420, damping: 32 } : undefined}
      whileDrag={modern ? { scale: 1.005 } : undefined}
      onDragEnd={() => {
        savedX.current = x.get()
        savedY.current = y.get()
      }}
      onPointerDownCapture={() => focusWindow(windowState.id)}
      style={{
        x,
        y,
        zIndex: windowState.zIndex,
        width: windowState.isMaximized ? '100%' : width,
        height: windowState.isMaximized ? '100%' : height,
        display: windowState.isMinimized ? 'none' : 'flex',
      }}
      className={cn(
        'pointer-events-auto absolute top-0 left-0 flex flex-col overflow-hidden',
        rounded,
        modern ? 'shadow-2xl' : 'shadow-[0_12px_40px_rgba(0,0,0,0.55)]',
      )}
    >
      {modern ? (
        <div
          className={cn(
            'flex h-full flex-col overflow-hidden border border-white/10 bg-[#f7f7f9]',
            rounded,
          )}
        >
          <ModernTitleBar
            title={windowState.title}
            isActive={isActive}
            isMaximized={windowState.isMaximized}
            dragControls={dragControls}
            onMinimize={() => minimizeWindow(windowState.id)}
            onMaximize={() => toggleMaximize(windowState.id)}
            onClose={() => closeWindow(windowState.id)}
          />
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </div>
      ) : (
        <div
          className={cn(
            'flex h-full flex-col border backdrop-blur-md',
            windowState.isMaximized ? 'rounded-none' : 'rounded-t-[6px]',
            isActive ? 'border-white/60 bg-white/35' : 'border-white/30 bg-white/20',
          )}
        >
          <AeroTitleBar
            title={windowState.title}
            isActive={isActive}
            isMaximized={windowState.isMaximized}
            dragControls={dragControls}
            icon={<Icon size={16} />}
            onMinimize={() => minimizeWindow(windowState.id)}
            onMaximize={() => toggleMaximize(windowState.id)}
            onClose={() => closeWindow(windowState.id)}
          />
          <div className="min-h-0 flex-1 overflow-hidden border-[3px] border-white/25 bg-[#f0f0f0]">
            {children}
          </div>
        </div>
      )}

      {!windowState.isMaximized ? (
        <ResizeHandles
          onStart={startResize}
          onMove={(event) => applyResize(event.clientX, event.clientY)}
          onEnd={endResize}
        />
      ) : null}
    </motion.div>
  )
}

function ResizeHandles({
  onStart,
  onMove,
  onEnd,
}: {
  onStart: (edge: ResizeEdge, event: ReactPointerEvent<HTMLDivElement>) => void
  onMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onEnd: (event: ReactPointerEvent<HTMLDivElement>) => void
}) {
  const handles: Array<{ edge: ResizeEdge; className: string }> = [
    { edge: 'n', className: 'top-0 right-3 left-3 h-2 cursor-n-resize' },
    { edge: 's', className: 'right-3 bottom-0 left-3 h-2 cursor-s-resize' },
    { edge: 'e', className: 'top-3 right-0 bottom-3 w-2 cursor-e-resize' },
    { edge: 'w', className: 'top-3 bottom-3 left-0 w-2 cursor-w-resize' },
    { edge: 'ne', className: 'top-0 right-0 h-3.5 w-3.5 cursor-nesw-resize' },
    { edge: 'nw', className: 'top-0 left-0 h-3.5 w-3.5 cursor-nwse-resize' },
    { edge: 'se', className: 'right-0 bottom-0 h-3.5 w-3.5 cursor-nwse-resize' },
    { edge: 'sw', className: 'bottom-0 left-0 h-3.5 w-3.5 cursor-nesw-resize' },
  ]

  return (
    <>
      {handles.map((handle) => (
        <div
          key={handle.edge}
          role="separator"
          aria-orientation={handle.edge === 'e' || handle.edge === 'w' ? 'vertical' : 'horizontal'}
          aria-label={`Resize ${handle.edge}`}
          className={cn('absolute z-20 touch-none', handle.className)}
          onPointerDown={(event) => onStart(handle.edge, event)}
          onPointerMove={onMove}
          onPointerUp={onEnd}
          onPointerCancel={onEnd}
        />
      ))}
    </>
  )
}

function ModernTitleBar({
  title,
  isActive,
  isMaximized,
  dragControls,
  onMinimize,
  onMaximize,
  onClose,
}: {
  title: string
  isActive: boolean
  isMaximized: boolean
  dragControls: DragControls
  onMinimize: () => void
  onMaximize: () => void
  onClose: () => void
}) {
  return (
    <div
      className={cn(
        'group flex h-10 shrink-0 items-center bg-white/80 px-3 backdrop-blur-md',
        !isActive && 'opacity-80',
      )}
      onPointerDown={(event) => {
        if (isMaximized) return
        dragControls.start(event)
      }}
      onDoubleClick={onMaximize}
    >
      <div
        className="flex shrink-0 items-center gap-2"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <TrafficLight
          color="close"
          label="Close"
          dimmed={!isActive}
          onClick={onClose}
        />
        <TrafficLight
          color="minimize"
          label="Minimize"
          dimmed={!isActive}
          onClick={onMinimize}
        />
        <TrafficLight
          color="maximize"
          label={isMaximized ? 'Restore' : 'Maximize'}
          dimmed={!isActive}
          onClick={onMaximize}
        />
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center">
        <span
          className={cn(
            'truncate text-[13px] font-medium',
            isActive ? 'text-neutral-700' : 'text-neutral-400',
          )}
        >
          {title}
        </span>
      </div>

      <div className="w-16 shrink-0" />
    </div>
  )
}

function TrafficLight({
  color,
  label,
  dimmed,
  onClick,
}: {
  color: 'close' | 'minimize' | 'maximize'
  label: string
  dimmed: boolean
  onClick: () => void
}) {
  const fill =
    color === 'close' ? 'bg-[#ff5f57]' : color === 'minimize' ? 'bg-[#febc2e]' : 'bg-[#28c840]'

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex h-4 w-4 items-center justify-center rounded-full text-[#4a1c12]',
        dimmed ? 'bg-neutral-300' : fill,
      )}
    >
      <span className="flex h-full w-full items-center justify-center opacity-0 group-hover:opacity-100">
        <TrafficGlyph color={color} />
      </span>
    </button>
  )
}

function TrafficGlyph({ color }: { color: 'close' | 'minimize' | 'maximize' }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      {color === 'close' ? (
        <path
          d="M2.2 2.2 L7.8 7.8 M7.8 2.2 L2.2 7.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ) : color === 'minimize' ? (
        <path
          d="M2 5 H8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M5 2 V8 M2 5 H8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

function AeroTitleBar({
  title,
  isActive,
  isMaximized,
  dragControls,
  icon,
  onMinimize,
  onMaximize,
  onClose,
}: {
  title: string
  isActive: boolean
  isMaximized: boolean
  dragControls: DragControls
  icon: ReactNode
  onMinimize: () => void
  onMaximize: () => void
  onClose: () => void
}) {
  return (
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
          if (isMaximized) return
          dragControls.start(event)
        }}
        onDoubleClick={onMaximize}
      >
        <span className="shrink-0">{icon}</span>
        <span
          className={cn(
            'truncate text-[12px] font-semibold',
            isActive
              ? 'text-[#1a1a1a] drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]'
              : 'text-[#4a4a4a]',
          )}
        >
          {title}
        </span>
      </div>

      <div
        className="flex shrink-0 items-start"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <WindowButton label="Minimize" onClick={onMinimize}>
          <span className="mt-[7px] block h-[2px] w-[10px] bg-white" />
        </WindowButton>
        <WindowButton label={isMaximized ? 'Restore' : 'Maximize'} onClick={onMaximize}>
          {isMaximized ? (
            <span className="relative block h-[9px] w-[10px]">
              <span className="absolute top-0 right-0 h-[7px] w-[7px] border border-white" />
              <span className="absolute bottom-0 left-0 h-[7px] w-[7px] border border-white bg-[#5a9fd6]" />
            </span>
          ) : (
            <span className="block h-[9px] w-[9px] border-2 border-white" />
          )}
        </WindowButton>
        <WindowButton label="Close" wide danger onClick={onClose}>
          <span className="text-[13px] leading-none font-bold text-white">×</span>
        </WindowButton>
      </div>
    </div>
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
