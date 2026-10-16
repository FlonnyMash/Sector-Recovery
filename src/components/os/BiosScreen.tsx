import { useCallback, useEffect, useMemo, useState } from 'react'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'
import type { OsEnvironment } from '../../types/game'
import { cn } from '../../utils/cn'

type BootId = 'host' | 'optical' | 'image'

interface BootOption {
  id: BootId
  label: string
  disabled: boolean
  target?: OsEnvironment
}

function playBeep() {
  try {
    const audio = new AudioContext()
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.frequency.value = 420
    oscillator.type = 'square'
    gain.gain.value = 0.04
    oscillator.connect(gain)
    gain.connect(audio.destination)
    oscillator.start()
    oscillator.stop(audio.currentTime + 0.12)
    window.setTimeout(() => {
      void audio.close()
    }, 200)
  } catch {
    // Audio is optional.
  }
}

export function BiosScreen() {
  const downloaded = useGameStore((state) => state.prologue.isPartitionDownloaded)
  const bootFrom = useGameStore((state) => state.bootFrom)
  const [error, setError] = useState('')

  const options = useMemo<BootOption[]>(() => {
    const list: BootOption[] = [
      { id: 'host', label: strings.bios.option1, disabled: false, target: 'host_os' },
      { id: 'optical', label: strings.bios.option2, disabled: true },
    ]
    if (downloaded) {
      list.push({
        id: 'image',
        label: strings.bios.option3,
        disabled: false,
        target: 'target_os',
      })
    }
    return list
  }, [downloaded])

  const defaultId = downloaded ? 'image' : 'host'
  const [selectedId, setSelectedId] = useState<BootId>(defaultId)
  const resolvedId = options.some((option) => option.id === selectedId) ? selectedId : defaultId

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.id === resolvedId),
  )

  const activate = useCallback(
    (id: BootId) => {
      const option = options.find((item) => item.id === id)
      if (!option) return
      setSelectedId(option.id)
      if (option.disabled) {
        playBeep()
        setError(strings.bios.opticalError)
        return
      }
      setError('')
      if (option.target) bootFrom(option.target)
    },
    [bootFrom, options],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const delta = event.key === 'ArrowDown' ? 1 : -1
        const next = options[(selectedIndex + delta + options.length) % options.length]
        if (next) {
          setSelectedId(next.id)
          setError('')
        }
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        activate(resolvedId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activate, options, resolvedId, selectedIndex])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black font-mono text-[18px] text-[#33ff66]">
      <div className="bios-scanline pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex h-full max-w-[1200px] flex-col px-8 py-6">
        <div className="text-[#c8ffd4]">{strings.bios.vendor}</div>
        <div className="mb-4 text-[#7aa884]">{strings.bios.copyright}</div>
        <div>{strings.bios.cpu}</div>
        <div>{strings.bios.ramTest}</div>
        <div>{strings.bios.sata0}</div>
        <div>{strings.bios.sata1}</div>
        <div>{strings.bios.optical}</div>
        <div className={downloaded ? 'text-[#f0c14a]' : 'text-[#7aa884]'}>
          {downloaded ? strings.bios.virtualMounted : strings.bios.virtualMissing}
        </div>

        <div className="mt-8 mb-2 text-[#f0c14a]">{strings.bios.bootMenu}</div>
        <div className="space-y-1">
          {options.map((option) => {
            const active = option.id === resolvedId
            return (
              <button
                key={option.id}
                type="button"
                onMouseEnter={() => setSelectedId(option.id)}
                onClick={() => activate(option.id)}
                className={cn(
                  'block w-full px-2 py-0.5 text-left',
                  option.disabled && 'text-[#4a7a58]',
                  active && !option.disabled && 'bg-[#33ff66] text-black',
                  active && option.disabled && 'bg-[#145022] text-[#8aa884]',
                )}
              >
                {option.label}
                {active ? <span className="cursor-blink ml-2">_</span> : null}
              </button>
            )
          })}
        </div>

        {error ? <div className="mt-4 text-[#ff6b6b]">{error}</div> : null}

        <div className="mt-auto text-[#7aa884]">
          <div>{strings.bios.pressEnter}</div>
          <div>{strings.bios.hint}</div>
        </div>
      </div>
    </div>
  )
}
