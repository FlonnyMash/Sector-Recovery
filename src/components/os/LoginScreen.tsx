import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'
import { cn } from '../../utils/cn'
import { OsWallpaper } from './OsWallpaper'

const UNLOCK_MS = 2600
const UNLOCK_SWAP_MS = 1200
const BYPASS_COMMAND = 'bypass --mount-ghost'

const SECTOR_CYCLE = ['0x00', '0x3C', '0xA7', '0xFF'] as const
type SectorHex = (typeof SECTOR_CYCLE)[number]
type SectorIndex = 0 | 1 | 2

const INITIAL_SECTORS: [SectorHex, SectorHex, SectorHex] = ['0x00', '0x3C', '0xA7']

interface ConsoleLine {
  kind: 'echo' | 'output' | 'error'
  text: string
}

export function LoginScreen() {
  const unlockLegacyOS = useGameStore((state) => state.unlockLegacyOS)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [unlockPhase, setUnlockPhase] = useState<'override' | 'mount'>('override')
  const [sectors, setSectors] = useState<[SectorHex, SectorHex, SectorHex]>(INITIAL_SECTORS)
  const [sectorsRevealed, setSectorsRevealed] = useState(false)
  const [command, setCommand] = useState('')
  const [history, setHistory] = useState<ConsoleLine[]>([])

  const unlockingRef = useRef(false)

  const openOverlay = useCallback(() => {
    if (unlockingRef.current) return
    setOverlayOpen(true)
  }, [])

  const startUnlock = useCallback(() => {
    if (unlockingRef.current) return
    unlockingRef.current = true
    setOverlayOpen(true)
    setUnlocking(true)
    setUnlockPhase('override')
  }, [])

  useEffect(() => {
    if (!unlocking) return
    const swap = window.setTimeout(() => setUnlockPhase('mount'), UNLOCK_SWAP_MS)
    const done = window.setTimeout(() => unlockLegacyOS(), UNLOCK_MS)
    return () => {
      window.clearTimeout(swap)
      window.clearTimeout(done)
    }
  }, [unlocking, unlockLegacyOS])

  useEffect(() => {
    if (!sectorsRevealed || unlocking || sectors.some((value) => value !== '0xFF')) return
    const id = window.setTimeout(() => startUnlock(), 350)
    return () => window.clearTimeout(id)
  }, [sectors, sectorsRevealed, unlocking, startUnlock])

  function cycleSector(index: SectorIndex) {
    if (unlocking) return
    setSectors((current) => {
      const next = [...current] as [SectorHex, SectorHex, SectorHex]
      const step = SECTOR_CYCLE.indexOf(current[index])
      next[index] = SECTOR_CYCLE[(step + 1) % SECTOR_CYCLE.length]
      return next
    })
  }

  function runCommand() {
    if (unlocking) return
    const typed = command.trim()
    if (!typed) return
    const echo: ConsoleLine = { kind: 'echo', text: typed }
    if (typed.toLowerCase() === BYPASS_COMMAND) {
      const next: ConsoleLine[] = sectorsRevealed
        ? [echo, { kind: 'output', text: strings.login.alreadyArmed }]
        : [
            echo,
            { kind: 'output', text: strings.login.mountArmed },
            { kind: 'output', text: strings.login.hintSectors },
          ]
      setHistory((lines) => [...lines, ...next])
      setSectorsRevealed(true)
    } else {
      setHistory((lines) => [
        ...lines,
        echo,
        { kind: 'error', text: strings.login.unknownCommand.replace('{cmd}', typed) },
      ])
    }
    setCommand('')
  }

  const copy = strings.login

  return (
    <div className="os-chrome relative h-screen w-screen overflow-hidden font-['Segoe_UI',Tahoma,sans-serif] text-white">
      <OsWallpaper host={false} />
      <div className="absolute inset-0 bg-black/15" />

      <div className="pointer-events-none absolute top-4 right-5 max-w-[min(92vw,480px)] text-right font-mono text-[10px] tracking-wide text-white/70">
        <motion.div
          animate={{ opacity: [0.4, 0.9, 0.55, 0.9] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {copy.kernelBanner}
        </motion.div>
      </div>

      <div className="relative z-10 flex h-full items-center justify-center px-6 pb-10">
        <BrokenProfileStack onOpenYuka={openOverlay} />
      </div>

      <AnimatePresence>
        {overlayOpen ? (
          <KernelConsole
            unlocking={unlocking}
            unlockPhase={unlockPhase}
            sectors={sectors}
            sectorsRevealed={sectorsRevealed}
            command={command}
            history={history}
            onClose={() => {
              if (!unlocking) setOverlayOpen(false)
            }}
            onCycle={cycleSector}
            onCommandChange={setCommand}
            onRunCommand={runCommand}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function BrokenProfileStack({ onOpenYuka }: { onOpenYuka: () => void }) {
  const copy = strings.login
  return (
    <div className="relative h-[168px] w-[300px]">
      <div
        className="absolute top-6 left-0 w-[150px] -rotate-[11deg] opacity-55 grayscale"
        style={{ clipPath: 'polygon(0 8%, 92% 0, 100% 78%, 4% 100%)' }}
      >
        <div className="flex items-start gap-2">
          <Win7Portrait muted>
            <TaroPortrait />
          </Win7Portrait>
          <div className="pt-1">
            <div className="text-[13px] font-semibold [text-shadow:0_1px_2px_rgba(0,0,0,0.75)]">
              {copy.taroName}
            </div>
            <div className="font-mono text-[11px] font-bold tracking-wide text-[#ff6b6b]">
              {copy.taroError}
            </div>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute top-2 left-8 w-[160px] rotate-[7deg] opacity-30"
        style={{ clipPath: 'inset(12% 0 18% 22%)' }}
      >
        <Win7Portrait>
          <YukaPortrait />
        </Win7Portrait>
      </div>

      <button
        type="button"
        onClick={onOpenYuka}
        className="absolute top-0 left-[52px] flex items-start gap-2 rotate-[2deg] text-left hover:brightness-110"
      >
        <Win7Portrait>
          <YukaPortrait />
        </Win7Portrait>
        <div className="pt-1">
          <div className="text-[16px] font-semibold [text-shadow:0_1px_3px_rgba(0,0,0,0.65)]">
            {copy.yukaName}
          </div>
          <div className="text-[11px] text-white/80">({copy.yukaRole})</div>
          <div className="mt-1 font-mono text-[10px] tracking-wide text-[#ffd37a] [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">
            {copy.yukaStatus}
          </div>
        </div>
      </button>
    </div>
  )
}

function Win7Portrait({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <div
      className={cn(
        'h-[72px] w-[72px] shrink-0 overflow-hidden rounded-sm border-[3px] shadow-[0_3px_10px_rgba(0,0,0,0.45)]',
        muted ? 'border-white/40' : 'border-white/85',
      )}
    >
      {children}
    </div>
  )
}

function YukaPortrait() {
  return (
    <svg viewBox="0 0 72 72" className="h-full w-full" aria-hidden="true">
      <rect width="72" height="72" fill="#1b4458" />
      <rect width="72" height="72" fill="url(#yukaGlow)" />
      <circle cx="36" cy="28" r="11" fill="#cfe3ea" />
      <path d="M18 72 V52 C18 42 24 36 36 36 C48 36 54 42 54 52 V72 Z" fill="#2a6a7a" />
      <path d="M25 27 C28 18 44 18 47 28 C42 24 30 24 25 27 Z" fill="#8eb8c4" />
      <ellipse cx="32.5" cy="27" rx="1.6" ry="1.2" fill="#1a3340" />
      <ellipse cx="40.5" cy="27" rx="1.6" ry="1.2" fill="#1a3340" />
      <path d="M33 32.5 C35 34 38 34 40 32.5" stroke="#6a8a94" strokeWidth="1" fill="none" />
      <g opacity="0.28">
        {Array.from({ length: 12 }, (_, line) => (
          <rect key={line} x="0" y={line * 6} width="72" height="2" fill="#9fd4e4" />
        ))}
      </g>
      <defs>
        <radialGradient id="yukaGlow" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#4ea0b4" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0c2a38" stopOpacity="0.9" />
        </radialGradient>
      </defs>
    </svg>
  )
}

function TaroPortrait() {
  return (
    <svg viewBox="0 0 72 72" className="h-full w-full" aria-hidden="true">
      <rect width="72" height="72" fill="#3a3f46" />
      <circle cx="36" cy="28" r="11" fill="#9aa3ad" />
      <path d="M16 72 V54 C16 44 24 38 36 38 C48 38 56 44 56 54 V72 Z" fill="#5a6270" />
      <path d="M22 36 L50 36 L46 28 L26 28 Z" fill="#6d7580" />
    </svg>
  )
}

function KernelConsole({
  unlocking,
  unlockPhase,
  sectors,
  sectorsRevealed,
  command,
  history,
  onClose,
  onCycle,
  onCommandChange,
  onRunCommand,
}: {
  unlocking: boolean
  unlockPhase: 'override' | 'mount'
  sectors: [SectorHex, SectorHex, SectorHex]
  sectorsRevealed: boolean
  command: string
  history: ConsoleLine[]
  onClose: () => void
  onCycle: (index: SectorIndex) => void
  onCommandChange: (value: string) => void
  onRunCommand: () => void
}) {
  const copy = strings.login
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!unlocking) inputRef.current?.focus()
  }, [unlocking, sectorsRevealed, history.length])

  useEffect(() => {
    const node = scrollerRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [history, sectorsRevealed, unlocking, unlockPhase])

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={() => inputRef.current?.focus()}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="w-full max-w-[560px] overflow-hidden rounded-t-[3px] border border-[#9ab4c8] shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex h-[30px] items-center bg-gradient-to-r from-[#1d4f86] to-[#3d8ad0] px-2 text-[12px] font-semibold text-white">
          <span className="truncate">{copy.cmdTitle}</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-[20px] w-[42px] items-center justify-center bg-[#c75050] text-[11px] font-bold hover:bg-[#e04343]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div
          ref={scrollerRef}
          className="h-[340px] cursor-default overflow-auto bg-[#0c0c0c] p-2 font-['Lucida_Console',Consolas,monospace] text-[13px] leading-[18px] text-[#c8c8c8]"
          onMouseDown={() => inputRef.current?.focus()}
        >
          {copy.taroNote.map((line) => (
            <div key={line}>{line}</div>
          ))}
          <div className="mt-2">{copy.hintBefore}</div>
          <pre className="my-1 w-max text-[#e8e8e8]">
            {`┌──────────────────────┐
│ ${copy.hintCommand} │
└──────────────────────┘`}
          </pre>
          <div className="mt-3" />

          {history.map((line, index) =>
            line.kind === 'echo' ? (
              <div key={`${line.text}-${index}`}>
                {copy.prompt} {line.text}
              </div>
            ) : (
              <div
                key={`${line.text}-${index}`}
                className={cn(
                  'whitespace-pre-wrap',
                  line.kind === 'error' && 'text-[#ff6b6b]',
                )}
              >
                {line.text}
              </div>
            ),
          )}

          {sectorsRevealed && !unlocking ? (
            <div className="mt-2 space-y-0.5">
              {sectors.map((value, index) => (
                <SectorRow
                  key={index}
                  label={copy.sectorLabel.replace('{n}', String(index))}
                  value={value}
                  onClick={() => onCycle(index as SectorIndex)}
                />
              ))}
            </div>
          ) : null}

          {unlocking ? (
            <div className="mt-3">
              <div>{unlockPhase === 'override' ? copy.unlockingOverride : copy.unlockingMount}</div>
              <div className="mt-1 h-[10px] w-[280px] border border-[#6a6a6a] bg-[#1a1a1a]">
                <motion.div
                  className="h-full bg-[#c8c8c8]"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: UNLOCK_MS / 1000, ease: 'linear' }}
                />
              </div>
            </div>
          ) : (
            <form
              className="relative"
              onSubmit={(event) => {
                event.preventDefault()
                onRunCommand()
              }}
            >
              <div className="pointer-events-none whitespace-pre">
                {copy.prompt} {command}
                <span className="cursor-blink">_</span>
              </div>
              <input
                ref={inputRef}
                value={command}
                onChange={(event) => onCommandChange(event.target.value)}
                spellCheck={false}
                autoComplete="off"
                aria-label={copy.prompt}
                className="absolute inset-0 cursor-default border-0 bg-transparent text-transparent caret-transparent outline-none"
              />
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function SectorRow({
  label,
  value,
  onClick,
}: {
  label: string
  value: SectorHex
  onClick: () => void
}) {
  const synced = value === '0xFF'
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'block w-full text-left font-["Lucida_Console",Consolas,monospace] text-[13px]',
        synced ? 'text-[#5dff7a]' : 'text-[#c8c8c8] hover:bg-white/10',
      )}
    >
      {label} {value}
      {synced ? ` ${strings.login.synced}` : ''}
    </button>
  )
}
