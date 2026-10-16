import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { SOFT_CATEGORIES, SOFT_ITEMS, itemsInCategory, type SoftCategoryId, type SoftItemDef } from '../../game/wahooSoft'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'
import { cn } from '../../utils/cn'
import { playErrorSound } from '../../utils/sounds'
import { RetroIcon, type RetroIconName } from '../os/retroIcons'

type CachedPageId = 'home' | 'soft' | 'downloads' | 'twoch' | 'kernel' | 'mail' | 'messenger'
type PageId = CachedPageId | 'unsupported'

const COPY = strings.netExplorer
const DOWNLOAD_MS = 2000
const DEFAULT_SOFT_CATEGORY: SoftCategoryId = 'data-recovery'
const SEARCH_ADDRESS_PREFIX = 'http://search.wahoo.jp/search?p='

const ADDRESSES: Record<CachedPageId, string> = {
  home: COPY.addressHome,
  soft: COPY.addressSoft,
  downloads: COPY.addressDownloads,
  twoch: COPY.address2ch,
  kernel: COPY.addressKernel,
  mail: COPY.addressMail,
  messenger: COPY.addressMessenger,
}

const BOOKMARKS: Array<{ id: CachedPageId; label: string }> = [
  { id: 'home', label: COPY.bookmarks.home },
  { id: 'soft', label: COPY.bookmarks.soft },
  { id: 'twoch', label: COPY.bookmarks.twoch },
  { id: 'kernel', label: COPY.bookmarks.kernel },
  { id: 'mail', label: COPY.bookmarks.mail },
  { id: 'messenger', label: COPY.bookmarks.messenger },
]

const QUICK_LINKS: Array<{ page: CachedPageId; label: string }> = [
  { page: 'mail', label: COPY.bookmarks.mail },
  { page: 'messenger', label: COPY.bookmarks.messenger },
  { page: 'twoch', label: COPY.bookmarks.twoch },
  { page: 'kernel', label: COPY.bookmarks.kernel },
]

