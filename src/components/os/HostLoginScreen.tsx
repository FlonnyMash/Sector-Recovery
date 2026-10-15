import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { APPS } from '../../game/apps'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'
import { cn } from '../../utils/cn'
import { DesktopIcon } from './DesktopIcon'
import { OsWallpaper } from './OsWallpaper'
import { WindowManager } from './WindowManager'

const SAVED_PASSWORD = 'campusok'
const FILL_STEP_MS = 55

export function HostLoginScreen() {
  const signInHostOS = useGameStore((state) => state.signInHostOS)
  const restartSystem = useGameStore((state) => state.restartSystem)
  const openWindow = useGameStore((state) => state.openWindow)
  const desktopRef = useRef<HTMLDivElement>(null)
  const [filledChars, setFilledChars] = useState(0)
  const [devSelected, setDevSelected] = useState(false)
  const filled = filledChars >= SAVED_PASSWORD.length
  const copy = strings.hostLogin
  const showDevTools = import.meta.env.DEV
  const devApp = APPS['dev-tools-host']

  useEffect(() => {
    if (filledChars === 0 || filled) return
    const id = window.setTimeout(() => setFilledChars((count) => count + 1), FILL_STEP_MS)
    return () => window.clearTimeout(id)
  }, [filledChars, filled])

  function startFill() {
    if (filledChars === 0) setFilledChars(1)
  }

  return (
    <div className="os-chrome relative h-screen w-screen overflow-hidden font-[ui-sans-serif,-apple-system,'Segoe_UI',sans-serif]">
      <OsWallpaper host />
      <div className="absolute inset-0 bg-black/20" />

      {showDevTools ? (
        <div className="absolute top-3 left-3 z-20">
          <DesktopIcon
            title={devApp.title}
            selected={devSelected}
            variant="modern"
            icon={devApp.icon({ size: 48 })}
            onSelect={() => setDevSelected(true)}
            onOpen={() => openWindow('dev-tools-host')}
          />
        </div>
      ) : null}

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex w-[260px] flex-col items-center"
        >
          <h1 className="text-center text-[26px] font-semibold tracking-tight text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.35)]">
            {copy.welcome}
          </h1>
          <p className="mt-1.5 text-center text-[13px] text-white/80">
            {copy.subtitle.replace('{name}', strings.os.hostPcName)}
          </p>

          <div className="mt-6 flex w-full items-center gap-2">
            <input
              type="password"
              readOnly
              value={SAVED_PASSWORD.slice(0, filledChars)}
              placeholder={copy.passwordPlaceholder}
              onClick={startFill}
              onFocus={startFill}
              className="h-9 min-w-0 flex-1 rounded-md border border-white/25 bg-white/92 px-2.5 text-[13px] text-[#1d1730] shadow-sm outline-none placeholder:text-[#8a8494] focus:border-white/60"
            />
            <button
              type="button"
              disabled={!filled}
              onClick={signInHostOS}
              className={cn(
                'flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-[12px] font-semibold shadow-sm transition',
                filled
                  ? 'border-white/50 bg-white text-[#1d1730] hover:bg-[#f4f0ff] active:translate-y-px'
                  : 'cursor-not-allowed border-white/15 bg-white/25 text-white/45',
              )}
            >
              {copy.signIn}
              <LoginArrow />
            </button>
          </div>
        </motion.div>

        <p className="absolute bottom-8 text-[11px] tracking-wide text-white/70">
          {copy.property}
        </p>
      </div>

      <button
        type="button"
        onClick={restartSystem}
        className="absolute right-6 bottom-6 z-20 flex h-9 items-center gap-2 rounded-md border border-white/35 bg-white/90 px-3 text-[12px] font-semibold text-[#1d1730] shadow-sm hover:bg-white active:translate-y-px"
      >
        <RestartIcon />
        {strings.os.restartSystem}
      </button>

      {showDevTools ? (
        <div
          ref={desktopRef}
          className="pointer-events-none absolute inset-0 z-30"
        >
          <WindowManager desktopRef={desktopRef} os="host_os" />
        </div>
      ) : null}
    </div>
  )
}

function RestartIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M13.2 8A5.2 5.2 0 1 1 8 2.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8 1.2 10.4 3.4 8 5.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LoginArrow() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
      <path
        d="M2 6h7M6.5 3.2 9.7 6 6.5 8.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
