import { useEffect, useState } from 'react'
import { AUCTION_LOTS, resolveLot, type AuctionLot } from '../../../game/wahooAuctions'
import { strings } from '../../../i18n'
import { useGameStore } from '../../../store/useGameStore'
import {
  AUCTION_COUNTDOWN_MS,
  AUCTION_SOLD_TO_DELAY_MS,
  type AuctionLotId,
} from '../../../types/game'
import { cn } from '../../../utils/cn'

const COPY = strings.wahoo.auctions

export function WahooAuctions({
  selectedLotId,
  onSelectLot,
}: {
  selectedLotId: AuctionLotId | null
  onSelectLot: (id: AuctionLotId | null) => void
}) {
  const watchAuction = useGameStore((state) => state.watchAuction)
  const prologue = useGameStore((state) => state.prologue)
  const [toast, setToast] = useState<string | null>(null)
  const countdownSeconds = useAuctionCountdown(
    prologue.auctionCountdownStartedAt,
    prologue.auctionLot404Sold,
  )
  const soldToVisible = useSoldToVisible(
    prologue.auctionLot404Sold,
    prologue.auctionCountdownStartedAt,
  )

  useEffect(() => {
    watchAuction()
  }, [watchAuction])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(id)
  }, [toast])

  const lots = AUCTION_LOTS.map((lot) => resolveLot(lot, prologue))
  const selected = lots.find((lot) => lot.id === selectedLotId) ?? null

  const placeBid = (lot: AuctionLot) => {
    setToast(Math.random() < 0.5 ? COPY.toastVerify : COPY.toastOutbid)
    onSelectLot(lot.id)
  }

  return (
    <div className="relative h-full overflow-auto bg-[#f7f3ea]">
      <div className="border-b border-[#e0d4b8] bg-[#fff8e8] px-4 py-3">
        <div className="font-[Georgia,Times,serif] text-[20px] font-bold text-[#7b1fa2]">
          {strings.wahoo.bookmarks.auctions}
        </div>
        <div className="text-[12px] text-[#6a5c24]">{COPY.heading}</div>
        <div className="text-[11px] text-[#8a7a4a]">{COPY.subheading}</div>
      </div>

      <div className="p-4">
        {selected ? (
          <LotDetail
            lot={selected}
            countdownSeconds={countdownSeconds}
            soldToVisible={soldToVisible}
            onBack={() => onSelectLot(null)}
            onBid={() => placeBid(selected)}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {lots.map((lot) => (
              <button
                key={lot.id}
                type="button"
                onClick={() => onSelectLot(lot.id)}
                className="rounded-sm border border-[#d8c878] bg-white p-3 text-left hover:border-[#7b1fa2]"
              >
                <LotHeader lot={lot} countdownSeconds={countdownSeconds} />
                <div className="mt-1 text-[13px] font-bold leading-snug text-[#1a1a1a]">{lot.title}</div>
                <p className="mt-1 line-clamp-2 text-[11px] text-[#5a5e66]">{lot.description}</p>
                <LotPrice lot={lot} />
                {lot.id === 'lot-404' && soldToVisible && lot.winner ? (
                  <SoldToLine winner={lot.winner} />
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>

      {toast ? (
        <div className="pointer-events-none absolute right-3 bottom-3 max-w-[280px] rounded-sm border border-[#c8a000] bg-[#fff8d0] px-3 py-2 text-[12px] font-semibold text-[#3a2200] shadow-md">
          {toast}
        </div>
      ) : null}
    </div>
  )
}

function useAuctionCountdown(startedAt: number | null, sold: boolean) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (sold || startedAt === null) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [startedAt, sold])

  if (sold) return 0
  if (startedAt === null) return Math.ceil(AUCTION_COUNTDOWN_MS / 1000)
  return Math.max(0, Math.ceil((AUCTION_COUNTDOWN_MS - (now - startedAt)) / 1000))
}

function useSoldToVisible(sold: boolean, startedAt: number | null) {
  const [now, setNow] = useState(() => Date.now())
  const delayUntil =
    startedAt !== null ? startedAt + AUCTION_COUNTDOWN_MS + AUCTION_SOLD_TO_DELAY_MS : 0
  const ready = sold && (startedAt === null || now >= delayUntil)

  useEffect(() => {
    if (!sold || ready) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [sold, ready])

  return ready
}

function LotHeader({ lot, countdownSeconds }: { lot: AuctionLot; countdownSeconds: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-[11px] text-[#7b1fa2]">Lot #{lot.lotNumber}</span>
      {lot.status === 'sold' ? (
        <span className="rounded-sm bg-[#333] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[#ffcc00] uppercase">
          {COPY.sold}
        </span>
      ) : lot.id === 'lot-404' ? (
        <span className="animate-pulse text-[10px] font-bold text-[#e53935]">
          {lot.bids} {COPY.bids} · {COPY.endsIn.replace('{s}', String(countdownSeconds))}
        </span>
      ) : (
        <span className="text-[10px] text-[#6a6e76]">
          {lot.bids} {COPY.bids} · {COPY.ends} {lot.ends}
        </span>
      )}
    </div>
  )
}

function LotPrice({ lot }: { lot: AuctionLot }) {
  if (lot.status === 'sold') {
    return (
      <div className="mt-2 text-[12px] font-bold text-[#8a2f4b]">
        {COPY.sold} — {COPY.winningBid}: {lot.bid}
        {lot.winner ? ` · ${lot.winner}` : ''}
      </div>
    )
  }
  return (
    <div className="mt-2 text-[12px] font-bold text-[#1a1a1a]">
      {COPY.currentBid}: {lot.bid}
    </div>
  )
}

function SoldToLine({ winner }: { winner: string }) {
  return (
    <div className="mt-2 text-[12px] font-bold text-[#8a2f4b]">
      {COPY.soldTo} {winner}
    </div>
  )
}

function LotDetail({
  lot,
  countdownSeconds,
  soldToVisible,
  onBack,
  onBid,
}: {
  lot: AuctionLot
  countdownSeconds: number
  soldToVisible: boolean
  onBack: () => void
  onBid: () => void
}) {
  return (
    <div className="mx-auto max-w-[560px] rounded-sm border border-[#d8c878] bg-white p-4">
      <button type="button" onClick={onBack} className="text-[12px] font-semibold text-[#7b1fa2] hover:underline">
        ← {COPY.backToLots}
      </button>
      <div className="mt-3">
        <LotHeader lot={lot} countdownSeconds={countdownSeconds} />
      </div>
      <h2 className="mt-2 text-[18px] font-bold leading-snug">{lot.title}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[#333]">{lot.description}</p>
      <LotPrice lot={lot} />
      {lot.status === 'active' ? (
        <div className={cn('mt-1 text-[12px] text-[#5a5e66]')}>
          {COPY.currentHighestBid}: {lot.bid} · {COPY.highestBidder}: {lot.highBidder}
        </div>
      ) : null}
      <fieldset className="mt-4 rounded-sm border border-[#e0d4b8] bg-[#fffdf6] px-3 py-2">
        <legend className="px-1 text-[11px] font-bold text-[#7b1fa2]">{COPY.sellerNotes}</legend>
        <div className="text-[11px] font-bold text-[#4b0082]">{COPY.seller}</div>
        <p className="mt-1 text-[12px] leading-relaxed text-[#3a302b]">{lot.sellerNotes}</p>
      </fieldset>
      {lot.status === 'sold' ? (
        <>
          <div className="mt-4 h-[30px] rounded-sm border border-[#c8c8c8] bg-[#ececec] px-3 text-center text-[12px] leading-[30px] font-bold text-[#6a6a6a]">
            {COPY.closed}
          </div>
          {soldToVisible && lot.winner ? <SoldToLine winner={lot.winner} /> : null}
        </>
      ) : (
        <button
          type="button"
          onClick={onBid}
          className="mt-4 h-[32px] min-w-[120px] rounded-sm bg-[#ffcc00] px-4 text-[13px] font-bold text-[#3a2200] hover:bg-[#ffe066]"
        >
          {COPY.placeBid}
        </button>
      )}
    </div>
  )
}
