import { useEffect, useState } from 'react'
import { ARCADE_CATALOG, arcadeGameById, type ArcadeGameId } from '../../game/arcadeCatalog'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'
import { cn } from '../../utils/cn'
import { getBestTime, getHighScore } from '../../utils/highScores'
import { Blackjack } from './minigames/Blackjack'
import { JumpRun } from './minigames/JumpRun'
import { SectorSweeper } from './minigames/SectorSweeper'

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

function openGamingStore() {
  const store = useGameStore.getState()
  store.requestWahooTab('gaming')
  store.openWindow('news-browser')
}

export function MiniGame() {
  const installedIds = useGameStore((state) => state.installedArcadeGames)
  const [selectedId, setSelectedId] = useState<ArcadeGameId | null>(null)
  const [playing, setPlaying] = useState<ArcadeGameId | null>(null)

  const library = ARCADE_CATALOG.filter((game) => installedIds.includes(game.id))

  useEffect(() => {
    if (selectedId && installedIds.includes(selectedId)) return
    setSelectedId(installedIds[0] ?? null)
  }, [installedIds, selectedId])

  if (playing) {
    return (
      <div className="flex h-full flex-col bg-[#111]">
        <button
          type="button"
          onClick={() => setPlaying(null)}
          className="h-8 shrink-0 border-b border-white/15 bg-[#1c1c1c] px-3 text-left text-[11px] text-[#f0c14a] hover:bg-[#262626]"
        >
          ← {strings.arcade.back}
        </button>
        <div className="min-h-0 flex-1">
          {playing === 'sweeper' ? <SectorSweeper /> : null}
          {playing === 'blackjack' ? <Blackjack /> : null}
          {playing === 'jump-run' ? <JumpRun /> : null}
        </div>
      </div>
    )
  }

  const selected = selectedId ? arcadeGameById(selectedId) : null

  return (
    <div className="flex h-full flex-col bg-[#1b1d22] font-['Segoe_UI',Tahoma,sans-serif] text-[#c7d5e0]">
      <header className="flex h-10 shrink-0 items-center gap-3 border-b border-black/40 bg-[#17191e] px-3">
        <div className="font-[Georgia,Times,serif] text-[15px] font-bold italic text-[#ffcc00]">
          {strings.arcade.title}
        </div>
        <button
          type="button"
          onClick={openGamingStore}
          className="rounded-sm px-2 py-1 text-[12px] font-semibold text-[#9aa8b5] hover:bg-white/5 hover:text-white"
        >
          {strings.arcade.store}
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[220px] shrink-0 flex-col border-r border-black/50 bg-[#14161b]">
          <div className="px-3 py-2 text-[10px] font-bold tracking-[0.16em] text-[#6b7380] uppercase">
            {strings.arcade.library}
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {library.map((game) => (
              <button
                key={game.id}
                type="button"
                onClick={() => setSelectedId(game.id)}
                className={cn(
                  'flex w-full items-center px-3 py-2 text-left text-[13px]',
                  selectedId === game.id
                    ? 'bg-[#2a475e] text-white'
                    : 'text-[#b8c5d1] hover:bg-white/5 hover:text-white',
                )}
              >
                {game.title}
              </button>
            ))}
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-auto bg-[#1b2838]">
          {selected ? (
            <div className="flex h-full flex-col">
              <div className={`h-[180px] shrink-0 bg-gradient-to-r ${selected.accent}`} />
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="text-[22px] font-bold text-white">{selected.title}</div>
                <p className="text-[13px] text-[#c7d5e0]">{selected.blurb}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[11px] text-[#8f98a0]">
                  <span>
                    {strings.wahoo.gaming.version} {selected.version}
                  </span>
                  <span>
                    {strings.wahoo.gaming.size} {selected.size}
                  </span>
                  <span>{gameScore(selected.id)}</span>
                  <span>{strings.arcade.installed}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPlaying(selected.id)}
                  className="mt-auto h-[36px] w-[140px] rounded-sm bg-[#5c7e10] text-[14px] font-bold text-[#beee11] hover:bg-[#6b8f14]"
                >
                  {strings.arcade.play}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
              <div className="text-[18px] font-bold text-white">{strings.arcade.emptyTitle}</div>
              <p className="max-w-[360px] text-[13px] text-[#9aa8b5]">{strings.arcade.emptyBody}</p>
              <button
                type="button"
                onClick={openGamingStore}
                className="h-[32px] rounded-sm bg-[#7b1fa2] px-4 text-[13px] font-bold text-white hover:bg-[#6a1b9a]"
              >
                {strings.arcade.emptyCta}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
