import { useEffect, useState } from 'react'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'
import { cn } from '../../utils/cn'

const KEY_ARTICLE_ID = 'ghost-partition'

type Article = (typeof strings.news.articles)[number]

export function NewsBrowser() {
  const [article, setArticle] = useState<Article | null>(null)
  const markTargetArticleRead = useGameStore((state) => state.markTargetArticleRead)

  useEffect(() => {
    if (article?.id === KEY_ARTICLE_ID) {
      markTargetArticleRead()
    }
  }, [article, markTargetArticleRead])

  const address = article
    ? `${strings.news.addressArticle}/${article.id}`
    : strings.news.addressHome

  return (
    <div className="flex h-full flex-col bg-[#f7f3ef] font-[Tahoma,'Segoe_UI',sans-serif] text-[13px] text-[#2b2420]">
      <div className="flex items-center gap-2 border-b border-[#d8c4b8] bg-[#efe4dc] px-2 py-1.5">
        <button
          type="button"
          disabled={!article}
          onClick={() => setArticle(null)}
          className={cn(
            'h-[24px] rounded-sm border px-2 text-[11px]',
            article
              ? 'border-[#b08978] bg-white text-[#5a3a32] hover:bg-[#fff8f4]'
              : 'cursor-not-allowed border-[#d8c4b8] bg-[#f3ebe6] text-[#b09a92]',
          )}
        >
          ← {strings.news.back}
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-sm border border-[#c9b0a4] bg-white px-2 py-1 text-[11px] text-[#5a3a32]">
          <span className="text-[#c45c78]">●</span>
          <span className="truncate">{address}</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-[#e2b3c0] bg-gradient-to-r from-[#f7c1d0] via-[#fbe2d4] to-[#f7c1d0] px-4 py-2">
        <div>
          <div className="text-[16px] font-bold tracking-wide text-[#8a2f4b]">
            {strings.news.portalName}
          </div>
          <div className="text-[10px] tracking-[0.12em] text-[#8a5a4a] uppercase">
            {strings.news.portalTagline}
          </div>
        </div>
        <div className="hidden text-[11px] text-[#8a5a4a] sm:block">{strings.news.ticker}</div>
      </div>

      <div className="flex gap-3 border-b border-[#ead5cc] bg-[#fff8f4] px-4 py-1.5 text-[11px] font-semibold text-[#8a2f4b]">
        {strings.news.nav.map((item) => (
          <span key={item} className="cursor-default">
            {item}
          </span>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {article ? <ArticleView article={article} /> : <ArticleList onOpen={setArticle} />}
      </div>
    </div>
  )
}

function ArticleList({ onOpen }: { onOpen: (article: Article) => void }) {
  return (
    <div className="grid gap-3 p-4">
      {strings.news.articles.map((article) => {
        const isKey = article.id === KEY_ARTICLE_ID
        return (
          <button
            key={article.id}
            type="button"
            onClick={() => onOpen(article)}
            className={cn(
              'cursor-pointer rounded-sm border p-3 text-left transition-colors',
              isKey
                ? 'border-[#7a4a58] bg-[#2b2228] text-[#f3e6dc] hover:bg-[#352830]'
                : 'border-[#e2cfc4] bg-white hover:border-[#d46a8a] hover:bg-[#fff8f4]',
            )}
          >
            <div
              className={cn(
                'text-[10px] font-bold tracking-[0.14em] uppercase',
                isKey ? 'text-[#e8a0b0]' : 'text-[#c45c78]',
              )}
            >
              {article.kicker}
            </div>
            <div className="mt-1 text-[15px] leading-snug font-bold">{article.title}</div>
            <div className={cn('mt-1 text-[11px]', isKey ? 'text-[#c9b4aa]' : 'text-[#8a6a5e]')}>
              {article.date} · {article.author}
            </div>
            <div className={cn('mt-2 text-[12px]', isKey ? 'text-[#ddd0c6]' : 'text-[#5a463e]')}>
              {article.excerpt}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function ArticleView({ article }: { article: Article }) {
  const isKey = article.id === KEY_ARTICLE_ID
  return (
    <article
      className={cn(
        'mx-auto max-w-[640px] px-5 py-4',
        isKey ? 'bg-[#241c21] text-[#efe6df]' : 'bg-[#fffdfb] text-[#2b2420]',
      )}
    >
      <div
        className={cn(
          'text-[10px] font-bold tracking-[0.16em] uppercase',
          isKey ? 'text-[#e8a0b0]' : 'text-[#c45c78]',
        )}
      >
        {article.kicker}
      </div>
      <h1 className="mt-2 text-[22px] leading-tight font-bold">{article.title}</h1>
      <div className={cn('mt-2 text-[11px]', isKey ? 'text-[#c9b4aa]' : 'text-[#8a6a5e]')}>
        {article.date} · {strings.news.by} {article.author}
      </div>
      <div
        className={cn(
          'mt-4 space-y-3 text-[13px] leading-relaxed',
          isKey ? 'text-[#e5d8cf]' : 'text-[#3a302b]',
        )}
      >
        {article.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  )
}
