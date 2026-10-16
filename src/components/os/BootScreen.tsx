import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'

const BOOT_MS = 2500

export function BootScreen() {
  const bootTarget = useGameStore((state) => state.bootTarget)
  const finishBoot = useGameStore((state) => state.finishBoot)
  const [phase, setPhase] = useState<'starting' | 'loading'>('starting')

  useEffect(() => {
    const swap = window.setTimeout(() => setPhase('loading'), 1100)
    const done = window.setTimeout(() => finishBoot(), BOOT_MS)
    return () => {
      window.clearTimeout(swap)
      window.clearTimeout(done)
    }
  }, [finishBoot])

  const subtitle =
    phase === 'starting'
      ? strings.boot.starting
      : bootTarget === 'target_os'
        ? strings.boot.loadingRecovery
        : strings.boot.startingHost

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0b0b0b] text-white">
      <motion.div
        className="relative mb-10 h-32 w-32"
        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,#9ad4ff,transparent_55%),radial-gradient(circle_at_70%_70%,#3d7ab5,#10233a)] shadow-[0_0_40px_rgba(90,180,255,0.45)]" />
        <div className="absolute inset-3 rounded-full border border-white/30" />
      </motion.div>
      <div className="mb-4 h-[8px] w-[290px] overflow-hidden rounded-sm bg-[#1a1a1a]">
        <motion.div
          className="h-full bg-gradient-to-r from-[#3d7ab5] via-[#9ad4ff] to-[#3d7ab5]"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <div className="font-[Segoe_UI,Tahoma,sans-serif] text-[21px] tracking-wide">{subtitle}</div>
    </div>
  )
}
