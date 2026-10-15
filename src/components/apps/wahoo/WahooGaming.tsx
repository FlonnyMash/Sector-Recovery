import { useEffect, useState } from 'react'
import { strings } from '../../../i18n'
import { getBestTime, getHighScore } from '../../../utils/highScores'
import { cn } from '../../../utils/cn'
import { Blackjack } from '../minigames/Blackjack'
import { JumpRun } from '../minigames/JumpRun'
import { SectorSweeper } from '../minigames/SectorSweeper'

type GameId = 'sweeper' | 'blackjack' | 'jump-run'

const COPY = strings.wahoo.gaming
const DOWNLOAD_MS = 1400

const GAMES: Array<{
  id: GameId
  title: string
  blurb: string
  version: string
  size: string
  rating: string
  score: () => string
}> = [
  {
    id: 'sweeper',
    title: strings.arcade.sweeper.title,
    blurb: strings.arcade.sweeper.blurb,
    version: COPY.sweeper.version,
    size: COPY.sweeper.size,
    rating: COPY.sweeper.rating,
    score: () => {
      const best = getBestTime('sweeper')
      return `${strings.arcade.bestTime}: ${best === null ? strings.arcade.noScore : `${best}s`}`
    },
  },
  {
    id: 'blackjack',
    title: strings.arcade.blackjack.title,
    blurb: strings.arcade.blackjack.blurb,
    version: COPY.blackjack.version,
    size: COPY.blackjack.size,
    rating: COPY.blackjack.rating,
    score: () => `${strings.arcade.highScore}: ${getHighScore('blackjack') || strings.arcade.noScore}`,
  },
  {
    id: 'jump-run',
    title: strings.arcade.jumpRun.title,
    blurb: strings.arcade.jumpRun.blurb,
    version: COPY.jumpRun.version,
    size: COPY.jumpRun.size,
    rating: COPY.jumpRun.rating,
    score: () => `${strings.arcade.highScore}: ${getHighScore('jumprun') || strings.arcade.noScore}`,
  },
]

export function WahooGaming() {
  const [playing, setPlaying] = useState<GameId | null>(null)
  const [installed, setInstalled] = useState<Record<GameId, boolean>>({
    sweeper: false,
    blackjack: false,
    'jump-run': false,
  })
  const [downloading, setDownloading] = useState<GameId | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!downloading) return
    const started = performance.now()
    const id = window.setInterval(() => {
      const next = Math.min(100, Math.round(((performance.now() - started) / DOWNLOAD_MS) * 100))
      setProgress(next)
      if (next >= 100) {
        window.clearInterval(id)
        setInstalled((current) => ({ ...current, [downloading]: true }))
        setDownloading(null)
        setProgress(0)
        setPlaying(downloading)
      }
    }, 50)
    return () => window.clearInterval(id)
  }, [downloading])

  if (playing) {
    return (
      <div className="flex h-full flex-col bg-[#111]">
        <button
          type="button"
          onClick={() => setPlaying(null)}
          className="h-8 shrink-0 border-b border-white/15 bg-[#1c1c1c] px-3 text-left text-[11px] text-[#f0c14a] hover:bg-[#262626]"
        >
          ← {COPY.back}
        </button>
        <div className="min-h-0 flex-1">
          {playing === 'sweeper' ? <SectorSweeper /> : null}
          {playing === 'blackjack' ? <Blackjack /> : null}
          {playing === 'jump-run' ? <JumpRun /> : null}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-[#16121c] p-4 text-[#f7e6c8]">
      <div className="font-[Georgia,Times,serif] text-[22px] font-bold text-[#ffcc00]">{COPY.heading}</div>
      <div className="mb-4 text-[12px] text-[#c4b09a]">{COPY.subheading}</div>
      <div className="grid gap-3">
        {GAMES.map((game) => {
          const isDownloading = downloading === game.id
          const isInstalled = installed[game.id]
          return (
            <div
              key={game.id}
              className="rounded-sm border border-[#f0c14a]/35 bg-[#1c1824] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[15px] font-bold text-white">{game.title}</div>
                  <div className="mt-1 text-[12px] text-[#d9cbb8]">{game.blurb}</div>
                </div>
                <div className="shrink-0 text-right font-mono text-[10px] text-[#f0c14a]">
                  {game.rating}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[11px] text-[#c4b09a]">
                <span>
                  {COPY.version} {game.version}
                </span>
                <span>
                  {COPY.size} {game.size}
                </span>
                <span>{game.score()}</span>
              </div>
              {isDownloading ? (
                <div className="mt-3">
                  <div className="mb-1 text-[11px] text-[#c4b09a]">{COPY.downloading}</div>
                  <div className="h-[14px] overflow-hidden border border-[#4a3a20] bg-[#0e0c12]">
                    <div
                      className="h-full bg-[repeating-linear-gradient(45deg,#f0c14a_0_8px,#ffe08a_8px_16px)] transition-[width] duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={downloading !== null}
                  onClick={() => {
                    if (isInstalled) {
                      setPlaying(game.id)
                      return
                    }
                    setProgress(0)
                    setDownloading(game.id)
                  }}
                  className={cn(
                    'mt-3 h-[26px] min-w-[110px] rounded-sm border px-3 text-[12px] font-bold',
                    isInstalled
                      ? 'border-[#5ad46a] bg-[#1e3a24] text-[#9dffb0] hover:bg-[#24482c]'
                      : 'border-[#f0c14a] bg-[#3a2a08] text-[#ffe08a] hover:bg-[#4a360c]',
                    downloading !== null && !isInstalled ? 'opacity-50' : '',
                  )}
                >
                  {isInstalled ? COPY.play : COPY.download}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
