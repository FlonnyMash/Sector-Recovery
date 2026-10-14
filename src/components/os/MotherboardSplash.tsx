import { useEffect } from 'react'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'

const AUTO_BOOT_MS = 5000

export function MotherboardSplash() {
  const setSystemStage = useGameStore((state) => state.setSystemStage)
  const bootFrom = useGameStore((state) => state.bootFrom)

  useEffect(() => {
    const autoBoot = window.setTimeout(() => {
      bootFrom('host_os')
    }, AUTO_BOOT_MS)

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'F1') return
      event.preventDefault()
      window.clearTimeout(autoBoot)
      setSystemStage('bios')
    }

    window.addEventListener('keydown', onKey, true)
    return () => {
      window.clearTimeout(autoBoot)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [bootFrom, setSystemStage])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black font-mono text-[15px] leading-relaxed text-[#c8c8c8]">
      <div className="flex items-start justify-between px-10 pt-8">
        <div>
          <div className="text-[28px] font-bold tracking-[0.18em] text-[#e8e8e8]">
            {strings.splash.vendor}
          </div>
          <div className="mt-1 text-[13px] tracking-[0.12em] text-[#8a8a8a] uppercase">
            {strings.splash.legal}
          </div>
        </div>
        <EnergyStarMark />
      </div>

      <div className="mt-10 space-y-1 px-10 text-[#b8b8b8]">
        <div>{strings.splash.biosLine}</div>
        <div className="pt-4">{strings.splash.cpu}</div>
        <div>{strings.splash.memory}</div>
        <div>{strings.splash.ramTest}</div>
        <div>{strings.splash.chipset}</div>
        <div className="pt-4">{strings.splash.detecting}</div>
      </div>

      <div className="absolute inset-x-0 bottom-8 text-center text-[14px] tracking-wide text-[#dcdcdc]">
        <span className="cursor-blink">{strings.splash.pressSetup}</span>
      </div>
    </div>
  )
}

function EnergyStarMark() {
  return (
    <div
      className="flex w-[132px] flex-col items-center border-[3px] border-[#3d9b4a] bg-[#0b1a10] px-2 py-2 text-center"
      aria-hidden="true"
    >
      <svg width="72" height="48" viewBox="0 0 72 48" fill="none">
        <rect x="1" y="1" width="70" height="46" fill="#0d2a18" stroke="#3d9b4a" strokeWidth="2" />
        <path d="M18 34 L28 10 L36 26 L44 10 L54 34" stroke="#7CFF9A" strokeWidth="3" fill="none" />
        <circle cx="36" cy="30" r="5" fill="#f0c14a" />
      </svg>
      <div className="mt-1 text-[9px] font-bold tracking-[0.16em] text-[#7CFF9A]">
        {strings.splash.energyStar}
      </div>
    </div>
  )
}
