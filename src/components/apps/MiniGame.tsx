import { useState } from 'react'
import { strings } from '../../i18n'
import { getBestTime, getHighScore } from '../../utils/highScores'
import { Blackjack } from './minigames/Blackjack'
import { JumpRun } from './minigames/JumpRun'
import { SectorSweeper } from './minigames/SectorSweeper'

type CabinetId = 'sweeper' | 'blackjack' | 'jump-run'

const CABINETS: Array<{
  id: CabinetId
  title: string
  blurb: string
  accent: string
  score: () => string
}> = [
  {
    id: 'sweeper',
    title: strings.arcade.sweeper.title,
    blurb: strings.arcade.sweeper.blurb,
    accent: 'from-[#1c2430] to-[#3b5366]',
    score: () => {
      const best = getBestTime('sweeper')
      return `${strings.arcade.bestTime}: ${best === null ? strings.arcade.noScore : `${best}s`}`
    },
  },
  {
    id: 'blackjack',
    title: strings.arcade.blackjack.title,
    blurb: strings.arcade.blackjack.blurb,
    accent: 'from-[#14261c] to-[#2f5a38]',
    score: () => `${strings.arcade.highScore}: ${getHighScore('blackjack') || strings.arcade.noScore}`,
  },
  {
    id: 'jump-run',
    title: strings.arcade.jumpRun.title,
    blurb: strings.arcade.jumpRun.blurb,
    accent: 'from-[#140c1e] to-[#3a2048]',
    score: () => `${strings.arcade.highScore}: ${getHighScore('jumprun') || strings.arcade.noScore}`,
  },
]

export function MiniGame() {
  const [active, setActive] = useState<CabinetId | null>(null)

  if (active) {
    return (
      <div className="flex h-full flex-col bg-[#111]">
        <button
          type="button"
          onClick={() => setActive(null)}
          className="h-8 shrink-0 border-b border-white/15 bg-[#1c1c1c] px-3 text-left text-[11px] text-[#f0c14a] hover:bg-[#262626]"
        >
          ← {strings.arcade.back}
        </button>
        <div className="min-h-0 flex-1">
          {active === 'sweeper' ? <SectorSweeper /> : null}
          {active === 'blackjack' ? <Blackjack /> : null}
          {active === 'jump-run' ? <JumpRun /> : null}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[#16121c] p-4 font-[Tahoma,'Segoe_UI',sans-serif] text-[#f7e6c8]">
      <div className="text-[18px] font-bold tracking-wide">{strings.arcade.title}</div>
      <div className="mb-4 text-[12px] text-[#c4b09a]">{strings.arcade.subtitle}</div>
      <div className="grid gap-3">
        {CABINETS.map((cabinet) => (
          <button
            key={cabinet.id}
            type="button"
            onClick={() => setActive(cabinet.id)}
            className={`rounded-sm border border-[#f0c14a]/40 bg-gradient-to-r ${cabinet.accent} px-4 py-3 text-left hover:border-[#f0c14a]`}
          >
            <div className="text-[15px] font-bold">{cabinet.title}</div>
            <div className="mt-1 text-[12px] text-[#d9cbb8]">{cabinet.blurb}</div>
            <div className="mt-2 font-mono text-[11px] text-[#f0c14a]">{cabinet.score()}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
