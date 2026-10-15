import { strings } from '../i18n'

export type ArcadeGameId = 'sweeper' | 'blackjack' | 'jump-run'

export const ARCADE_GAME_IDS: readonly ArcadeGameId[] = ['sweeper', 'blackjack', 'jump-run']

export interface ArcadeGameDef {
  id: ArcadeGameId
  title: string
  blurb: string
  version: string
  size: string
  rating: string
  accent: string
}

export const ARCADE_CATALOG: ArcadeGameDef[] = [
  {
    id: 'sweeper',
    title: strings.arcade.sweeper.title,
    blurb: strings.arcade.sweeper.blurb,
    version: strings.wahoo.gaming.sweeper.version,
    size: strings.wahoo.gaming.sweeper.size,
    rating: strings.wahoo.gaming.sweeper.rating,
    accent: 'from-[#1c2430] to-[#3b5366]',
  },
  {
    id: 'blackjack',
    title: strings.arcade.blackjack.title,
    blurb: strings.arcade.blackjack.blurb,
    version: strings.wahoo.gaming.blackjack.version,
    size: strings.wahoo.gaming.blackjack.size,
    rating: strings.wahoo.gaming.blackjack.rating,
    accent: 'from-[#14261c] to-[#2f5a38]',
  },
  {
    id: 'jump-run',
    title: strings.arcade.jumpRun.title,
    blurb: strings.arcade.jumpRun.blurb,
    version: strings.wahoo.gaming.jumpRun.version,
    size: strings.wahoo.gaming.jumpRun.size,
    rating: strings.wahoo.gaming.jumpRun.rating,
    accent: 'from-[#140c1e] to-[#3a2048]',
  },
]

export function isArcadeGameId(value: unknown): value is ArcadeGameId {
  return value === 'sweeper' || value === 'blackjack' || value === 'jump-run'
}

export function arcadeGameById(id: ArcadeGameId): ArcadeGameDef {
  const game = ARCADE_CATALOG.find((entry) => entry.id === id)
  if (!game) throw new Error(`Unknown arcade game: ${id}`)
  return game
}
