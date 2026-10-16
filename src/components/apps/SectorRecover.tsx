import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { UPGRADES, getUpgradeCost } from '../../game/upgrades'
import type { UpgradeId } from '../../game/upgrades'
import { VIRTUAL_FILE_COUNT } from '../../game/virtualFiles'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'
import { cn } from '../../utils/cn'
import { formatDataSize, formatRate } from '../../utils/format'
import { RetroIcon, fileTypeIcon, type RetroIconName } from '../os/retroIcons'

const COPY = strings.sectorRecover
const MAX_LOG_LINES = 80

interface Pop {
  id: number
  x: number
  y: number
  label: string
}

interface LogLine {
  id: number
  text: string
  kind: 'normal' | 'found' | 'skip'
}

function hexBlock(digits: number): string {
  const value = Math.floor(Math.random() * 16 ** digits)
  return `0x${value.toString(16).toUpperCase().padStart(digits, '0')}`
}

function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '')
}

export function SectorRecover() {
  const fragments = useGameStore((state) => state.dataFragments)
  const rate = useGameStore((state) => state.fragmentsPerSecond)
  const files = useGameStore((state) => state.files)
  const upgrades = useGameStore((state) => state.upgrades)
  const purchaseUpgrade = useGameStore((state) => state.purchaseUpgrade)
  const scanSector = useGameStore((state) => state.scanSector)
  const openFileLocation = useGameStore((state) => state.openFileLocation)
  const recoveredFiles = files.filter((file) => file.isUnlocked)
  const [rightTab, setRightTab] = useState<'files' | 'addons'>('files')

  const [status, setStatus] = useState<string>(COPY.statusIdle)
  const [progress, setProgress] = useState(0)
  const [pops, setPops] = useState<Pop[]>([])
  const [pulse, setPulse] = useState(0)
  const [logs, setLogs] = useState<LogLine[]>([
    { id: 0, text: COPY.logIdle, kind: 'normal' },
  ])
  const logRef = useRef<HTMLDivElement>(null)
  const manualScanRef = useRef(false)
  const seenUnlockedRef = useRef<Set<string> | null>(null)

  useEffect(() => {
    const node = logRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [logs])

  useEffect(() => {
    const unlocked = files.filter((file) => file.isUnlocked)
    if (seenUnlockedRef.current === null) {
      seenUnlockedRef.current = new Set(unlocked.map((file) => file.id))
      return
    }
    const fresh = unlocked.filter((file) => !seenUnlockedRef.current?.has(file.id))
    seenUnlockedRef.current = new Set(unlocked.map((file) => file.id))
    if (fresh.length === 0) return
    setLogs((current) =>
      [
        ...current,
        ...fresh.map((file) => ({
          id: Date.now() + Math.random(),
          text: fillTemplate(COPY.logFound, { item: file.name }),
          kind: 'found' as const,
        })),
      ].slice(-MAX_LOG_LINES),
    )
  }, [files])

  useEffect(() => {
    if (rate <= 0) return
    const intervalMs = Math.max(250, Math.min(1000, Math.round(1000 / Math.max(rate, 1))))
    const id = window.setInterval(() => {
      if (manualScanRef.current) return
      const gained = rate * (intervalMs / 1000)
      setStatus(COPY.statusAuto)
      setProgress(100)
      setLogs((current) =>
        [
          ...current,
          {
            id: Date.now() + Math.random(),
            text: fillTemplate(COPY.logAuto, {
              block: hexBlock(4),
              size: formatDataSize(gained),
            }),
            kind: 'normal' as const,
          },
        ].slice(-MAX_LOG_LINES),
      )
      window.setTimeout(() => {
        if (manualScanRef.current) return
        setStatus(COPY.statusIdle)
        setProgress(0)
      }, 180)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [rate])

  const handleScan = (event: MouseEvent<HTMLButtonElement>) => {
    manualScanRef.current = true
    const result = scanSector()
    setStatus(COPY.statusScanning)
    setProgress(100)
    setPulse((value) => value + 1)

    const rect = event.currentTarget.getBoundingClientRect()
    const found = result.unlockedFiles[0]
    const label = found ? found.name : `+${result.fragments} KB`
    const pop: Pop = {
      id: Date.now() + Math.random(),
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      label,
    }
    setPops((current) => [...current, pop])

    const nextLines: LogLine[] = [
      {
        id: Date.now() + Math.random(),
        text: fillTemplate(COPY.logScan, { block: hexBlock(4) }),
        kind: 'normal',
      },
    ]
    if (Math.random() < 0.35) {
      nextLines.push({
        id: Date.now() + Math.random() + 0.1,
        text: fillTemplate(COPY.logRetry, { cluster: hexBlock(4) }),
        kind: 'normal',
      })
    }
    nextLines.push({
      id: Date.now() + Math.random() + 0.2,
      text: fillTemplate(COPY.logRecovered, { size: formatDataSize(result.fragments) }),
      kind: 'normal',
    })
    setLogs((current) => [...current, ...nextLines].slice(-MAX_LOG_LINES))

    window.setTimeout(() => {
      manualScanRef.current = false
      setStatus(COPY.statusIdle)
      setProgress(0)
    }, 180)
    window.setTimeout(() => {
      setPops((current) => current.filter((item) => item.id !== pop.id))
    }, 650)
  }

  return (
    <div className="flex h-full flex-col bg-[#f0f0f0] font-[Tahoma,'Segoe_UI',sans-serif] text-[16px] text-[#222]">
      <div className="border-b border-[#d0d0d0] bg-gradient-to-b from-[#e8e8e8] to-[#d8d8d8] px-3 py-1.5 text-[14px] text-[#555]">
        {COPY.drive}
      </div>

      <div className="grid flex-1 grid-cols-[1.15fr_0.85fr] gap-3 overflow-hidden p-3">
        <div className="flex min-h-0 flex-col gap-3">
          <fieldset className="classic-fieldset bg-[#e9e9e9] px-3 pb-3">
            <legend className="text-[14px] font-bold text-[#003399]">{COPY.recoveredData}</legend>
            <div className="flex items-end justify-between">
              <div>
                <div className="font-mono text-[36px] leading-none text-[#003399]">
                  {formatDataSize(fragments)}
                </div>
                {fragments >= 1024 ? (
                  <div className="mt-1 font-mono text-[14px] text-[#666]">
                    {Math.floor(fragments).toLocaleString()} KB
                  </div>
                ) : null}
              </div>
              <div className="text-right">
                <div className="text-[14px] text-[#555]">{COPY.throughput}</div>
                <div className="font-mono text-[21px] text-[#1a1a1a]">
                  {formatRate(rate)} {COPY.perSec}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-1 text-[14px] text-[#555]">{COPY.sectorProgress}</div>
              <div className="win7-inset h-[24px] overflow-hidden bg-white">
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
              onClick={handleScan}
              animate={{ scale: pulse === 0 ? 1 : [1, 0.96, 1] }}
              transition={{ duration: 0.18 }}
              className={cn(
                'win7-raised relative h-[94px] w-[290px] rounded-sm border border-[#6f6f6f] bg-gradient-to-b from-[#f8f8f8] to-[#d0d0d0]',
                'text-[20px] font-bold text-[#222] outline-none',
                'hover:from-[#fcfcfc] hover:to-[#d8d8d8]',
                'focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#3d7ab5]',
              )}
            >
              {COPY.scanSector}
              <AnimatePresence>
                {pops.map((pop) => (
                  <motion.span
                    key={pop.id}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -28 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="pointer-events-none absolute font-mono text-[17px] font-bold text-[#0a7a32]"
                    style={{ left: pop.x, top: pop.y }}
                  >
                    {pop.label}
                  </motion.span>
                ))}
              </AnimatePresence>
            </motion.button>
            <p className="mt-3 text-[14px] text-[#666]">{COPY.scanHint}</p>
          </div>

          <div
            ref={logRef}
            className="h-[160px] overflow-auto rounded-sm border border-[#1a1a1a] bg-[#06140c] px-2 py-1 font-mono text-[14px] leading-relaxed text-[#7CFF9A]"
          >
            {logs.map((line) => (
              <div
                key={line.id}
                className={cn(
                  line.kind === 'found' && 'font-bold text-[#ffe08a]',
                  line.kind === 'skip' && 'text-[#8aa48c]',
                )}
              >
                {line.text}
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="flex items-end gap-px px-1">
            <button
              type="button"
              onClick={() => setRightTab('files')}
              className={cn(
                'px-2 py-0.5 text-[14px] text-black',
                rightTab === 'files' ? 'classic-tab-active font-bold' : 'classic-tab',
              )}
            >
              {COPY.tabFiles} ({recoveredFiles.length}/{VIRTUAL_FILE_COUNT})
            </button>
            <button
              type="button"
              onClick={() => setRightTab('addons')}
              className={cn(
                'px-2 py-0.5 text-[14px] text-black',
                rightTab === 'addons' ? 'classic-tab-active font-bold' : 'classic-tab',
              )}
            >
              {COPY.tabAddons}
            </button>
          </div>
          <div className="classic-tab-page flex min-h-0 flex-1 flex-col bg-[#e9e9e9] px-2 py-2">
          {rightTab === 'files' ? (
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-auto pr-1">
              {recoveredFiles.length === 0 ? (
                <p className="text-[14px] leading-snug text-[#666]">{COPY.emptyInventory}</p>
              ) : (
                recoveredFiles.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => openFileLocation(file.id)}
                    className="flex items-center gap-2 rounded-sm border border-[#c3c3c3] bg-[#f7f7f7] px-2 py-1.5 text-left hover:border-[#7eb6e0] hover:bg-[#f0f6fb]"
                  >
                    <RetroIcon name={fileTypeIcon(file.type)} size={20} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[14px] text-[#1a1a1a]">{file.name}</span>
                      <span className="block truncate font-mono text-[13px] text-[#666]">{file.path}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto pr-1">
              <div className="flex items-center justify-between text-[14px] text-[#555]">
                <span>{COPY.balance}</span>
                <span className="font-mono font-bold text-[#003399]">{formatDataSize(fragments)}</span>
              </div>
              {UPGRADES.map((upgrade) => {
                const owned = upgrades[upgrade.id] ?? 0
                const cost = getUpgradeCost(upgrade.id, owned)
                const canAfford = fragments >= cost
                return (
                  <AddonRow
                    key={upgrade.id}
                    icon={upgrade.icon}
                    name={upgrade.name}
                    description={upgrade.description}
                    cost={cost}
                    owned={owned}
                    canAfford={canAfford}
                    onPurchase={() => purchaseUpgrade(upgrade.id as UpgradeId)}
                  />
                )
              })}
            </div>
          )}
          </div>
        </div>
      </div>

      <div className="flex h-[28px] items-center border-t border-[#b8b8b8] bg-[#e6e6e6] px-2 text-[14px] text-[#333]">
        <span>Status: {status}</span>
        <span className="ml-auto font-mono text-[#555]">{COPY.version}</span>
      </div>
    </div>
  )
}

function AddonRow({
  icon,
  name,
  description,
  cost,
  owned,
  canAfford,
  onPurchase,
}: {
  icon: RetroIconName
  name: string
  description: string
  cost: number
  owned: number
  canAfford: boolean
  onPurchase: () => void
}) {
  return (
    <div className="rounded-sm border border-[#c3c3c3] bg-[#f7f7f7] p-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <RetroIcon name={icon} size={32} className="mt-0.5" />
          <div className="min-w-0">
            <div className="font-bold text-[#1a1a1a]">{name}</div>
            <div className="mt-0.5 text-[14px] leading-snug text-[#555]">{description}</div>
          </div>
        </div>
        <div className="shrink-0 font-mono text-[14px] text-[#444]">
          {COPY.owned} x{owned}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[14px] text-[#333]">
          {COPY.cost}: {formatDataSize(cost)}
        </span>
        <button
          type="button"
          disabled={!canAfford}
          title={canAfford ? COPY.purchase : COPY.cannotAfford}
          onClick={onPurchase}
          className={cn(
            'win7-raised h-[28px] min-w-[112px] rounded-sm border border-[#6f6f6f] bg-gradient-to-b from-[#f7f7f7] to-[#d5d5d5] px-2 text-[14px]',
            canAfford ? 'text-[#222]' : 'cursor-not-allowed text-[#8a8a8a]',
          )}
        >
          {COPY.purchase}
        </button>
      </div>
    </div>
  )
}
