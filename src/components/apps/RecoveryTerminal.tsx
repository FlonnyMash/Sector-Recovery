import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import type { MouseEvent } from 'react'
import { UPGRADES, getUpgradeCost } from '../../game/upgrades'
import { useGameStore } from '../../store/useGameStore'
import { formatFragments, formatRate } from '../../utils/format'
import { cn } from '../../utils/cn'

interface Pop {
  id: number
  x: number
  y: number
}

export function RecoveryTerminal() {
  const fragments = useGameStore((state) => Math.floor(state.dataFragments))
  const rate = useGameStore((state) => state.fragmentsPerSecond)
  const upgrades = useGameStore((state) => state.upgrades)
  const extractSector = useGameStore((state) => state.extractSector)
  const purchaseUpgrade = useGameStore((state) => state.purchaseUpgrade)

  const [status, setStatus] = useState('Idle')
  const [progress, setProgress] = useState(0)
  const [pops, setPops] = useState<Pop[]>([])
  const [pulse, setPulse] = useState(0)

  const handleExtract = (event: MouseEvent<HTMLButtonElement>) => {
    extractSector()
    setStatus('Extracting…')
    setProgress(100)
    setPulse((value) => value + 1)

    const rect = event.currentTarget.getBoundingClientRect()
    const pop: Pop = {
      id: Date.now() + Math.random(),
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    setPops((current) => [...current, pop])

    window.setTimeout(() => {
      setStatus('Idle')
      setProgress(0)
    }, 180)
    window.setTimeout(() => {
      setPops((current) => current.filter((item) => item.id !== pop.id))
    }, 650)
  }

  return (
    <div className="flex h-full flex-col bg-[#f0f0f0] font-[Tahoma,'Segoe_UI',sans-serif] text-[12px] text-[#222]">
      <div className="border-b border-[#d0d0d0] bg-[#e8e8e8] px-3 py-1.5 text-[11px] text-[#555]">
        Drive: \\.\PhysicalDrive1 (2011-03-14) · File system: NTFS · Status: Mounted
      </div>

      <div className="grid flex-1 grid-cols-[1.1fr_0.9fr] gap-3 overflow-hidden p-3">
        <div className="flex min-h-0 flex-col gap-3">
          <fieldset className="win7-inset rounded-sm bg-[#e9e9e9] px-3 pb-3 pt-2">
            <legend className="px-1 text-[11px] font-bold text-[#003399]">Recovery Status</legend>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[11px] text-[#555]">Data Fragments</div>
                <div className="font-mono text-[28px] leading-none text-[#003399]">
                  {formatFragments(fragments)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[#555]">Throughput</div>
                <div className="font-mono text-[16px] text-[#1a1a1a]">
                  {formatRate(rate)} /sec
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-1 text-[11px] text-[#555]">Sector progress</div>
              <div className="win7-inset h-[18px] overflow-hidden bg-white">
                <div
                  className="h-full bg-[repeating-linear-gradient(45deg,#3ea74a_0_8px,#5fd36a_8px_16px)] transition-[width] duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </fieldset>

          <div className="relative flex flex-1 flex-col items-center justify-center rounded-sm bg-[#dcdcdc] win7-inset">
            <motion.button
              type="button"
              onClick={handleExtract}
              animate={{ scale: pulse === 0 ? 1 : [1, 0.96, 1] }}
              transition={{ duration: 0.18 }}
              className={cn(
                'win7-raised relative h-[72px] w-[220px] rounded-sm border border-[#6f6f6f] bg-gradient-to-b from-[#f8f8f8] to-[#d0d0d0]',
                'text-[15px] font-bold text-[#222] outline-none',
                'hover:from-[#fcfcfc] hover:to-[#d8d8d8]',
                'focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#3d7ab5]',
              )}
            >
              Extract Sector
              <AnimatePresence>
                {pops.map((pop) => (
                  <motion.span
                    key={pop.id}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -28 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="pointer-events-none absolute font-mono text-[13px] font-bold text-[#0a7a32]"
                    style={{ left: pop.x, top: pop.y }}
                  >
                    +1
                  </motion.span>
                ))}
              </AnimatePresence>
            </motion.button>
            <p className="mt-3 text-[11px] text-[#666]">Manual read · +1 data fragment</p>
          </div>
        </div>

        <fieldset className="flex min-h-0 flex-col rounded-sm bg-[#e9e9e9] px-3 pb-3 pt-2 win7-inset">
          <legend className="px-1 text-[11px] font-bold text-[#003399]">Automation</legend>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto pr-1">
            {UPGRADES.map((upgrade) => {
              const owned = upgrades[upgrade.id] ?? 0
              const cost = getUpgradeCost(upgrade.id, owned)
              const canAfford = fragments >= cost
              return (
                <div
                  key={upgrade.id}
                  className="rounded-sm border border-[#c3c3c3] bg-[#f7f7f7] p-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-[#1a1a1a]">{upgrade.name}</div>
                      <div className="mt-0.5 text-[11px] leading-snug text-[#555]">
                        {upgrade.description}
                      </div>
                    </div>
                    <div className="shrink-0 font-mono text-[11px] text-[#444]">x{owned}</div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[#333]">
                      Cost: {formatFragments(cost)}
                    </span>
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => purchaseUpgrade(upgrade.id)}
                      className={cn(
                        'win7-raised h-[22px] min-w-[78px] rounded-sm border border-[#6f6f6f] bg-gradient-to-b from-[#f7f7f7] to-[#d5d5d5] px-2',
                        canAfford ? 'text-[#222]' : 'cursor-not-allowed text-[#8a8a8a]',
                      )}
                    >
                      Purchase
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </fieldset>
      </div>

      <div className="flex h-[22px] items-center border-t border-[#b8b8b8] bg-[#e6e6e6] px-2 text-[11px] text-[#333]">
        <span>Status: {status}</span>
        <span className="ml-auto font-mono text-[#555]">SR-TERM/1.0.0</span>
      </div>
    </div>
  )
}
