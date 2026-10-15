import { ARCADE_CATALOG } from '../../../game/arcadeCatalog'
import { AUCTION_LOTS, resolveLot } from '../../../game/wahooAuctions'
import { strings } from '../../../i18n'
import { useGameStore } from '../../../store/useGameStore'
import { KEY_ARTICLE_ID, UNI_ARTICLE_ID } from './constants'
import type { NewsArticle } from './WahooNews'

const COPY = strings.wahoo
const ARTICLES = strings.news.articles
const AUCTION_PREVIEWS = AUCTION_LOTS.slice(0, 3)

function articleById(id: string): NewsArticle | undefined {
  return ARTICLES.find((article) => article.id === id)
}

export function WahooHome({
  onOpenArticle,
  onOpenAuctions,
  onOpenGaming,
}: {
  onOpenArticle: (article: NewsArticle) => void
  onOpenAuctions: () => void
  onOpenGaming: () => void
}) {
  const isColdCasePublished = useGameStore((state) => state.prologue.isColdCasePublished)
  const auctionLot404Sold = useGameStore((state) => state.prologue.auctionLot404Sold)
  const latest = articleById(isColdCasePublished ? KEY_ARTICLE_ID : UNI_ARTICLE_ID)
  const auctionPreviews = AUCTION_PREVIEWS.map((lot) =>
    resolveLot(lot, { auctionLot404Sold }),
  )

  return (
    <div className="h-full overflow-auto bg-[#f4f5f7]">
      <header className="border-b border-[#eadff4] bg-gradient-to-r from-[#4a148c] via-[#7b1fa2] to-[#ffcc00] px-5 py-3 text-white">
        <div className="font-[Georgia,Times,serif] text-[28px] leading-none font-bold italic tracking-tight">
          {COPY.brand}
          <span className="ml-1 text-[16px] not-italic font-semibold text-white/90">
            {COPY.brandNet.replace('Wahoo! ', '')}
          </span>
        </div>
        <div className="mt-1 text-[11px] tracking-[0.12em] text-white/80 uppercase">{COPY.tagline}</div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)_220px] gap-4 p-4">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onOpenAuctions}
            className="rounded-sm border border-[#e0d4c4] bg-white p-4 text-left hover:border-[#7b1fa2]"
          >
            <div className="text-[10px] font-bold tracking-[0.14em] text-[#7b1fa2] uppercase">
              {COPY.home.auctionsWidget}
            </div>
            <div className="mt-1 text-[16px] leading-snug font-bold text-[#1a1a1a]">
              {COPY.home.auctionsWidgetTitle}
            </div>
            <p className="mt-1 text-[12px] text-[#5a5e66]">{COPY.auctions.subheading}</p>
            <ul className="mt-3 divide-y divide-[#eee6dc] rounded-sm border border-[#eee6dc]">
              {auctionPreviews.map((lot) => (
                <li key={lot.id} className="flex items-baseline justify-between gap-3 px-2.5 py-1.5">
                  <span className="min-w-0 truncate text-[12px] text-[#2c3038]">
                    <span className="font-mono text-[11px] text-[#8a6a5e]">#{lot.lotNumber}</span>{' '}
                    {lot.title}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] font-semibold text-[#7b1fa2]">
                    {lot.status === 'sold' ? COPY.auctions.sold : lot.bid}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-[12px] font-semibold text-[#7b1fa2]">
              {COPY.home.auctionsWidgetCta} →
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenGaming}
            className="rounded-sm border border-[#e0d4c4] bg-white p-4 text-left hover:border-[#7b1fa2]"
          >
            <div className="text-[10px] font-bold tracking-[0.14em] text-[#7b1fa2] uppercase">
              {COPY.home.gamingWidget}
            </div>
            <p className="mt-1 text-[12px] text-[#5a5e66]">{COPY.gaming.subheading}</p>
            <ul className="mt-3 space-y-2">
              {ARCADE_CATALOG.map((game) => (
                <li key={game.id} className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-semibold text-[#1a1a1a]">{game.title}</span>
                  <span className="shrink-0 font-mono text-[11px] text-[#8a6a5e]">
                    {game.version} · {game.rating}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-[12px] font-semibold text-[#7b1fa2]">
              {COPY.home.gamingWidgetCta} →
            </div>
          </button>
        </div>

        <aside className="flex flex-col gap-3">
          <div className="rounded-sm border border-[#e2e4ea] bg-white p-3">
            <div className="text-[10px] font-bold tracking-[0.14em] text-[#7b1fa2] uppercase">
              {COPY.home.weatherTitle}
            </div>
            <div className="mt-1 text-[15px] font-bold text-[#1a1a1a]">{COPY.home.weather}</div>
            <p className="mt-1 text-[12px] text-[#5a5e66]">{COPY.home.campusStatus}</p>
          </div>

          {latest ? (
            <button
              type="button"
              onClick={() => onOpenArticle(latest)}
              className="rounded-sm border border-[#e2e4ea] bg-white p-3 text-left hover:border-[#7b1fa2]"
            >
              <div className="text-[10px] font-bold tracking-[0.14em] text-[#7b1fa2] uppercase">
                {COPY.home.latestNews}
              </div>
              <div className="mt-1 text-[10px] font-bold tracking-[0.14em] text-[#c45c78] uppercase">
                {latest.kicker}
              </div>
              <div className="mt-1 text-[14px] leading-snug font-bold text-[#1a1a1a]">{latest.title}</div>
              <p className="mt-1 text-[12px] text-[#5a5e66]">{latest.excerpt}</p>
            </button>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
