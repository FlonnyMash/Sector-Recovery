import { useEffect, useState } from 'react'
import { strings } from '../../../i18n'
import { useGameStore } from '../../../store/useGameStore'
import type { AuctionLotId, WahooTab } from '../../../types/game'
import { cn } from '../../../utils/cn'
import { KEY_ARTICLE_ID, UNI_ARTICLE_ID } from './constants'
import { WahooAuctions } from './WahooAuctions'
import { WahooGaming } from './WahooGaming'
import { WahooHome } from './WahooHome'
import { WahooNews, type NewsArticle } from './WahooNews'

export type { WahooTab }

const COPY = strings.wahoo

const ADDRESSES: Record<WahooTab, string> = {
  home: COPY.addresses.home,
  news: COPY.addresses.news,
  auctions: COPY.addresses.auctions,
  gaming: COPY.addresses.gaming,
}

const BOOKMARKS: Array<{ id: WahooTab; label: string }> = [
  { id: 'home', label: COPY.bookmarks.home },
  { id: 'news', label: COPY.bookmarks.news },
  { id: 'auctions', label: COPY.bookmarks.auctions },
  { id: 'gaming', label: COPY.bookmarks.gaming },
]

export function WahooNet() {
  const [tab, setTab] = useState<WahooTab>('home')
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [selectedLotId, setSelectedLotId] = useState<AuctionLotId | null>(null)
  const markTargetArticleRead = useGameStore((state) => state.markTargetArticleRead)
  const newsArticleRequest = useGameStore((state) => state.newsArticleRequest)
  const clearNewsArticleRequest = useGameStore((state) => state.clearNewsArticleRequest)
  const auctionLotRequest = useGameStore((state) => state.auctionLotRequest)
  const clearAuctionLotRequest = useGameStore((state) => state.clearAuctionLotRequest)
  const wahooTabRequest = useGameStore((state) => state.wahooTabRequest)
  const clearWahooTabRequest = useGameStore((state) => state.clearWahooTabRequest)
  const isColdCasePublished = useGameStore((state) => state.prologue.isColdCasePublished)

  useEffect(() => {
    if (article?.id === KEY_ARTICLE_ID) {
      markTargetArticleRead()
    }
  }, [article, markTargetArticleRead])

  useEffect(() => {
    if (!newsArticleRequest) return
    const found = strings.news.articles.find((item) => item.id === newsArticleRequest)
    if (found && (found.id !== KEY_ARTICLE_ID || isColdCasePublished)) {
      setTab('news')
      setArticle(found)
      setSelectedLotId(null)
    }
    clearNewsArticleRequest()
  }, [newsArticleRequest, clearNewsArticleRequest, isColdCasePublished])

  useEffect(() => {
    if (!auctionLotRequest) return
    setArticle(null)
    setTab('auctions')
    setSelectedLotId(auctionLotRequest)
    clearAuctionLotRequest()
  }, [auctionLotRequest, clearAuctionLotRequest])

  useEffect(() => {
    if (!wahooTabRequest) return
    setArticle(null)
    setSelectedLotId(null)
    setTab(wahooTabRequest)
    clearWahooTabRequest()
  }, [wahooTabRequest, clearWahooTabRequest])

  const goTab = (next: WahooTab) => {
    setArticle(null)
    setSelectedLotId(null)
    setTab(next)
  }

  const openArticle = (next: NewsArticle) => {
    setTab('news')
    setArticle(next)
  }

  const address = article
    ? `${COPY.addresses.article}/${article.id}`
    : selectedLotId && tab === 'auctions'
      ? `${COPY.addresses.auctions}/${selectedLotId}`
      : ADDRESSES[tab]

  return (
    <div className="flex h-full flex-col bg-[#f4f5f7] font-['Segoe_UI',Tahoma,sans-serif] text-[13px] text-[#1a1a1a]">
      <div className="flex items-center gap-2 border-b border-[#e2e4ea] bg-white px-3 py-2">
        <button
          type="button"
          disabled={!article && !selectedLotId && tab === 'home'}
          onClick={() => {
            if (article) {
              setArticle(null)
              return
            }
            if (selectedLotId) {
              setSelectedLotId(null)
              return
            }
            goTab('home')
          }}
          className={cn(
            'h-[28px] rounded-full border px-3 text-[12px]',
            article || selectedLotId || tab !== 'home'
              ? 'border-[#d0d4dc] bg-white text-[#333] hover:bg-[#f6f7f9]'
              : 'cursor-not-allowed border-[#eceef2] bg-[#f6f7f9] text-[#b0b4bc]',
          )}
        >
          ← {COPY.back}
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-[#d8dce4] bg-[#f6f7f9] px-3 py-1.5 text-[12px] text-[#4a4e58]">
          <span className="font-bold text-[#7b1fa2]">W</span>
          <span className="truncate">{address}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-[#ece4f4] bg-[#faf7ff] px-2 py-1">
        {BOOKMARKS.map((bookmark) => {
          const active = !article && tab === bookmark.id
          return (
            <button
              key={bookmark.id}
              type="button"
              onClick={() => goTab(bookmark.id)}
              className={cn(
                'rounded-sm px-3 py-1 text-[12px] font-semibold',
                active
                  ? 'bg-white text-[#7b1fa2] shadow-[0_1px_0_#d8c8ec]'
                  : 'text-[#5a3d78] hover:bg-white/80',
              )}
            >
              {bookmark.label}
            </button>
          )
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {article ? (
          <ArticleView article={article} onOpenAuctions={() => goTab('auctions')} />
        ) : tab === 'home' ? (
          <WahooHome
            onOpenArticle={openArticle}
            onOpenAuctions={() => goTab('auctions')}
            onOpenGaming={() => goTab('gaming')}
          />
        ) : tab === 'news' ? (
          <WahooNews onOpenArticle={openArticle} onOpenAuctions={() => goTab('auctions')} />
        ) : tab === 'auctions' ? (
          <WahooAuctions selectedLotId={selectedLotId} onSelectLot={setSelectedLotId} />
        ) : (
          <WahooGaming />
        )}
      </div>
    </div>
  )
}

function ArticleView({
  article,
  onOpenAuctions,
}: {
  article: NewsArticle
  onOpenAuctions: () => void
}) {
  const isKey = article.id === KEY_ARTICLE_ID
  const isUni = article.id === UNI_ARTICLE_ID

  return (
    <article
      className={cn(
        'h-full overflow-auto px-6 py-5',
        isKey ? 'bg-[#241c21] text-[#efe6df]' : 'bg-white text-[#1a1a1a]',
      )}
    >
      <div className="mx-auto max-w-[680px]">
        <div
          className={cn(
            'text-[10px] font-bold tracking-[0.16em] uppercase',
            isKey ? 'text-[#e8a0b0]' : 'text-[#c62828]',
          )}
        >
          {article.kicker}
        </div>
        <h1 className="mt-2 text-[22px] leading-tight font-bold">{article.title}</h1>
        <div className={cn('mt-2 text-[11px]', isKey ? 'text-[#c9b4aa]' : 'text-[#6a6e76]')}>
          {article.date} · {strings.news.by} {article.author}
        </div>
        <div
          className={cn(
            'mt-4 space-y-3 text-[13px] leading-relaxed',
            isKey ? 'text-[#e5d8cf]' : 'text-[#2c3038]',
          )}
        >
          {article.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        {isUni ? (
          <button
            type="button"
            onClick={onOpenAuctions}
            className="mt-5 inline-flex h-[34px] items-center rounded-sm bg-[#7b1fa2] px-3 text-[12px] font-bold text-white hover:bg-[#6a1b9a]"
          >
            {COPY.news.viewAuctions}
          </button>
        ) : null}
      </div>
    </article>
  )
}
