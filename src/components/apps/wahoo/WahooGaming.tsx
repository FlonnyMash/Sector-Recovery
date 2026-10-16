import { useEffect, useState } from 'react'
import { ARCADE_CATALOG, type ArcadeGameId } from '../../../game/arcadeCatalog'
import { strings } from '../../../i18n'
import { useGameStore } from '../../../store/useGameStore'
import { getBestTime, getHighScore } from '../../../utils/highScores'
import { cn } from '../../../utils/cn'

const COPY = strings.wahoo.gaming
const DOWNLOAD_MS = 1400

function gameScore(id: ArcadeGameId): string {
  if (id === 'sweeper') {
    const best = getBestTime('sweeper')
    return `${strings.arcade.bestTime}: ${best === null ? strings.arcade.noScore : `${best}s`}`
  }
  if (id === 'blackjack') {
    return `${strings.arcade.highScore}: ${getHighScore('blackjack') || strings.arcade.noScore}`
  }
  return `${strings.arcade.highScore}: ${getHighScore('jumprun') || strings.arcade.noScore}`
}

export function WahooGaming() {
  const installedIds = useGameStore((state) => state.installedArcadeGames)
  const installArcadeGame = useGameStore((state) => state.installArcadeGame)
  const openWindow = useGameStore((state) => state.openWindow)
  const [downloading, setDownloading] = useState<ArcadeGameId | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!downloading) return
    const started = performance.now()
    const id = window.setInterval(() => {
      const next = Math.min(100, Math.round(((performance.now() - started) / DOWNLOAD_MS) * 100))
      setProgress(next)
      if (next >= 100) {
        window.clearInterval(id)
        installArcadeGame(downloading)
        setDownloading(null)
        setProgress(0)
      }
    }, 50)
    return () => window.clearInterval(id)
  }, [downloading, installArcadeGame])

  return (
    <div className="h-full overflow-auto bg-[#16121c] p-4 text-[#f7e6c8]">
      <div className="font-[Georgia,Times,serif] text-[28px] font-bold text-[#ffcc00]">{COPY.heading}</div>
      <div className="mb-4 text-[16px] text-[#c4b09a]">{COPY.subheading}</div>
      <div className="grid gap-3">
        {ARCADE_CATALOG.map((game) => {
          const isDownloading = downloading === game.id
          const isInstalled = installedIds.includes(game.id)
          return (
            <div
              key={game.id}
              className="rounded-sm border border-[#f0c14a]/35 bg-[#1c1824] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[20px] font-bold text-white">{game.title}</div>
                  <div className="mt-1 text-[16px] text-[#d9cbb8]">{game.blurb}</div>
                </div>
                <div className="shrink-0 text-right font-mono text-[13px] text-[#f0c14a]">
                  {game.rating}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[14px] text-[#c4b09a]">
                <span>
                  {COPY.version} {game.version}
                </span>
                <span>
                  {COPY.size} {game.size}
                </span>
                <span>{gameScore(game.id)}</span>
              </div>
              {isDownloading ? (
                <div className="mt-3">
                  <div className="mb-1 text-[14px] text-[#c4b09a]">{COPY.downloading}</div>
                  <div className="h-[14px] overflow-hidden border border-[#4a3a20] bg-[#0e0c12]">
                    <div
                      className="h-full bg-[repeating-linear-gradient(45deg,#f0c14a_0_8px,#ffe08a_8px_16px)] transition-[width] duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : isInstalled ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-semibold text-[#9dffb0]">{COPY.installed}</span>
                  <button
                    type="button"
                    onClick={() => openWindow('arcade')}
                    className="h-[26px] min-w-[110px] rounded-sm border border-[#5ad46a] bg-[#1e3a24] px-3 text-[16px] font-bold text-[#9dffb0] hover:bg-[#24482c]"
                  >
                    {COPY.openLauncher}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={downloading !== null}
                  onClick={() => {
                    setProgress(0)
                    setDownloading(game.id)
                  }}
                  className={cn(
                    'mt-3 h-[26px] min-w-[110px] rounded-sm border border-[#f0c14a] bg-[#3a2a08] px-3 text-[16px] font-bold text-[#ffe08a] hover:bg-[#4a360c]',
                    downloading !== null ? 'opacity-50' : '',
                  )}
                >
                  {COPY.download}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
