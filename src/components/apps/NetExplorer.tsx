import { useEffect, useState, type ReactNode } from 'react'
import { UPGRADES, getUpgradeCost } from '../../game/upgrades'
import type { UpgradeId } from '../../game/upgrades'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'
import { cn } from '../../utils/cn'
import { formatDataSize } from '../../utils/format'

type PageId = 'home' | 'downloads' | 'twoch' | 'kernel' | 'mail' | 'messenger'

const COPY = strings.netExplorer
const DOWNLOAD_MS = 2000

const ADDRESSES: Record<PageId, string> = {
  home: COPY.addressHome,
  downloads: COPY.addressDownloads,
  twoch: COPY.address2ch,
  kernel: COPY.addressKernel,
  mail: COPY.addressMail,
  messenger: COPY.addressMessenger,
}

const BOOKMARKS: Array<{ id: PageId; label: string }> = [
  { id: 'home', label: COPY.bookmarks.home },
  { id: 'downloads', label: COPY.bookmarks.downloads },
  { id: 'twoch', label: COPY.bookmarks.twoch },
  { id: 'kernel', label: COPY.bookmarks.kernel },
  { id: 'mail', label: COPY.bookmarks.mail },
  { id: 'messenger', label: COPY.bookmarks.messenger },
]

export function NetExplorer() {
  const [history, setHistory] = useState<PageId[]>(['home'])
  const [historyIndex, setHistoryIndex] = useState(0)
  const page = history[historyIndex] ?? 'home'
  const canBack = historyIndex > 0
  const canForward = historyIndex < history.length - 1

  const goTo = (next: PageId) => {
    if (history[historyIndex] === next) return
    setHistory((current) => [...current.slice(0, historyIndex + 1), next])
    setHistoryIndex((index) => index + 1)
  }

  return (
    <div className="flex h-full flex-col bg-[#d4d0c8] font-[Tahoma,'Segoe_UI',sans-serif] text-[12px] text-[#222]">
      <div className="flex items-center gap-1 border-b border-[#808080] bg-gradient-to-b from-[#e8f0f8] via-[#d0dce8] to-[#b8c8d8] px-1.5 py-1">
        <AeroNavButton disabled={!canBack} onClick={() => setHistoryIndex((index) => index - 1)} label={COPY.back}>
          ←
        </AeroNavButton>
        <AeroNavButton disabled={!canForward} onClick={() => setHistoryIndex((index) => index + 1)} label={COPY.forward}>
          →
        </AeroNavButton>
        <ChromeButton onClick={() => goTo(page)}>{COPY.refresh}</ChromeButton>
        <ChromeButton onClick={() => goTo('home')}>{COPY.home}</ChromeButton>
        <div className="win7-inset ml-1 flex min-w-0 flex-1 items-center gap-1 bg-white px-2 py-0.5">
          <span className="font-[Georgia,Times,serif] text-[11px] font-bold italic text-[#7b1fa2]">W!</span>
          <span className="truncate text-[11px] text-[#1a1a1a]">{ADDRESSES[page]}</span>
        </div>
        <ChromeButton onClick={() => goTo(page)}>{COPY.go}</ChromeButton>
      </div>

      <div className="flex items-center gap-2 border-b border-[#c8b35a] bg-gradient-to-b from-[#fff4b0] to-[#e8c84a] px-2 py-1">
        <span className="font-[Georgia,Times,serif] text-[12px] font-bold italic text-[#4b0082]">
          {COPY.toolbarName}
        </span>
        <div className="win7-inset flex min-w-0 flex-1 items-center bg-white px-2 py-0.5 text-[11px] text-[#888]">
          {COPY.toolbarSearch}
        </div>
        <ToolbarBadge color="#e53935" label="Mail" onClick={() => goTo('mail')} />
        <ToolbarBadge color="#4b0082" label="2ch" onClick={() => goTo('twoch')} />
        <ToolbarBadge color="#c45c14" label="MSDN" onClick={() => goTo('kernel')} />
        <ToolbarBadge color="#1b7a3a" label="IM" onClick={() => goTo('messenger')} />
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[#b8b0a0] bg-[#f4f0e4] px-1 py-0.5">
        {BOOKMARKS.map((bookmark) => (
          <button
            key={bookmark.id}
            type="button"
            onClick={() => goTo(bookmark.id)}
            className={cn(
              'shrink-0 rounded-sm px-2 py-0.5 text-[11px]',
              page === bookmark.id
                ? 'bg-white font-bold text-[#4b0082] shadow-[inset_0_-1px_0_#c8b35a]'
                : 'text-[#333] hover:bg-white/70',
            )}
          >
            {bookmark.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-[#ece9d8]">
        {page === 'home' ? (
          <HomePage onNavigate={goTo} />
        ) : page === 'downloads' ? (
          <DownloadsPage onNavigate={goTo} />
        ) : page === 'twoch' ? (
          <TwochPage />
        ) : page === 'kernel' ? (
          <KernelPage />
        ) : page === 'mail' ? (
          <MailPage />
        ) : (
          <MessengerPage />
        )}
      </div>

      <div className="flex h-[22px] items-center justify-between border-t border-[#808080] bg-gradient-to-b from-[#e8e4dc] to-[#cfcbc3] px-2 text-[11px] text-[#333]">
        <span>{COPY.statusOffline}</span>
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
      onClick={onClick}
      className={cn(
        'h-[28px] w-[28px] shrink-0 rounded-full border text-[13px] font-bold',
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
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'win7-raised h-[22px] shrink-0 rounded-sm border border-[#6f6f6f] bg-gradient-to-b from-[#f8f8f8] to-[#d0d0d0] px-2 text-[11px]',
        disabled ? 'cursor-not-allowed text-[#8a8a8a]' : 'text-[#222] hover:from-[#fcfcfc] hover:to-[#d8d8d8]',
      )}
    >
      {children}
    </button>
  )
}

function ToolbarBadge({
  color,
  label,
  onClick,
}: {
  color: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="win7-raised flex h-[18px] items-center gap-1 border border-[#6f6f6f] bg-gradient-to-b from-[#fff8e0] to-[#e0d0a0] px-1.5 text-[10px] font-bold text-[#333]"
    >
      <span className="h-[8px] w-[8px] border border-black/30" style={{ backgroundColor: color }} />
      {label}
    </button>
  )
}

function CacheBanner() {
  return (
    <div className="border-b border-[#c8a000] bg-[#fff3cd] px-3 py-1 text-[11px] text-[#6a5200]">
      {COPY.cacheBanner}
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
    <div className="mx-auto min-h-full max-w-[760px] border-x border-[#c8b35a] bg-[#fffef6]">
      <CacheBanner />
      <div className="flex items-center justify-between bg-gradient-to-r from-[#4b0082] via-[#6a1b9a] to-[#ffcc00] px-4 py-3 text-white">
        <div>
          <div className="font-[Georgia,Times,serif] text-[22px] font-bold italic tracking-wide">
            {COPY.siteName}
          </div>
          <div className="text-[10px] tracking-[0.14em] uppercase text-[#fff4b0]">{COPY.siteTagline}</div>
        </div>
        <div className="hidden rounded-sm border border-white/40 bg-black/20 px-2 py-1 text-[10px] sm:block">
          {COPY.visitors}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 border-b border-[#e0c84a] bg-[#fff4b8] px-4 py-1.5 text-[11px] font-bold text-[#4b0082]">
        {COPY.nav.map((item) => {
          const target =
            item === 'Home'
              ? 'home'
              : item === 'Downloads'
                ? 'downloads'
                : item === 'Mail'
                  ? 'mail'
                  : item === 'Messenger'
                    ? 'messenger'
                    : item === '2ch'
                      ? 'twoch'
                      : null
          if (!onNavigate || !target) {
            return (
              <span key={item} className="cursor-default">
                {item}
              </span>
            )
          }
          return (
            <button key={item} type="button" onClick={() => onNavigate(target)} className="hover:underline">
              {item}
            </button>
          )
        })}
      </div>
      {children}
    </div>
  )
}

function HomePage({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  return (
    <SiteChrome onNavigate={onNavigate}>
      <div className="grid grid-cols-[160px_1fr] gap-0">
        <aside className="border-r border-[#e0c84a] bg-[#fff8d0] p-3 text-[11px] text-[#4b0082]">
          <div className="font-bold">Categories</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            <li>Disk Utilities</li>
            <li>System Tools</li>
            <li>Codec Packs</li>
            <li>Toolbar Bundles</li>
          </ul>
          <div className="mt-4 border border-dashed border-[#c8b35a] bg-white p-2 text-center text-[#8a2f4b]">
            {COPY.bestViewed}
          </div>
        </aside>
        <div className="p-4">
          <p className="mb-3 text-[13px] leading-relaxed text-[#333]">{COPY.welcome}</p>
          <div className="border-2 border-[#4b0082] bg-[#fffdf4] p-3">
            <div className="text-[10px] font-bold tracking-[0.16em] text-[#c45c14] uppercase">
              {COPY.editorPick}
            </div>
            <div className="mt-1 font-[Georgia,Times,serif] text-[18px] font-bold text-[#4b0082]">
              {COPY.productName}
            </div>
            <p className="mt-1 text-[12px] leading-snug text-[#333]">{COPY.productBlurb}</p>
            <button
              type="button"
              onClick={() => onNavigate('downloads')}
              className="win7-raised mt-3 h-[26px] rounded-sm border border-[#6f6f6f] bg-gradient-to-b from-[#fff4b0] to-[#e0b000] px-3 text-[12px] font-bold text-[#3a2200]"
            >
              View download page →
            </button>
          </div>
        </div>
      </div>
    </SiteChrome>
  )
}

function DownloadsPage({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const hasRecoveryTool = useGameStore((state) => state.hasRecoveryTool)
  const fragments = useGameStore((state) => Math.floor(state.dataFragments))
  const upgrades = useGameStore((state) => state.upgrades)
  const purchaseUpgrade = useGameStore((state) => state.purchaseUpgrade)

  return (
    <SiteChrome onNavigate={onNavigate}>
      <div className="p-4">
        <ProductDownload />

        <fieldset className="mt-4 rounded-sm border border-[#c8b35a] bg-[#fffdf4] px-3 pb-3 pt-1">
          <legend className="px-1 text-[12px] font-bold text-[#4b0082]">{COPY.addonsTitle}</legend>
          <div className="mb-2 flex items-center justify-between text-[11px] text-[#555]">
            <span>{hasRecoveryTool ? COPY.balance : COPY.addonsHint}</span>
            <span className="font-mono font-bold text-[#4b0082]">{formatDataSize(fragments)}</span>
          </div>
          <div className="flex flex-col gap-2">
            {UPGRADES.map((upgrade) => {
              const owned = upgrades[upgrade.id] ?? 0
              const cost = getUpgradeCost(upgrade.id, owned)
              const canAfford = fragments >= cost
              const locked = !hasRecoveryTool
              return (
                <AddonRow
                  key={upgrade.id}
                  name={upgrade.name}
                  description={upgrade.description}
                  cost={cost}
                  owned={owned}
                  locked={locked}
                  canAfford={canAfford}
                  onPurchase={() => purchaseUpgrade(upgrade.id as UpgradeId)}
                />
              )
            })}
          </div>
        </fieldset>
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
      <div className="text-[10px] font-bold tracking-[0.16em] text-[#c45c14] uppercase">
        {COPY.editorPick}
      </div>
      <div className="mt-1 font-[Georgia,Times,serif] text-[20px] font-bold text-[#4b0082]">
        {COPY.productName}
      </div>
      <p className="mt-1 text-[12px] leading-snug text-[#333]">{COPY.productBlurb}</p>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-[#555] sm:grid-cols-4">
        <span>{COPY.version}</span>
        <span>{COPY.size}</span>
        <span>{COPY.license}</span>
        <span>{COPY.rating}</span>
      </div>
      <div className="mt-1 text-[11px] text-[#8a6a00]">
        {hasRecoveryTool ? COPY.downloadsOne : COPY.downloads}
      </div>

      {downloading ? (
        <div className="mt-3">
          <div className="mb-1 text-[11px] text-[#555]">{COPY.downloading}</div>
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
            'win7-raised mt-3 h-[28px] min-w-[140px] rounded-sm border border-[#6f6f6f] px-3 text-[13px] font-bold',
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

function AddonRow({
  name,
  description,
  cost,
  owned,
  locked,
  canAfford,
  onPurchase,
}: {
  name: string
  description: string
  cost: number
  owned: number
  locked: boolean
  canAfford: boolean
  onPurchase: () => void
}) {
  const disabled = locked || !canAfford
  return (
    <div className="rounded-sm border border-[#d8c878] bg-white p-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold text-[#1a1a1a]">{name}</div>
          <div className="mt-0.5 text-[11px] leading-snug text-[#555]">{description}</div>
        </div>
        <div className="shrink-0 font-mono text-[11px] text-[#444]">
          {COPY.owned} x{owned}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-[#333]">
          {COPY.cost}: {formatDataSize(cost)}
        </span>
        <button
          type="button"
          disabled={disabled}
          title={locked ? COPY.locked : !canAfford ? COPY.cannotAfford : COPY.purchase}
          onClick={onPurchase}
          className={cn(
            'win7-raised h-[22px] min-w-[88px] rounded-sm border border-[#6f6f6f] bg-gradient-to-b from-[#f7f7f7] to-[#d5d5d5] px-2 text-[11px]',
            disabled ? 'cursor-not-allowed text-[#8a8a8a]' : 'text-[#222]',
          )}
        >
          {locked ? COPY.locked : COPY.purchase}
        </button>
      </div>
    </div>
  )
}

function TwochPage() {
  const cache = COPY.cache
  return (
    <div className="min-h-full bg-[#efefef]">
      <CacheBanner />
      <div className="border-b border-[#800000] bg-[#f0e0d6] px-3 py-2">
        <div className="font-bold text-[#800000]">{cache.twochTitle}</div>
        <div className="text-[11px] text-[#666]">{cache.twochMeta}</div>
      </div>
      <div className="space-y-1 p-3 font-mono text-[12px] leading-relaxed text-[#111]">
        {cache.twochLines.map((line) => (
          <p key={line} className={line.startsWith('　') ? 'pl-4 text-[#333]' : 'font-bold'}>
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}

function KernelPage() {
  const cache = COPY.cache
  return (
    <div className="min-h-full bg-white">
      <CacheBanner />
      <div className="border-b border-[#003399] bg-[#e8eef8] px-4 py-3">
        <div className="text-[16px] font-bold text-[#003399]">{cache.kernelTitle}</div>
        <div className="text-[11px] text-[#555]">{cache.kernelMeta}</div>
      </div>
      <div className="space-y-3 px-4 py-3 text-[12px] leading-relaxed text-[#222]">
        {cache.kernelBody.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  )
}

function MailPage() {
  const cache = COPY.cache
  return (
    <div className="min-h-full bg-[#f4f0e8]">
      <CacheBanner />
      <div className="bg-gradient-to-r from-[#4b0082] to-[#ffcc00] px-4 py-2 text-white">
        <div className="font-[Georgia,Times,serif] text-[18px] font-bold italic">{cache.mailTitle}</div>
        <div className="text-[11px] text-white/85">{cache.mailMeta}</div>
      </div>
      <p className="px-4 py-2 text-[11px] text-[#8a2f4b]">{cache.mailEmpty}</p>
      <table className="w-full border-t border-[#d0c8b0] text-left text-[12px]">
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
    </div>
  )
}

function MessengerPage() {
  const cache = COPY.cache
  return (
    <div className="min-h-full bg-[#dce6f0]">
      <CacheBanner />
      <div className="m-4 rounded-sm border border-[#6f8faf] bg-gradient-to-b from-[#f4f8fc] to-[#c8d8e8] p-4">
        <div className="text-[16px] font-bold text-[#003399]">{cache.messengerTitle}</div>
        <div className="mt-1 text-[11px] text-[#555]">{cache.messengerMeta}</div>
        <p className="mt-3 text-[12px] leading-relaxed text-[#333]">{cache.messengerBody}</p>
      </div>
    </div>
  )
}
