import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'
import { useRef } from 'react'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'
import type { OsNotification } from '../../types/game'
import { cn } from '../../utils/cn'

const SHIFT = 6

export function NotificationToasts() {
  const notifications = useGameStore((state) => state.notifications)
  const systemStage = useGameStore((state) => state.systemStage)
  const modern = systemStage === 'host_os'

  return (
    <div
      className={cn(
        'pointer-events-none absolute right-4 z-[70] flex w-[520px] flex-col gap-3',
        modern ? 'bottom-24' : 'bottom-12',
      )}
    >
      <AnimatePresence>
        {notifications.map((notification) => (
          <ToastCard key={notification.id} notification={notification} modern={modern} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastCard({
  notification,
  modern,
}: {
  notification: OsNotification
  modern: boolean
}) {
  const dismissNotification = useGameStore((state) => state.dismissNotification)
  const holdNotification = useGameStore((state) => state.holdNotification)
  const releaseNotification = useGameStore((state) => state.releaseNotification)
  const openWindow = useGameStore((state) => state.openWindow)
  const focusChat = useGameStore((state) => state.focusChat)
  const cardRef = useRef<HTMLButtonElement>(null)
  const boundsRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null)
  const shiftX = useMotionValue(0)
  const shiftY = useMotionValue(0)
  const x = useSpring(shiftX, { stiffness: 320, damping: 28, mass: 0.5 })
  const y = useSpring(shiftY, { stiffness: 320, damping: 28, mass: 0.5 })

  function captureBounds() {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    boundsRef.current = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    }
  }

  function followPointer(clientX: number, clientY: number) {
    const rect = boundsRef.current
    if (!rect) return
    const px = Math.max(-1, Math.min(1, (clientX - rect.left) / rect.width * 2 - 1))
    const py = Math.max(-1, Math.min(1, (clientY - rect.top) / rect.height * 2 - 1))
    shiftX.set(px * SHIFT)
    shiftY.set(py * SHIFT)
  }

  return (
    <motion.button
      ref={cardRef}
      type="button"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.22 }}
      onPointerEnter={(event) => {
        captureBounds()
        holdNotification(notification.id)
        followPointer(event.clientX, event.clientY)
      }}
      onPointerMove={(event) => followPointer(event.clientX, event.clientY)}
      onPointerLeave={() => {
        shiftX.set(0)
        shiftY.set(0)
        boundsRef.current = null
        releaseNotification(notification.id)
      }}
      onClick={() => {
        if (notification.kind === 'chat') {
          if (notification.conversationId) focusChat(notification.conversationId)
          else openWindow('friend-chat')
        }
        dismissNotification(notification.id)
      }}
      className="pointer-events-auto text-left"
    >
      <motion.div
        style={{ x, y }}
        className={
          modern
            ? 'rounded-2xl border border-white/40 bg-white/90 p-5 text-neutral-900 shadow-2xl backdrop-blur-xl'
            : 'rounded-sm border border-white/40 bg-[#1b1b1b]/85 p-4 text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md'
        }
      >
        <div
          className={cn(
            'text-[17px] font-medium tracking-wide uppercase',
            modern ? 'text-[#0a84ff]' : 'text-[#9ad4c8]',
          )}
        >
          {notification.kind === 'chat' ? strings.apps.friendChat : strings.os.hostPcName}
        </div>
        <div className="mt-1 text-[22px] font-semibold leading-snug">{notification.title}</div>
        <div
          className={cn(
            'mt-1.5 line-clamp-2 text-[18px] leading-snug',
            modern ? 'text-neutral-600' : 'text-white/80',
          )}
        >
          {notification.body}
        </div>
      </motion.div>
    </motion.button>
  )
}
