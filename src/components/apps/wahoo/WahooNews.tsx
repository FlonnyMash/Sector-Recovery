import { strings } from '../../../i18n'
import { useGameStore } from '../../../store/useGameStore'
import { cn } from '../../../utils/cn'
import { KEY_ARTICLE_ID, UNI_ARTICLE_ID } from './constants'

export type NewsArticle = (typeof strings.news.articles)[number]

const COPY = strings.wahoo.news
const ARTICLES = strings.news.articles

export function WahooNews({
  onOpenArticle,
  onOpenAuctions,
}: {
  onOpenArticle: (article: NewsArticle) => void
  onOpenAuctions: () => void
}) {
  const hasReadTargetArticle = useGameStore((state) => state.prologue.hasReadTargetArticle)
  const isColdCasePublished = useGameStore((state) => state.prologue.isColdCasePublished)
  const featured = ARTICLES.find((article) => article.id === KEY_ARTICLE_ID)
  const uni = ARTICLES.find((article) => article.id === UNI_ARTICLE_ID)
  const rest = ARTICLES.filter(
    (article) => article.id !== KEY_ARTICLE_ID && article.id !== UNI_ARTICLE_ID,
  )

  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_200px] gap-4 overflow-auto p-4">
      <div className="grid content-start gap-3">
        {isColdCasePublished && featured ? (
          <button
            type="button"
            onClick={() => onOpenArticle(featured)}
            className="rounded-sm border-2 border-[#c62828] bg-[#1c1216] p-3 text-left text-[#f3e6dc] hover:bg-[#261820]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.14em] text-[#ff8a80] uppercase">
                {COPY.featured}
              </span>
              {hasReadTargetArticle ? null : (
                <span className="rounded-sm bg-[#e53935] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                  {COPY.unread}
                </span>
              )}
            </div>
            <div className="mt-1 text-[10px] font-bold tracking-[0.14em] text-[#e8a0b0] uppercase">
              {featured.kicker}
            </div>
            <div className="mt-1 text-[16px] leading-snug font-bold">{featured.title}</div>
            <div className="mt-1 text-[11px] text-[#c9b4aa]">
              {featured.date} · {featured.author}
            </div>
            <p className="mt-2 text-[12px] text-[#ddd0c6]">{featured.excerpt}</p>
          </button>
        ) : null}

        {uni ? <ArticleCard article={uni} onOpen={onOpenArticle} highlight /> : null}

        {isColdCasePublished ? (
          <>
            <div className="text-[11px] font-bold tracking-[0.12em] text-[#7b1fa2] uppercase">{COPY.latest}</div>
            {rest.map((article) => (
              <ArticleCard key={article.id} article={article} onOpen={onOpenArticle} />
            ))}
          </>
        ) : null}
      </div>
      <aside>
        <button
          type="button"
          onClick={onOpenAuctions}
          className="w-full rounded-sm border-2 border-dashed border-[#c8a000] bg-[#fff8d0] p-3 text-left hover:border-[#7b1fa2] hover:bg-[#fff4b0]"
        >
          <div className="text-[10px] font-bold tracking-[0.14em] text-[#8a2f4b] uppercase">
            {strings.wahoo.home.sidebarAdTitle}
          </div>
          <p className="mt-1 text-[12px] leading-snug font-semibold text-[#3a2200]">
            {strings.wahoo.home.sidebarAd}
          </p>
          <div className="mt-2 text-[11px] font-bold text-[#7b1fa2]">{strings.wahoo.home.sidebarAdCta} →</div>
        </button>
      </aside>
    </div>
  )
}

function ArticleCard({
  article,
  onOpen,
  highlight,
}: {
  article: NewsArticle
  onOpen: (article: NewsArticle) => void
  highlight?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(article)}
      className={cn(
        'cursor-pointer rounded-sm border p-3 text-left transition-colors',
        highlight
          ? 'border-[#c8a000] bg-[#fffdf4] hover:border-[#7b1fa2]'
          : 'border-[#e2e4ea] bg-white hover:border-[#7b1fa2] hover:bg-[#faf7ff]',
      )}
    >
      <div className="text-[10px] font-bold tracking-[0.14em] text-[#c45c78] uppercase">{article.kicker}</div>
      <div className="mt-1 text-[15px] leading-snug font-bold">{article.title}</div>
      <div className="mt-1 text-[11px] text-[#8a6a5e]">
        {article.date} · {article.author}
      </div>
      <div className="mt-2 text-[12px] text-[#5a463e]">{article.excerpt}</div>
    </button>
  )
}
