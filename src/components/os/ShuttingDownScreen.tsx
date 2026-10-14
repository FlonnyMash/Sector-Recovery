import { useEffect } from 'react'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'

const SHUTDOWN_MS = 2500

export function ShuttingDownScreen() {
  const setSystemStage = useGameStore((state) => state.setSystemStage)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSystemStage('black_screen')
    }, SHUTDOWN_MS)
    return () => window.clearTimeout(id)
  }, [setSystemStage])

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0a1628] text-white">
      <div className="relative mb-8 h-14 w-14">
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-white/20 border-t-white" />
        <div className="absolute inset-2 rounded-full border border-white/10" />
      </div>
      <div className="font-[Segoe_UI,Tahoma,sans-serif] text-[22px] tracking-wide text-white/90">
        {strings.shutdown.message}
      </div>
    </div>
  )
}
