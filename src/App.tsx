import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { BiosScreen } from './components/os/BiosScreen'
import { BootScreen } from './components/os/BootScreen'
import { Desktop } from './components/os/Desktop'
import { HostLoginScreen } from './components/os/HostLoginScreen'
import { LoginScreen } from './components/os/LoginScreen'
import { MotherboardSplash } from './components/os/MotherboardSplash'
import { ShuttingDownScreen } from './components/os/ShuttingDownScreen'
import { useGameStore } from './store/useGameStore'
import type { OsEnvironment, SystemStage } from './types/game'
import {
  isClickFeedbackTarget,
  playClickSound,
  playPowerOnSound,
  playStartupSound,
} from './utils/sounds'

const BLACK_SCREEN_MS = 3500
/** POST beep lands partway through the black screen, like a real board. */
const POST_BEEP_DELAY_MS = 1400

/** Stages where UI clicks should give audible feedback. */
function isClickFeedbackStage(stage: SystemStage) {
  return (
    stage === 'host_os' ||
    stage === 'host_login' ||
    stage === 'target_os' ||
    stage === 'legacy_login'
  )
}

function isDesktopStage(stage: SystemStage): stage is OsEnvironment {
  return stage === 'host_os' || stage === 'target_os'
}

const FADE = { duration: 0.28 }
const CUT = { duration: 0 }

function stageTransition(stage: SystemStage) {
  if (stage === 'black_screen' || stage === 'motherboard_splash') return CUT
  if (stage === 'shutting_down') return { duration: 0.45 }
  return FADE
}

function StageView({ stage }: { stage: SystemStage }) {
  switch (stage) {
    case 'shutting_down':
      return <ShuttingDownScreen />
    case 'black_screen':
      return <div className="h-screen w-screen bg-black" />
    case 'motherboard_splash':
      return <MotherboardSplash />
    case 'bios':
      return <BiosScreen />
    case 'booting':
      return <BootScreen />
    case 'legacy_login':
      return <LoginScreen />
    case 'host_login':
      return <HostLoginScreen />
    default:
      return <Desktop />
  }
}

function App() {
  const systemStage = useGameStore((state) => state.systemStage)
  const setSystemStage = useGameStore((state) => state.setSystemStage)
  const tick = useGameStore((state) => state.tick)
  const fragmentsPerSecond = useGameStore((state) => state.fragmentsPerSecond)
  const startMomNudgeClock = useGameStore((state) => state.startMomNudgeClock)
  const pauseMomNudgeClock = useGameStore((state) => state.pauseMomNudgeClock)

  useEffect(() => {
    if (fragmentsPerSecond <= 0) return
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      const delta = (now - last) / 1000
      last = now
      tick(delta)
    }, 100)

    return () => window.clearInterval(id)
  }, [fragmentsPerSecond, tick])

  // Stage-transition sounds. Only real transitions play (not the initial
  // mount, and not StrictMode's duplicate effect run for the same stage).
  const previousStageRef = useRef<SystemStage | null>(null)
  useEffect(() => {
    const previous = previousStageRef.current
    previousStageRef.current = systemStage
    if (previous === null || previous === systemStage) return

    if (isDesktopStage(systemStage) && !isDesktopStage(previous)) {
      playStartupSound(systemStage)
    }
  }, [systemStage])

  // Global click feedback. Read the stage at event time so the listener
  // binds once.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      if (!isClickFeedbackStage(useGameStore.getState().systemStage)) return
      if (!isClickFeedbackTarget(event.target)) return
      playClickSound()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [])

  useEffect(() => {
    if (systemStage !== 'black_screen') return
    const beep = window.setTimeout(() => playPowerOnSound(), POST_BEEP_DELAY_MS)
    const id = window.setTimeout(() => {
      setSystemStage('motherboard_splash')
    }, BLACK_SCREEN_MS)
    return () => {
      window.clearTimeout(beep)
      window.clearTimeout(id)
    }
  }, [systemStage, setSystemStage])

  useEffect(() => {
    document.body.classList.toggle(
      'cursor-modern',
      systemStage === 'host_os' || systemStage === 'host_login',
    )
    return () => {
      document.body.classList.remove('cursor-modern')
    }
  }, [systemStage])

  useEffect(() => {
    if (systemStage !== 'host_os') {
      pauseMomNudgeClock()
      return
    }
    startMomNudgeClock()
    return () => pauseMomNudgeClock()
  }, [systemStage, startMomNudgeClock, pauseMomNudgeClock])

  const transition = stageTransition(systemStage)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={systemStage}
        className="h-screen w-screen"
        initial={{ opacity: transition.duration === 0 ? 1 : 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: transition.duration === 0 ? 1 : 0 }}
        transition={transition}
      >
        <StageView stage={systemStage} />
      </motion.div>
    </AnimatePresence>
  )
}

export default App
