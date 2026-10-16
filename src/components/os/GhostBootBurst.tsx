import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { strings } from '../../i18n'

const OPEN_STAGGER_MS = [180, 420, 680]
const LIFETIME_MS = 1000
const WINDOW_COUNT = 3
const LINE_MS = 48
const STACK_LEFT = 28
const STACK_TOP = 22
const STACK_STEP = 26

interface BurstWindow {
  id: string
  title: string
  top: string
  left: string
  width: number
  height: number
  z: number
  lifetime: number
}

function randomHex(bytes: number): string {
  return Array.from({ length: bytes }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase(),
  ).join(' ')
}

function nextLine(index: number): string {
  const templates = strings.login.burstLines
  const template = templates[index % templates.length]
  return template.replace('{hex}', randomHex(8)).replace('{n}', String(0x20 + (index % 48)))
}

function pickLayout(index: number): Omit<BurstWindow, 'id' | 'title' | 'lifetime'> {
  return {
    top: `calc(${STACK_TOP}% + ${index * STACK_STEP}px)`,
    left: `calc(${STACK_LEFT}% + ${index * STACK_STEP}px)`,
    width: 392,
    height: 188,
    z: 34 + index,
  }
}

export function GhostBootBurst() {
  const [windows, setWindows] = useState<BurstWindow[]>([])
  const titles = strings.login.burstTitles

  useEffect(() => {
    const timers: number[] = []

    for (let index = 0; index < WINDOW_COUNT; index++) {
      const openAt = OPEN_STAGGER_MS[index] ?? 180 + index * 240
      timers.push(
        window.setTimeout(() => {
          const id = `ghost-cmd-${index}-${Date.now()}`
          setWindows((current) => [
            ...current,
            {
              id,
              title: titles[index % titles.length],
              lifetime: LIFETIME_MS,
              ...pickLayout(index),
            },
          ])
          timers.push(
            window.setTimeout(() => {
              setWindows((current) => current.filter((item) => item.id !== id))
            }, LIFETIME_MS),
          )
        }, openAt),
      )
    }

    return () => {
      for (const timer of timers) window.clearTimeout(timer)
    }
  }, [titles])

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <AnimatePresence>
        {windows.map((item) => (
          <BurstCmd key={item.id} frame={item} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function BurstCmd({ frame }: { frame: BurstWindow }) {
  const [lines, setLines] = useState<string[]>(() => [nextLine(0)])

  useEffect(() => {
    let index = 1
    const id = window.setInterval(() => {
      setLines((current) => {
        const next = [...current, nextLine(index)]
        index += 1
        return next.length > 18 ? next.slice(-18) : next
      })
    }, LINE_MS)
    return () => window.clearInterval(id)
  }, [])

  return (
    <motion.div
      className="absolute overflow-hidden rounded-t-[3px] border border-[#9ab4c8] shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
      style={{
        top: frame.top,
        left: frame.left,
        width: frame.width,
        height: frame.height,
        zIndex: frame.z,
      }}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.18 }}
    >
      <div className="flex h-[34px] items-center bg-gradient-to-r from-[#1d4f86] to-[#3d8ad0] px-2 text-[14px] font-semibold text-white">
        <span className="truncate">{frame.title}</span>
        <span className="ml-auto flex h-[20px] w-[46px] items-center justify-center bg-[#c75050] text-[13px] font-bold">
          ✕
        </span>
      </div>
      <div className="h-[calc(100%-34px)] overflow-hidden bg-[#0c0c0c] p-1.5 font-['Lucida_Console',Consolas,monospace] text-[14px] leading-[15px] text-[#39ff6a]">
        {lines.map((line, index) => (
          <div key={`${index}-${line}`} className="truncate">
            {line}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