function normalizeQuery(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

function foldText(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function resolveCachedDestination(raw: string): { page: CachedPageId; category?: SoftCategoryId } | null {
  const q = normalizeQuery(raw)
  if (!q) return null

  for (const [id, url] of Object.entries(ADDRESSES) as Array<[CachedPageId, string]>) {
    if (q === normalizeQuery(url) || q === url.toLowerCase()) {
      return { page: id }
    }
  }

  for (const item of SOFT_ITEMS) {
    const name = foldText(item.name)
    const slug = item.id.replace(/-/g, ' ')
    const folded = foldText(q)
    if (
      folded === name ||
      folded === slug ||
      q === item.id ||
      (folded.length >= 5 && (name.includes(folded) || folded.includes(name)))
    ) {
      return { page: item.id === 'sectorrecover' ? 'downloads' : 'soft', category: item.categoryId }
    }
  }

  for (const category of SOFT_CATEGORIES) {
    const label = category.label.toLowerCase()
    if (q === label || (q.length >= 5 && q.includes(label))) {
      return { page: 'soft', category: category.id }
    }
  }

  const hints: Array<{ page: CachedPageId; category?: SoftCategoryId; needles: string[] }> = [
    { page: 'downloads', needles: ['sectorrecover', 'sector recover', 'sector-recover'] },
    { page: 'soft', category: 'virtual-pets', needles: ['virtual pet', 'pets'] },
    { page: 'soft', category: 'default-apps', needles: ['media player', 'picture viewer', 'photo viewer', 'default app'] },
    { page: 'soft', needles: ['soft.wahoo.jp', 'wahoo! soft', 'shareware', 'soft'] },
    { page: 'twoch', needles: ['2ch.net', '2ch'] },
    { page: 'kernel', needles: ['msdn', 'kernel', 'bcd'] },
    { page: 'mail', needles: ['mail.wahoo.jp', 'wahoo! mail', 'mail'] },
    { page: 'messenger', needles: ['messenger.wahoo.jp', 'wahoo! messenger', 'messenger'] },
    { page: 'home', needles: ['www.wahoo.jp', 'wahoo.jp', 'wahoo! home', 'home', 'wahoo'] },
  ]

  for (const entry of hints) {
    if (entry.needles.some((needle) => q === needle || (needle.length >= 5 && q.includes(needle)))) {
      return { page: entry.page, category: entry.category }
    }
  }

  return null
}

function searchAddress(query: string): string {
  return `${SEARCH_ADDRESS_PREFIX}${encodeURIComponent(query.trim())}`
}

export function NetExplorer() {
  const [history, setHistory] = useState<PageId[]>(['home'])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [softCategory, setSoftCategory] = useState<SoftCategoryId>(DEFAULT_SOFT_CATEGORY)
  const [addressValue, setAddressValue] = useState(ADDRESSES.home)
  const [searchValue, setSearchValue] = useState('')
  const [blockedQuery, setBlockedQuery] = useState('')
  const [upgradeError, setUpgradeError] = useState(false)
  const page = history[historyIndex] ?? 'home'
  const canBack = historyIndex > 0
  const canForward = historyIndex < history.length - 1

  const goTo = (next: PageId) => {
    if (history[historyIndex] === next) return
    setHistory((current) => [...current.slice(0, historyIndex + 1), next])
    setHistoryIndex((index) => index + 1)
  }

  const openCached = (destination: { page: CachedPageId; category?: SoftCategoryId }) => {
    if (destination.category) setSoftCategory(destination.category)
    setBlockedQuery('')
    setAddressValue(ADDRESSES[destination.page])
    setSearchValue('')
    goTo(destination.page)
  }

  const openUnsupported = (query: string) => {
    const nextQuery = query.trim()
    setBlockedQuery(nextQuery)
    setAddressValue(searchAddress(nextQuery))
    if (page !== 'unsupported') goTo('unsupported')
  }

  const submitLookup = (raw: string) => {
    const query = raw.trim()
    if (!query) return
    const cached = resolveCachedDestination(query)
    if (cached) {
      setSearchValue('')
      openCached(cached)
      return
    }
    openUnsupported(query)
  }

  const onAddressSubmit = (event: FormEvent) => {
    event.preventDefault()
    submitLookup(addressValue)
  }

  const onSearchSubmit = (event: FormEvent) => {
    event.preventDefault()
    submitLookup(searchValue)
  }

  useEffect(() => {
    if (page === 'unsupported') return
    setAddressValue(ADDRESSES[page])
    setSearchValue('')
    setUpgradeError(false)
  }, [page])

  return (
    <div className="relative flex h-full flex-col bg-[#d4d0c8] font-[Tahoma,'Segoe_UI',sans-serif] text-[16px] text-[#222]">
      <form
        onSubmit={onAddressSubmit}
        className="flex items-center gap-1 border-b border-[#808080] bg-gradient-to-b from-[#e8f0f8] via-[#d0dce8] to-[#b8c8d8] px-1.5 py-1"
      >
        <AeroNavButton disabled={!canBack} onClick={() => setHistoryIndex((index) => index - 1)} label={COPY.back}>
          ←
        </AeroNavButton>
        <AeroNavButton disabled={!canForward} onClick={() => setHistoryIndex((index) => index + 1)} label={COPY.forward}>
          →
        </AeroNavButton>
        <ChromeButton onClick={() => (page === 'unsupported' ? openUnsupported(blockedQuery) : goTo(page))}>
          {COPY.refresh}
        </ChromeButton>
        <ChromeButton onClick={() => openCached({ page: 'home' })}>{COPY.home}</ChromeButton>
        <div className="win7-inset ml-1 flex min-w-0 flex-1 items-center gap-1 bg-white px-2 py-0.5">
          <span className="font-[Georgia,Times,serif] text-[14px] font-bold italic text-[#7b1fa2]">W!</span>
          <input
            value={addressValue}
            onChange={(event) => setAddressValue(event.target.value)}
            aria-label={COPY.addressBarLabel}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-[#1a1a1a] outline-none"
          />
        </div>
        <ChromeButton submit>{COPY.go}</ChromeButton>
      </form>

      <div className="flex items-center gap-2 border-b border-[#c8b35a] bg-gradient-to-b from-[#fff4b0] to-[#e8c84a] px-2 py-1">
        <span className="shrink-0 font-[Georgia,Times,serif] text-[16px] font-bold italic text-[#4b0082]">
          {COPY.toolbarName}
        </span>
        <form onSubmit={onSearchSubmit} className="flex min-w-0 flex-1 items-center gap-1">
          <div className="win7-inset flex min-w-0 flex-1 items-center bg-white px-2 py-0.5">
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={COPY.toolbarSearch}
              aria-label={COPY.toolbarSearch}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[#1a1a1a] outline-none placeholder:text-[#888]"
            />
          </div>
          <ChromeButton submit>{COPY.toolbarSearchButton}</ChromeButton>
        </form>
        <ToolbarBadge icon="mail" label="Mail" onClick={() => openCached({ page: 'mail' })} />
        <ToolbarBadge icon="scroll" label="2ch" onClick={() => openCached({ page: 'twoch' })} />
        <ToolbarBadge icon="help-book" label="MSDN" onClick={() => openCached({ page: 'kernel' })} />
        <ToolbarBadge icon="chat-bubble" label="IM" onClick={() => openCached({ page: 'messenger' })} />
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[#b8b0a0] bg-[#f4f0e4] px-1 py-0.5">
        {BOOKMARKS.map((bookmark) => (
          <button
            key={bookmark.id}
            type="button"
            onClick={() => openCached({ page: bookmark.id })}
            className={cn(
              'flex shrink-0 items-center gap-1 rounded-sm px-2 py-0.5 text-[14px]',
              page === bookmark.id
                ? 'bg-white font-bold text-[#4b0082] shadow-[inset_0_-1px_0_#c8b35a]'
                : 'text-[#333] hover:bg-white/70',
            )}
          >
            <RetroIcon name="document-web" size={20} />
            {bookmark.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-[#ece9d8]">
        {page === 'home' ? (
          <HomePage onNavigate={goTo} onOpenSoft={(category) => openCached({ page: 'soft', category })} />
        ) : page === 'soft' ? (
          <SoftPage
            onNavigate={goTo}
            category={softCategory}
            onSelectCategory={setSoftCategory}
          />
        ) : page === 'downloads' ? (
          <DownloadsPage onNavigate={goTo} />
        ) : page === 'twoch' ? (
          <TwochPage />
        ) : page === 'kernel' ? (
          <KernelPage />
        ) : page === 'mail' ? (
          <MailPage />
        ) : page === 'unsupported' ? (
          <UnsupportedPage
            query={blockedQuery}
            onOpenCached={openCached}
            onUpgrade={() => {
              playErrorSound('target_os')
              setUpgradeError(true)
            }}
          />
        ) : (
          <MessengerPage />
        )}
      </div>

      {upgradeError ? <UpgradeErrorDialog onClose={() => setUpgradeError(false)} /> : null}

      <div className="flex h-[28px] items-center justify-between border-t border-[#808080] bg-gradient-to-b from-[#e8e4dc] to-[#cfcbc3] px-2 text-[14px] text-[#333]">
        <span>{page === 'unsupported' ? COPY.statusUnsupported : COPY.statusOffline}</span>
        <span>{COPY.statusProtected}</span>
      </div>
    </div>
  )
}

function AeroNavButton({
  children,
  disabled,
  onClick,
  label,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={label}
      onClick={(event) => {
        event.preventDefault()
        onClick()
      }}
      className={cn(
        'h-[36px] w-[36px] shrink-0 rounded-full border text-[17px] font-bold',
        'border-[#6f8faf] bg-gradient-to-b from-[#f8fcff] via-[#c8dcec] to-[#7ea0bc]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.25)]',
        disabled ? 'cursor-not-allowed opacity-45' : 'hover:from-white hover:to-[#8eb4d0]',
      )}
    >
      {children}
    </button>
  )
}

function ChromeButton({
  children,
  disabled,
  onClick,
  submit,
}: {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  submit?: boolean
}) {
  return (
    <button
      type={submit ? 'submit' : 'button'}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'win7-raised h-[28px] shrink-0 rounded-sm border border-[#6f6f6f] bg-gradient-to-b from-[#f8f8f8] to-[#d0d0d0] px-2 text-[14px]',
        disabled ? 'cursor-not-allowed text-[#8a8a8a]' : 'text-[#222] hover:from-[#fcfcfc] hover:to-[#d8d8d8]',
      )}
    >
      {children}
    </button>
  )
}

function ToolbarBadge({
  icon,
  label,
  onClick,
}: {
  icon: RetroIconName
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="win7-raised flex h-[24px] items-center gap-1 border border-[#6f6f6f] bg-gradient-to-b from-[#fff8e0] to-[#e0d0a0] px-1.5 text-[13px] font-bold text-[#333]"
    >
      <RetroIcon name={icon} size={20} />
      {label}
    </button>
  )
}

function CacheBanner() {
  return (
    <div className="border-b border-[#c8a000] bg-[#fff3cd] px-3 py-1 text-[16px] text-[#6a5200]">
      {COPY.cacheBanner}
    </div>
  )
}

function CachedFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-auto flex min-h-full w-full max-w-[980px] flex-col border-x text-[16px]', className)}>
      {children}
    </div>
  )
}

function SiteChrome({
  children,
  onNavigate,
}: {
  children: ReactNode
  onNavigate?: (page: PageId) => void
}) {
  return (
    <CachedFrame className="border-[#c8b35a] bg-[#fffef6]">
      <CacheBanner />
      <div className="flex items-center justify-between bg-gradient-to-r from-[#4b0082] via-[#6a1b9a] to-[#ffcc00] px-4 py-3 text-white">
        <div>
          <div className="font-[Georgia,Times,serif] text-[26px] font-bold italic tracking-wide">
            {COPY.siteName}
          </div>
          <div className="text-[13px] tracking-[0.14em] uppercase text-[#fff4b0]">{COPY.siteTagline}</div>
        </div>
        <div className="hidden rounded-sm border border-white/40 bg-black/20 px-2 py-1 text-[13px] sm:block">
          {COPY.visitors}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 border-b border-[#e0c84a] bg-[#fff4b8] px-4 py-1.5 text-[15px] font-bold text-[#4b0082]">
        {COPY.nav.map((item) => {
          if (!onNavigate || item.page === null) {
            return (
              <span key={item.label} className="cursor-default">
                {item.label}
              </span>
            )
          }
          return (
            <button key={item.label} type="button" onClick={() => onNavigate(item.page)} className="hover:underline">
              {item.label}
            </button>
          )
        })}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </CachedFrame>
  )
}

function HomePage({
  onNavigate,
  onOpenSoft,
}: {
  onNavigate: (page: PageId) => void
  onOpenSoft: (category: SoftCategoryId) => void
}) {
  return (
    <SiteChrome onNavigate={onNavigate}>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-[16px] leading-relaxed text-[#333]">{COPY.welcome}</p>

        <div className="border-2 border-[#4b0082] bg-[#fffdf4] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-[Georgia,Times,serif] text-[22px] font-bold italic text-[#4b0082]">
                {COPY.homePage.featureTitle}
              </div>
              <p className="mt-1 text-[16px] leading-snug text-[#333]">{COPY.homePage.featureBlurb}</p>
            </div>
            <div className="hidden rounded-sm border border-dashed border-[#c8b35a] bg-white px-2 py-1 text-center text-[13px] text-[#8a2f4b] sm:block">
              {COPY.bestViewed}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {SOFT_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onOpenSoft(category.id)}
                className="win7-raised min-w-0 border border-[#6f6f6f] bg-gradient-to-b from-[#fff8e0] to-[#f0d878] px-2 py-2 text-left hover:from-white"
              >
                <div className="text-[16px] font-bold text-[#4b0082]">{category.label}</div>
                <div className="mt-0.5 text-[14px] leading-snug text-[#555]">
                  {itemsInCategory(category.id).length} titles
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onOpenSoft(DEFAULT_SOFT_CATEGORY)}
            className="win7-raised mt-3 h-[32px] rounded-sm border border-[#6f6f6f] bg-gradient-to-b from-[#fff4b0] to-[#e0b000] px-3 text-[16px] font-bold text-[#3a2200]"
          >
            {COPY.homePage.browseSoft}
          </button>
        </div>

        <div className="border-2 border-[#4b0082] bg-[#fffdf4] p-3">
          <div className="text-[13px] font-bold tracking-[0.16em] text-[#c45c14] uppercase">
            {COPY.editorPick}
          </div>
          <div className="mt-1 font-[Georgia,Times,serif] text-[22px] font-bold text-[#4b0082]">
            {COPY.productName}
          </div>
          <p className="mt-1 text-[16px] leading-snug text-[#333]">{COPY.productBlurb}</p>
          <button
            type="button"
            onClick={() => onNavigate('downloads')}
            className="win7-raised mt-3 h-[32px] rounded-sm border border-[#6f6f6f] bg-gradient-to-b from-[#b7f08a] to-[#3ea74a] px-3 text-[16px] font-bold text-[#16381a]"
          >
            {COPY.homePage.viewProduct}
          </button>
        </div>

        <div>
          <div className="text-[16px] font-bold text-[#4b0082]">{COPY.homePage.quickLinks}</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {QUICK_LINKS.map((link) => (
              <button
                key={link.page}
                type="button"
                onClick={() => onNavigate(link.page)}
                className="win7-raised h-[28px] rounded-sm border border-[#6f6f6f] bg-gradient-to-b from-[#f8f8f8] to-[#d0d0d0] px-2 text-[16px] text-[#222] hover:from-[#fcfcfc]"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-[#e0c84a] bg-[#fff8d0] p-3">
          <div className="text-[16px] font-bold text-[#4b0082]">{COPY.homePage.whatsNew}</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[16px] leading-snug text-[#333]">
            {COPY.homePage.whatsNewItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </SiteChrome>
  )
}

function SoftPage({
  onNavigate,
  category,
  onSelectCategory,
}: {
  onNavigate: (page: PageId) => void
  category: SoftCategoryId
  onSelectCategory: (id: SoftCategoryId) => void
}) {
  const selected = SOFT_CATEGORIES.find((entry) => entry.id === category) ?? SOFT_CATEGORIES[0]
  const items = itemsInCategory(selected.id)

  return (
    <SiteChrome onNavigate={onNavigate}>
      <div className="border-b border-[#e0c84a] bg-gradient-to-r from-[#fff4b8] to-[#ffe08a] px-4 py-3">
        <div className="font-[Georgia,Times,serif] text-[24px] font-bold italic text-[#4b0082]">
          {COPY.soft.title}
        </div>
        <div className="text-[13px] tracking-[0.14em] uppercase text-[#8a6a00]">{COPY.soft.tagline}</div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(160px,200px)_minmax(0,1fr)]">
        <aside className="border-r border-[#e0c84a] bg-[#fff8d0] p-2">
          {SOFT_CATEGORIES.map((entry) => {
            const count = itemsInCategory(entry.id).length
            const active = entry.id === selected.id
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelectCategory(entry.id)}
                className={cn(
                  'mb-1 w-full rounded-sm px-2 py-1.5 text-left',
                  active
                    ? 'bg-white font-bold text-[#4b0082] shadow-[inset_0_0_0_1px_#c8b35a]'
                    : 'text-[#4b0082] hover:bg-white/70',
                )}
              >
                <div className="text-[16px]">{entry.label}</div>
                <div className="text-[14px] font-normal text-[#666]">{count}</div>
              </button>
            )
          })}
        </aside>
        <div className="flex min-w-0 flex-col gap-2 p-3">
          <div>
            <div className="text-[16px] font-bold text-[#4b0082]">{selected.label}</div>
            <p className="mt-0.5 text-[16px] leading-snug text-[#555]">{selected.description}</p>
          </div>
          {items.map((item) => (
            <SoftItemCard
              key={item.id}
              item={item}
              onOpen={item.id === 'sectorrecover' ? () => onNavigate('downloads') : undefined}
            />
          ))}
        </div>
      </div>
    </SiteChrome>
  )
}

function SoftItemCard({
  item,
  onOpen,
}: {
  item: SoftItemDef
  onOpen?: () => void
}) {
  const hasRecoveryTool = useGameStore((state) => state.hasRecoveryTool)
  const available = item.status === 'available'
  const installed = available && item.id === 'sectorrecover' && hasRecoveryTool
  const className = cn(
    'w-full rounded-sm border border-[#d8c878] bg-white p-2 text-left',
    available && onOpen && 'hover:border-[#4b0082] hover:bg-[#fffdf4]',
  )

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-bold text-[#1a1a1a]">{item.name}</div>
          <p className="mt-0.5 text-[16px] leading-snug text-[#555]">{item.blurb}</p>
        </div>
        {installed ? (
          <span className="shrink-0 rounded-sm bg-[#e8f5e0] px-1.5 py-0.5 text-[13px] font-bold text-[#1b7a3a]">
            {COPY.soft.installed}
          </span>
        ) : available ? (
          <span className="shrink-0 rounded-sm bg-[#fff4b0] px-1.5 py-0.5 text-[13px] font-bold text-[#4b0082]">
            {COPY.soft.free}
          </span>
        ) : (
          <span className="shrink-0 rounded-sm bg-[#ececec] px-1.5 py-0.5 text-[13px] font-bold text-[#888]">
            {COPY.soft.comingSoon}
          </span>
        )}
      </div>
      <div className="mt-1.5 text-[14px] text-[#666]">
        {item.version} · {item.size} · {item.license}
      </div>
    </>
  )

  if (available && onOpen) {
    return (
      <button type="button" onClick={onOpen} className={className}>
        {body}
      </button>
    )
  }

  return <div className={className}>{body}</div>
}

function UnsupportedPage({
  query,
  onOpenCached,
  onUpgrade,
}: {
  query: string
  onOpenCached: (destination: { page: CachedPageId; category?: SoftCategoryId }) => void
  onUpgrade: () => void
}) {
  return (
    <CachedFrame className="border-[#c8b35a] bg-[#f4f0e8]">
      <CacheBanner />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="border border-[#c45c14] bg-[#fff4e5] p-4">
          <div className="text-[16px] font-bold tracking-[0.12em] text-[#c45c14] uppercase">
            {COPY.unsupported.subtitle}
          </div>
          <div className="mt-1 font-[Georgia,Times,serif] text-[24px] font-bold text-[#4b0082]">
            {COPY.unsupported.title}
          </div>
          {query ? (
            <div className="mt-2 border border-[#e0c84a] bg-white px-2 py-1 font-mono text-[16px] text-[#333]">
              <span className="text-[#888]">{COPY.unsupported.queryLabel}: </span>
              {query}
            </div>
          ) : null}
          <p className="mt-2 text-[16px] leading-relaxed text-[#333]">{COPY.unsupported.body}</p>
          <button
            type="button"
            title={COPY.unsupported.upgradeHint}
            onClick={onUpgrade}
            className="win7-raised mt-3 h-[32px] rounded-sm border border-[#6f6f6f] bg-gradient-to-b from-[#b7f08a] to-[#3ea74a] px-3 text-[16px] font-bold text-[#16381a] hover:from-[#c8ff9c]"
          >
            {COPY.unsupported.upgrade}
          </button>
        </div>
        <div className="border border-[#e0c84a] bg-[#fffdf4] p-3">
          <div className="text-[16px] font-bold text-[#4b0082]">{COPY.unsupported.cachedTitle}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {BOOKMARKS.map((bookmark) => (
              <button
                key={bookmark.id}
                type="button"
                onClick={() => onOpenCached({ page: bookmark.id })}
                className="win7-raised h-[28px] rounded-sm border border-[#6f6f6f] bg-gradient-to-b from-[#f8f8f8] to-[#d0d0d0] px-2 text-[16px] text-[#222] hover:from-[#fcfcfc]"
              >
                {bookmark.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </CachedFrame>
  )
}

function UpgradeErrorDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#00000040] p-4">
      <div
        role="alertdialog"
        aria-labelledby="wahoo-upgrade-error-title"
        aria-describedby="wahoo-upgrade-error-body"
        className="w-[min(480px,100%)] border border-[#003c74] bg-[#ece9d8] shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
      >
        <div
          id="wahoo-upgrade-error-title"
          className="bg-gradient-to-r from-[#0a246a] via-[#3a6ea5] to-[#a6caf0] px-2 py-1 text-[16px] font-bold text-white"
        >
          {COPY.unsupported.upgradeErrorTitle}
        </div>
        <div className="flex gap-3 bg-[#f0f0f0] px-4 py-4">
          <RetroIcon name="error" size={40} className="mt-0.5" />
          <p
            id="wahoo-upgrade-error-body"
            className="whitespace-pre-line text-[16px] leading-relaxed text-[#222]"
          >
            {COPY.unsupported.upgradeErrorBody}
          </p>
        </div>
        <div className="flex justify-center border-t border-[#d0d0d0] bg-[#f0f0f0] py-2">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="win7-raised h-[36px] min-w-[120px] rounded-sm border border-[#6f6f6f] bg-gradient-to-b from-[#f8f8f8] to-[#d0d0d0] px-4 text-[16px] text-[#222]"
          >
            {COPY.unsupported.upgradeErrorOk}
          </button>
        </div>
      </div>
    </div>
  )
}

function DownloadsPage({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  return (
    <SiteChrome onNavigate={onNavigate}>
      <div className="p-4">
        <button
          type="button"
          onClick={() => onNavigate('soft')}
          className="mb-3 text-[16px] font-bold text-[#4b0082] hover:underline"
        >
          {COPY.soft.breadcrumb}
        </button>
        <ProductDownload />
        <p className="mt-3 text-[16px] leading-snug text-[#6a5200]">{COPY.soft.addonsMovedNote}</p>
      </div>
    </SiteChrome>
  )
}

function ProductDownload() {
  const hasRecoveryTool = useGameStore((state) => state.hasRecoveryTool)
  const downloadRecoveryTool = useGameStore((state) => state.downloadRecoveryTool)
  const [progress, setProgress] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const downloading = startedAt !== null && !hasRecoveryTool

  useEffect(() => {
    if (startedAt === null || hasRecoveryTool) return
    const id = window.setInterval(() => {
      const next = Math.min(100, Math.round(((performance.now() - startedAt) / DOWNLOAD_MS) * 100))
      setProgress(next)
      if (next >= 100) {
        window.clearInterval(id)
        downloadRecoveryTool()
        setStartedAt(null)
        setProgress(0)
      }
    }, 50)
    return () => window.clearInterval(id)
  }, [startedAt, hasRecoveryTool, downloadRecoveryTool])

  return (
    <div className="border-2 border-[#4b0082] bg-[#fffdf4] p-3">
      <div className="text-[13px] font-bold tracking-[0.16em] text-[#c45c14] uppercase">
        {COPY.editorPick}
      </div>
      <div className="mt-1 font-[Georgia,Times,serif] text-[24px] font-bold text-[#4b0082]">
        {COPY.productName}
      </div>
      <p className="mt-1 text-[16px] leading-snug text-[#333]">{COPY.productBlurb}</p>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[16px] text-[#555] sm:grid-cols-4">
        <span>{COPY.version}</span>
        <span>{COPY.size}</span>
        <span>{COPY.license}</span>
        <span>{COPY.rating}</span>
      </div>
      <div className="mt-1 text-[16px] text-[#8a6a00]">
        {hasRecoveryTool ? COPY.downloadsOne : COPY.downloads}
      </div>

      {downloading ? (
        <div className="mt-3">
          <div className="mb-1 text-[16px] text-[#555]">{COPY.downloading}</div>
          <div className="win7-inset h-[16px] overflow-hidden bg-white">
            <div
              className="h-full bg-[repeating-linear-gradient(45deg,#3d7ab5_0_8px,#5a9ad4_8px_16px)] transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={hasRecoveryTool}
          onClick={() => {
            setProgress(0)
            setStartedAt(performance.now())
          }}
          className={cn(
            'win7-raised mt-3 h-[34px] min-w-[160px] rounded-sm border border-[#6f6f6f] px-3 text-[15px] font-bold',
            hasRecoveryTool
              ? 'cursor-not-allowed bg-gradient-to-b from-[#e8e8e8] to-[#c8c8c8] text-[#6a6a6a]'
              : 'bg-gradient-to-b from-[#b7f08a] to-[#3ea74a] text-[#16381a] hover:from-[#c8ff9c]',
          )}
        >
          {hasRecoveryTool ? COPY.installed : COPY.download}
        </button>
      )}
    </div>
  )
}

function TwochPage() {
  const cache = COPY.cache
  return (
    <CachedFrame className="border-[#b8b0a0] bg-[#efefef]">
      <CacheBanner />
      <div className="border-b border-[#800000] bg-[#f0e0d6] px-3 py-2">
        <div className="font-bold text-[#800000]">{cache.twochTitle}</div>
        <div className="text-[16px] text-[#666]">{cache.twochMeta}</div>
      </div>
      <div className="space-y-1 p-3 font-mono text-[16px] leading-relaxed text-[#111]">
        {cache.twochLines.map((line) => (
          <p key={line} className={line.startsWith('　') ? 'pl-4 text-[#333]' : 'font-bold'}>
            {line}
          </p>
        ))}
      </div>
    </CachedFrame>
  )
}

function KernelPage() {
  const cache = COPY.cache
  return (
    <CachedFrame className="border-[#99b3d4] bg-white">
      <CacheBanner />
      <div className="border-b border-[#003399] bg-[#e8eef8] px-4 py-3">
        <div className="text-[18px] font-bold text-[#003399]">{cache.kernelTitle}</div>
        <div className="text-[16px] text-[#555]">{cache.kernelMeta}</div>
      </div>
      <div className="space-y-3 px-4 py-3 text-[16px] leading-relaxed text-[#222]">
        {cache.kernelBody.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </CachedFrame>
  )
}

function MailPage() {
  const cache = COPY.cache
  return (
    <CachedFrame className="border-[#c8b35a] bg-[#f4f0e8]">
      <CacheBanner />
      <div className="bg-gradient-to-r from-[#4b0082] to-[#ffcc00] px-4 py-2 text-white">
        <div className="font-[Georgia,Times,serif] text-[22px] font-bold italic">{cache.mailTitle}</div>
        <div className="text-[16px] text-white/85">{cache.mailMeta}</div>
      </div>
      <p className="px-4 py-2 text-[16px] text-[#8a2f4b]">{cache.mailEmpty}</p>
      <table className="w-full border-t border-[#d0c8b0] text-left text-[16px]">
        <thead className="bg-[#ece4d0]">
          <tr>
            <th className="px-3 py-1 font-bold">From</th>
            <th className="px-3 py-1 font-bold">Subject</th>
            <th className="px-3 py-1 font-bold">Date</th>
          </tr>
        </thead>
        <tbody>
          {cache.mailRows.map((row) => (
            <tr key={row.subject} className="border-t border-[#e8e0d0] bg-white">
              <td className="px-3 py-1">{row.from}</td>
              <td className="px-3 py-1 text-[#003399]">{row.subject}</td>
              <td className="px-3 py-1 text-[#666]">{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CachedFrame>
  )
}

function MessengerPage() {
  const cache = COPY.cache
  return (
    <CachedFrame className="border-[#6f8faf] bg-[#dce6f0]">
      <CacheBanner />
      <div className="m-4 rounded-sm border border-[#6f8faf] bg-gradient-to-b from-[#f4f8fc] to-[#c8d8e8] p-4">
        <div className="text-[18px] font-bold text-[#003399]">{cache.messengerTitle}</div>
        <div className="mt-1 text-[16px] text-[#555]">{cache.messengerMeta}</div>
        <p className="mt-3 text-[16px] leading-relaxed text-[#333]">{cache.messengerBody}</p>
      </div>
    </CachedFrame>
  )
}
