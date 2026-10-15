import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { LOOT_NAMES } from '../../game/loot'
import type { RecoveredFileType } from '../../types/game'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'
import { cn } from '../../utils/cn'
import { formatDataSize, formatRate } from '../../utils/format'

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

function fileGlyph(type: RecoveredFileType): string {
  if (type === 'image') return '🖼'
  if (type === 'audio') return '♪'
  if (type === 'system') return '⚙'
  return '📄'
}

export function SectorRecover() {
  const fragments = useGameStore((state) => state.dataFragments)
  const rate = useGameStore((state) => state.fragmentsPerSecond)
  const inventory = useGameStore((state) => state.inventory)
  const scanSector = useGameStore((state) => state.scanSector)

  const [status, setStatus] = useState<string>(COPY.statusIdle)
  const [progress, setProgress] = useState(0)
  const [pops, setPops] = useState<Pop[]>([])
  const [pulse, setPulse] = useState(0)
  const [logs, setLogs] = useState<LogLine[]>([
    { id: 0, text: COPY.logIdle, kind: 'normal' },
  ])
  const logRef = useRef<HTMLDivElement>(null)
  const manualScanRef = useRef(false)

  useEffect(() => {
    const node = logRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [logs])

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
    const label = result.item ? result.item.name : `+${result.fragments} KB`
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
    if (result.item) {
      nextLines.push({
        id: Date.now() + Math.random() + 0.2,
        text: fillTemplate(result.isNew ? COPY.logFound : COPY.logDuplicate, {
          item: result.item.name,
        }),
        kind: result.isNew ? 'found' : 'skip',
      })
    } else {
      nextLines.push({
        id: Date.now() + Math.random() + 0.2,
        text: fillTemplate(COPY.logRecovered, { size: formatDataSize(result.fragments) }),
        kind: 'normal',
      })
    }
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
    <div className="flex h-full flex-col bg-[#f0f0f0] font-[Tahoma,'Segoe_UI',sans-serif] text-[12px] text-[#222]">
      <div className="border-b border-[#d0d0d0] bg-gradient-to-b from-[#e8e8e8] to-[#d8d8d8] px-3 py-1.5 text-[11px] text-[#555]">
        {COPY.drive}
      </div>

      <div className="grid flex-1 grid-cols-[1.15fr_0.85fr] gap-3 overflow-hidden p-3">
        <div className="flex min-h-0 flex-col gap-3">
          <fieldset className="win7-inset rounded-sm bg-[#e9e9e9] px-3 pb-3 pt-2">
            <legend className="px-1 text-[11px] font-bold text-[#003399]">{COPY.recoveredData}</legend>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[11px] text-[#555]">{COPY.recoveredData}</div>
                <div className="font-mono text-[28px] leading-none text-[#003399]">
                  {formatDataSize(fragments)}
                </div>
                {fragments >= 1024 ? (
                  <div className="mt-1 font-mono text-[11px] text-[#666]">
                    {Math.floor(fragments).toLocaleString()} KB
                  </div>
                ) : null}
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[#555]">{COPY.throughput}</div>
                <div className="font-mono text-[16px] text-[#1a1a1a]">
                  {formatRate(rate)} {COPY.perSec}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-1 text-[11px] text-[#555]">{COPY.sectorProgress}</div>
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
              onClick={handleScan}
              animate={{ scale: pulse === 0 ? 1 : [1, 0.96, 1] }}
              transition={{ duration: 0.18 }}
              className={cn(
                'win7-raised relative h-[72px] w-[220px] rounded-sm border border-[#6f6f6f] bg-gradient-to-b from-[#f8f8f8] to-[#d0d0d0]',
                'text-[15px] font-bold text-[#222] outline-none',
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
                    className="pointer-events-none absolute font-mono text-[13px] font-bold text-[#0a7a32]"
                    style={{ left: pop.x, top: pop.y }}
                  >
                    {pop.label}
                  </motion.span>
                ))}
              </AnimatePresence>
            </motion.button>
            <p className="mt-3 text-[11px] text-[#666]">{COPY.scanHint}</p>
          </div>

          <div
            ref={logRef}
            className="h-[120px] overflow-auto rounded-sm border border-[#1a1a1a] bg-[#06140c] px-2 py-1 font-mono text-[11px] leading-relaxed text-[#7CFF9A]"
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

        <fieldset className="flex min-h-0 flex-col rounded-sm bg-[#e9e9e9] px-3 pb-3 pt-2 win7-inset">
          <legend className="px-1 text-[11px] font-bold text-[#003399]">
            {COPY.recoveredFiles} · {inventory.length} / {LOOT_NAMES.length}
          </legend>
          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-auto pr-1">
            {inventory.length === 0 ? (
              <p className="text-[11px] leading-snug text-[#666]">{COPY.emptyInventory}</p>
            ) : (
              inventory.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 rounded-sm border border-[#c3c3c3] bg-[#f7f7f7] px-2 py-1.5"
                >
                  <span className="text-[14px]" aria-hidden="true">
                    {fileGlyph(file.type)}
                  </span>
                  <span className="font-mono text-[11px] text-[#1a1a1a]">{file.name}</span>
                </div>
              ))
            )}
          </div>
        </fieldset>
      </div>

      <div className="flex h-[22px] items-center border-t border-[#b8b8b8] bg-[#e6e6e6] px-2 text-[11px] text-[#333]">
        <span>Status: {status}</span>
        <span className="ml-auto font-mono text-[#555]">{COPY.version}</span>
      </div>
    </div>
  )
}
