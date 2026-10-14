import { useCallback, useEffect, useMemo, useState } from 'react'
import { strings } from '../../../i18n'
import { getBestTime, recordBestTime } from '../../../utils/highScores'
import { cn } from '../../../utils/cn'

const ROWS = 9
const COLS = 9
const MINES = 10
const GAME_KEY = 'sweeper'

type Cell = {
  mine: boolean
  revealed: boolean
  flagged: boolean
  adjacent: number
}

type Status = 'ready' | 'playing' | 'won' | 'lost'

function makeBoard(): Cell[] {
  const cells: Cell[] = Array.from({ length: ROWS * COLS }, () => ({
    mine: false,
    revealed: false,
    flagged: false,
    adjacent: 0,
  }))

  let placed = 0
  while (placed < MINES) {
    const index = Math.floor(Math.random() * cells.length)
    if (cells[index].mine) continue
    cells[index].mine = true
    placed += 1
  }

  for (let i = 0; i < cells.length; i += 1) {
    if (cells[i].mine) continue
    cells[i].adjacent = neighbors(i).reduce((sum, n) => sum + (cells[n].mine ? 1 : 0), 0)
  }
  return cells
}

function neighbors(index: number): number[] {
  const row = Math.floor(index / COLS)
  const col = index % COLS
  const result: number[] = []
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue
      const r = row + dr
      const c = col + dc
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue
      result.push(r * COLS + c)
    }
  }
  return result
}

function floodReveal(cells: Cell[], start: number): Cell[] {
  const next = cells.map((cell) => ({ ...cell }))
  const stack = [start]
  while (stack.length > 0) {
    const index = stack.pop()
    if (index === undefined) break
    const cell = next[index]
    if (cell.revealed || cell.flagged) continue
    cell.revealed = true
    if (!cell.mine && cell.adjacent === 0) {
      for (const n of neighbors(index)) stack.push(n)
    }
  }
  return next
}

function isWin(cells: Cell[]): boolean {
  return cells.every((cell) => cell.mine || cell.revealed)
}

export function SectorSweeper() {
  const [cells, setCells] = useState<Cell[]>(() => makeBoard())
  const [status, setStatus] = useState<Status>('ready')
  const [seconds, setSeconds] = useState(0)
  const [best, setBest] = useState<number | null>(() => getBestTime(GAME_KEY))

  const reset = useCallback(() => {
    setCells(makeBoard())
    setStatus('ready')
    setSeconds(0)
  }, [])

  useEffect(() => {
    if (status !== 'playing') return
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(id)
  }, [status])

  const flags = useMemo(() => cells.filter((cell) => cell.flagged).length, [cells])

  const openCell = (index: number) => {
    if (status === 'won' || status === 'lost') return
    const cell = cells[index]
    if (cell.revealed || cell.flagged) return

    let nextStatus: Status = status === 'ready' ? 'playing' : status
    let nextCells: Cell[]
    if (cell.mine) {
      nextCells = cells.map((item, i) =>
        item.mine || i === index ? { ...item, revealed: true } : item,
      )
      nextStatus = 'lost'
    } else {
      nextCells = floodReveal(cells, index)
      if (isWin(nextCells)) {
        nextStatus = 'won'
        const recorded = recordBestTime(GAME_KEY, seconds)
        setBest(recorded)
      }
    }
    setCells(nextCells)
    setStatus(nextStatus)
  }

  const toggleFlag = (index: number) => {
    if (status === 'won' || status === 'lost') return
    setCells((current) =>
      current.map((cell, i) => {
        if (i !== index || cell.revealed) return cell
        return { ...cell, flagged: !cell.flagged }
      }),
    )
    if (status === 'ready') setStatus('playing')
  }

  const statusLabel =
    status === 'won'
      ? strings.arcade.sweeper.statusClear
      : status === 'lost'
        ? strings.arcade.sweeper.statusBoom
        : strings.arcade.sweeper.statusReady

  return (
    <div className="flex h-full flex-col bg-[#1c2430] p-3 font-[Tahoma,'Segoe_UI',sans-serif] text-[12px] text-[#d6e6f0]">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-[14px] font-bold">{strings.arcade.sweeper.title}</div>
          <div className="text-[11px] text-[#8aa4b4]">{statusLabel}</div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-sm border border-[#5a7a8a] bg-[#2b3b48] px-2 py-1 text-[11px] hover:bg-[#354858]"
        >
          {strings.arcade.sweeper.newGame}
        </button>
      </div>
      <div className="mb-2 flex gap-4 font-mono text-[11px]">
        <span>
          {strings.arcade.sweeper.mines}: {MINES - flags}
        </span>
        <span>
          {strings.arcade.sweeper.time}: {seconds}s
        </span>
        <span>
          {strings.arcade.bestTime}: {best === null ? strings.arcade.noScore : `${best}s`}
        </span>
      </div>
      <div
        className="grid w-fit gap-px self-center bg-[#0f1620] p-px"
        style={{ gridTemplateColumns: `repeat(${COLS}, 28px)` }}
      >
        {cells.map((cell, index) => (
          <button
            key={index}
            type="button"
            onClick={() => openCell(index)}
            onContextMenu={(event) => {
              event.preventDefault()
              toggleFlag(index)
            }}
            className={cn(
              'h-[28px] w-[28px] text-[12px] font-bold',
              cell.revealed
                ? cell.mine
                  ? 'bg-[#8a2a32] text-white'
                  : 'bg-[#243140] text-[#9be7ff]'
                : 'bg-[#3b5366] hover:bg-[#4a6780]',
            )}
          >
            {cell.revealed
              ? cell.mine
                ? '●'
                : cell.adjacent || ''
              : cell.flagged
                ? '⚑'
                : ''}
          </button>
        ))}
      </div>
    </div>
  )
}
