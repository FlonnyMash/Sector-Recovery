import { useMemo, useState } from 'react'
import { strings } from '../../../i18n'
import { getHighScore, recordHighScore } from '../../../utils/highScores'
import { cn } from '../../../utils/cn'

const GAME_KEY = 'blackjack'
const STARTING_CHIPS = 500
const SUITS = ['♠', '♥', '♦', '♣'] as const
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const

type Card = { rank: (typeof RANKS)[number]; suit: (typeof SUITS)[number] }
type Phase = 'betting' | 'player' | 'dealer' | 'settled'

function freshDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push({ rank, suit })
  }
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const swap = deck[i]
    deck[i] = deck[j]
    deck[j] = swap
  }
  return deck
}

function handValue(cards: Card[]): { total: number; soft: boolean } {
  let total = 0
  let aces = 0
  for (const card of cards) {
    if (card.rank === 'A') {
      aces += 1
      total += 11
    } else if (card.rank === 'K' || card.rank === 'Q' || card.rank === 'J') {
      total += 10
    } else {
      total += Number(card.rank)
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces -= 1
  }
  return { total, soft: aces > 0 }
}

function draw(deck: Card[]): { card: Card; deck: Card[] } {
  const next = deck.length > 12 ? deck : freshDeck()
  const card = next[0]
  return { card, deck: next.slice(1) }
}

export function Blackjack() {
  const [deck, setDeck] = useState<Card[]>(() => freshDeck())
  const [player, setPlayer] = useState<Card[]>([])
  const [dealer, setDealer] = useState<Card[]>([])
  const [chips, setChips] = useState(STARTING_CHIPS)
  const [bet, setBet] = useState(50)
  const [phase, setPhase] = useState<Phase>('betting')
  const [message, setMessage] = useState('')
  const [best, setBest] = useState(() => Math.max(STARTING_CHIPS, getHighScore(GAME_KEY)))

  const playerScore = useMemo(() => handValue(player), [player])
  const dealerScore = useMemo(() => handValue(dealer), [dealer])
  const hideDealer = phase === 'player'

  const take = (from: Card[], count: number, source: Card[]) => {
    let working = source
    const cards = [...from]
    for (let i = 0; i < count; i += 1) {
      const result = draw(working)
      cards.push(result.card)
      working = result.deck
    }
    return { cards, deck: working }
  }

  const settle = (playerCards: Card[], dealerCards: Card[], wager: number, nextChips: number) => {
    const p = handValue(playerCards).total
    const d = handValue(dealerCards).total
    const playerBj = p === 21 && playerCards.length === 2
    const dealerBj = d === 21 && dealerCards.length === 2
    let resultChips = nextChips
    let text: string = strings.arcade.blackjack.push

    if (playerBj && !dealerBj) {
      resultChips += Math.floor(wager * 2.5)
      text = strings.arcade.blackjack.blackjack
    } else if (p > 21) {
      text = strings.arcade.blackjack.bust
    } else if (d > 21 || p > d) {
      resultChips += wager * 2
      text = strings.arcade.blackjack.win
    } else if (p < d || (dealerBj && !playerBj)) {
      text = strings.arcade.blackjack.lose
    } else {
      resultChips += wager
    }

    setChips(resultChips)
    setBest(recordHighScore(GAME_KEY, resultChips))
    setMessage(text)
    setPhase('settled')
  }

  const deal = () => {
    if (chips <= 0) return
    const wager = Math.min(bet, chips)
    const afterBet = chips - wager
    let working = deck
    const p = take([], 2, working)
    working = p.deck
    const d = take([], 2, working)
    setDeck(d.deck)
    setPlayer(p.cards)
    setDealer(d.cards)
    setChips(afterBet)
    setBet(wager)
    setMessage('')

    const pScore = handValue(p.cards)
    const dScore = handValue(d.cards)
    if (pScore.total === 21 || dScore.total === 21) {
      settle(p.cards, d.cards, wager, afterBet)
      return
    }
    setPhase('player')
  }

  const hit = () => {
    if (phase !== 'player') return
    const result = take(player, 1, deck)
    setDeck(result.deck)
    setPlayer(result.cards)
    if (handValue(result.cards).total > 21) {
      settle(result.cards, dealer, bet, chips)
    }
  }

  const playDealer = (
    playerCards: Card[],
    dealerCards: Card[],
    source: Card[],
    wager: number,
    remainingChips: number,
  ) => {
    let working = source
    let cards = dealerCards
    let score = handValue(cards)
    while (score.total < 17) {
      const result = take(cards, 1, working)
      working = result.deck
      cards = result.cards
      score = handValue(cards)
    }
    setDeck(working)
    setDealer(cards)
    settle(playerCards, cards, wager, remainingChips)
  }

  const stand = () => {
    if (phase !== 'player') return
    setPhase('dealer')
    playDealer(player, dealer, deck, bet, chips)
  }

  const doubleDown = () => {
    if (phase !== 'player' || player.length !== 2 || chips < bet) return
    const nextChips = chips - bet
    const nextBet = bet * 2
    const result = take(player, 1, deck)
    setChips(nextChips)
    setBet(nextBet)
    setPlayer(result.cards)
    setPhase('dealer')
    if (handValue(result.cards).total > 21) {
      settle(result.cards, dealer, nextBet, nextChips)
      return
    }
    playDealer(result.cards, dealer, result.deck, nextBet, nextChips)
  }

  return (
    <div className="flex h-full flex-col bg-[#14261c] p-3 font-[Tahoma,'Segoe_UI',sans-serif] text-[12px] text-[#e8f6ea]">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[14px] font-bold">{strings.arcade.blackjack.title}</div>
        <div className="font-mono text-[11px]">
          {strings.arcade.blackjack.balance}: {chips} · {strings.arcade.highScore}: {best}
        </div>
      </div>

      <Hand
        label={strings.arcade.blackjack.dealer}
        cards={dealer}
        hideHole={hideDealer}
        total={hideDealer ? undefined : dealerScore.total}
      />
      <Hand
        label={strings.arcade.blackjack.you}
        cards={player}
        total={player.length ? playerScore.total : undefined}
      />

      <div className="mt-auto space-y-2">
        {message ? <div className="text-center text-[13px] font-bold">{message}</div> : null}
        {chips <= 0 && phase === 'betting' ? (
          <div className="text-center">
            <div className="mb-2 text-[11px] text-[#c9e0cc]">{strings.arcade.blackjack.broke}</div>
            <button
              type="button"
              onClick={() => setChips(STARTING_CHIPS)}
              className="rounded-sm border border-[#d4c06a] bg-[#3a4a20] px-3 py-1"
            >
              {strings.arcade.blackjack.refill}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {phase === 'betting' || phase === 'settled' ? (
              <>
                <label className="flex items-center gap-1">
                  {strings.arcade.blackjack.bet}
                  <input
                    type="number"
                    min={10}
                    max={Math.max(10, chips)}
                    step={10}
                    value={Math.min(bet, Math.max(chips, 10))}
                    onChange={(event) => setBet(Number(event.target.value) || 10)}
                    className="w-16 rounded-sm border border-[#4a6a50] bg-[#1d3326] px-1 py-0.5"
                  />
                </label>
                <button
                  type="button"
                  onClick={deal}
                  disabled={chips <= 0}
                  className="rounded-sm border border-[#d4c06a] bg-[#2f5a38] px-3 py-1 font-bold"
                >
                  {phase === 'settled' ? strings.arcade.blackjack.newRound : strings.arcade.blackjack.deal}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={hit}
                  className="rounded-sm border border-[#9ad4a6] bg-[#2f5a38] px-3 py-1"
                >
                  {strings.arcade.blackjack.hit}
                </button>
                <button
                  type="button"
                  onClick={stand}
                  className="rounded-sm border border-[#9ad4a6] bg-[#2f5a38] px-3 py-1"
                >
                  {strings.arcade.blackjack.stand}
                </button>
                <button
                  type="button"
                  disabled={player.length !== 2 || chips < bet}
                  onClick={doubleDown}
                  className="rounded-sm border border-[#9ad4a6] bg-[#2f5a38] px-3 py-1 disabled:opacity-40"
                >
                  {strings.arcade.blackjack.double}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Hand({
  label,
  cards,
  hideHole,
  total,
}: {
  label: string
  cards: Card[]
  hideHole?: boolean
  total?: number
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 text-[11px] tracking-wide text-[#aad4b4] uppercase">
        {label}
        {total !== undefined ? ` · ${total}` : ''}
      </div>
      <div className="flex min-h-[72px] gap-2">
        {cards.map((card, index) => {
          const hidden = Boolean(hideHole && index === 1)
          const red = card.suit === '♥' || card.suit === '♦'
          return (
            <div
              key={`${card.rank}${card.suit}${index}`}
              className={cn(
                'flex h-[68px] w-[48px] flex-col items-center justify-center rounded-sm border text-[14px] font-bold',
                hidden
                  ? 'border-[#3a2060] bg-[#3a2060] text-white'
                  : 'border-[#d9d2c5] bg-[#f7f1e4]',
                !hidden && red ? 'text-[#c42b3a]' : !hidden ? 'text-[#1a1a1a]' : '',
              )}
            >
              {hidden ? '◆' : `${card.rank}${card.suit}`}
            </div>
          )
        })}
      </div>
    </div>
  )
}
