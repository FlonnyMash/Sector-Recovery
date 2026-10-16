import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { selectVisibleApps } from '../../game/apps'
import {
  EXPLORER_PATH,
  dynamicChildFolders,
  filesInDirectory,
  joinPath,
} from '../../game/virtualFiles'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'
import type { AppType } from '../../types/game'
import { cn } from '../../utils/cn'
import { RetroIcon, fileTypeIcon, type RetroIconName } from '../os/retroIcons'

const COPY = strings.systemExplorer

function folderLabel(path: string): string {
  if (path === EXPLORER_PATH.computer) return COPY.computer
  if (path === EXPLORER_PATH.drive) return COPY.drive
  if (path === EXPLORER_PATH.recovered) return COPY.recoveredFolder
  if (path === EXPLORER_PATH.user) return COPY.sysUser
  if (path === EXPLORER_PATH.toro) return COPY.userFolder
  if (path === EXPLORER_PATH.desktop) return COPY.desktop
  if (path === EXPLORER_PATH.pictures) return COPY.pictures
  const slash = path.lastIndexOf('/')
  return slash === -1 ? path : path.slice(slash + 1)
}

function staticChildFolders(
  path: string,
  hasRecoveryTool: boolean,
): { path: string; label: string }[] {
  if (path === EXPLORER_PATH.computer) {
    return [{ path: EXPLORER_PATH.drive, label: COPY.drive }]
  }
  if (path === EXPLORER_PATH.drive) {
    const folders: { path: string; label: string }[] = [
      { path: EXPLORER_PATH.user, label: COPY.sysUser },
    ]
    if (hasRecoveryTool) {
      folders.push({ path: EXPLORER_PATH.recovered, label: COPY.recoveredFolder })
    }
    return folders
  }
  if (path === EXPLORER_PATH.user) {
    return [{ path: EXPLORER_PATH.toro, label: COPY.userFolder }]
  }
  if (path === EXPLORER_PATH.toro) {
    return [
      { path: EXPLORER_PATH.desktop, label: COPY.desktop },
      { path: EXPLORER_PATH.pictures, label: COPY.pictures },
    ]
  }
  return []
}

function ancestorPaths(path: string): string[] {
  if (path === EXPLORER_PATH.computer) return [EXPLORER_PATH.computer]
  const parts: string[] = [EXPLORER_PATH.computer]
  const segs = path === EXPLORER_PATH.drive ? [EXPLORER_PATH.drive] : path.split('/')
  let acc = segs[0] ?? EXPLORER_PATH.drive
  parts.push(acc)
  for (let index = 1; index < segs.length; index++) {
    acc = `${acc}/${segs[index]}`
    parts.push(acc)
  }
  return parts
}

export function SystemExplorer() {
  const inventory = useGameStore((state) => state.inventory)
  const files = useGameStore((state) => state.files)
  const hasRecoveryTool = useGameStore((state) => state.hasRecoveryTool)
  const explorerRevealRequest = useGameStore((state) => state.explorerRevealRequest)
  const clearExplorerRevealRequest = useGameStore((state) => state.clearExplorerRevealRequest)
  const openWindow = useGameStore((state) => state.openWindow)
  const openFile = useGameStore((state) => state.openFile)
  const desktopApps = selectVisibleApps('target_os', hasRecoveryTool)

  const [history, setHistory] = useState<string[]>([EXPLORER_PATH.computer])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [driveExpanded, setDriveExpanded] = useState(false)
  const [sysUserExpanded, setSysUserExpanded] = useState(false)
  const [toroExpanded, setToroExpanded] = useState(false)
  const [selectedDesktopApp, setSelectedDesktopApp] = useState<AppType | null>(null)

  const page = history[historyIndex] ?? EXPLORER_PATH.computer
  const canBack = historyIndex > 0
  const canForward = historyIndex < history.length - 1

  const folderTiles = useMemo(() => {
    const staticFolders = staticChildFolders(page, hasRecoveryTool)
    const known = new Set(staticFolders.map((folder) => folder.path))
    const dynamic = dynamicChildFolders(files, page)
      .map((segment) => ({ path: joinPath(page, segment), label: segment }))
      .filter((folder) => !known.has(folder.path))
    return [...staticFolders, ...dynamic]
  }, [files, hasRecoveryTool, page])

  const visibleFiles = useMemo(
    () => (page === EXPLORER_PATH.recovered ? [] : filesInDirectory(files, page)),
    [files, page],
  )

  const selectedVirtualFile = visibleFiles.find((file) => file.id === selectedId) ?? null
  const selectedLootFile = inventory.find((file) => file.id === selectedId) ?? null

  const expandAncestors = (next: string) => {
    if (next === EXPLORER_PATH.computer) return
    setDriveExpanded(true)
    if (next === EXPLORER_PATH.user || next.startsWith(`${EXPLORER_PATH.user}/`)) {
      setSysUserExpanded(true)
    }
    if (next === EXPLORER_PATH.toro || next.startsWith(`${EXPLORER_PATH.toro}/`)) {
      setToroExpanded(true)
    }
  }

  const goTo = (next: string) => {
    if (next === EXPLORER_PATH.recovered && !hasRecoveryTool) return
    if (history[historyIndex] === next) return
    setSelectedId(null)
    setSelectedDesktopApp(null)
    expandAncestors(next)
    setHistory((current) => [...current.slice(0, historyIndex + 1), next])
    setHistoryIndex((index) => index + 1)
  }

  useEffect(() => {
    if (hasRecoveryTool || page !== EXPLORER_PATH.recovered) return
    setSelectedId(null)
    setHistory([EXPLORER_PATH.computer, EXPLORER_PATH.drive])
    setHistoryIndex(1)
  }, [hasRecoveryTool, page])

  useEffect(() => {
    if (!explorerRevealRequest) return
    const trail = ancestorPaths(explorerRevealRequest.path)
    expandAncestors(explorerRevealRequest.path)
    setHistory(trail)
    setHistoryIndex(trail.length - 1)
    setSelectedId(explorerRevealRequest.fileId)
    setSelectedDesktopApp(null)
    clearExplorerRevealRequest()
  }, [explorerRevealRequest, clearExplorerRevealRequest])

  const isDesktop = page === EXPLORER_PATH.desktop
  const isRecovered = page === EXPLORER_PATH.recovered

  const statusCount =
    folderTiles.length +
    visibleFiles.length +
    (isDesktop ? desktopApps.length : 0) +
    (isRecovered ? inventory.length : 0)

  const statusDetail =
    selectedLootFile
      ? COPY.itemSelected.replace('{name}', selectedLootFile.name).replace('{size}', selectedLootFile.size)
      : selectedVirtualFile
        ? selectedVirtualFile.name
        : isDesktop && selectedDesktopApp
          ? desktopApps.find((app) => app.type === selectedDesktopApp)?.title ?? ''
          : ''

  const openDesktopApp = (type: AppType) => {
    if (type === 'system-explorer') {
      goTo(EXPLORER_PATH.computer)
      return
    }
    openWindow(type)
  }

  const isEmpty =
    folderTiles.length === 0 &&
    visibleFiles.length === 0 &&
    (!isDesktop || desktopApps.length === 0) &&
    (!isRecovered || inventory.length === 0)

  return (
    <div className="flex h-full flex-col bg-[#f0f0f0] font-[Tahoma,'Segoe_UI',sans-serif] text-[16px] text-[#222]">
      <div className="flex items-center gap-1 border-b border-[#b8b8b8] bg-gradient-to-b from-[#f7f7f7] to-[#e4e4e4] px-1.5 py-1">
        <ChromeButton disabled={!canBack} onClick={() => setHistoryIndex((index) => index - 1)}>
          ← {COPY.back}
        </ChromeButton>
        <ChromeButton disabled={!canForward} onClick={() => setHistoryIndex((index) => index + 1)}>
          {COPY.forward} →
        </ChromeButton>
        <div className="win7-inset ml-1 flex min-w-0 flex-1 items-center gap-1 bg-white px-2 py-0.5 text-[14px]">
          <AddressCrumbs path={page} onGo={goTo} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[230px] shrink-0 overflow-auto border-r border-[#c8c8c8] bg-gradient-to-b from-[#eef4fb] to-[#dce8f5] px-1.5 py-2">
          <NavGroup title={COPY.favorites}>
            <NavItem
              label={COPY.desktop}
              icon="folder"
              active={page === EXPLORER_PATH.desktop}
              onClick={() => goTo(EXPLORER_PATH.desktop)}
            />
            <NavItem
              label={COPY.pictures}
              icon="folder"
              active={page === EXPLORER_PATH.pictures}
              onClick={() => goTo(EXPLORER_PATH.pictures)}
            />
          </NavGroup>
          <NavGroup title={COPY.computer}>
            <NavItem
              label={COPY.drive}
              icon="hard-drive"
              active={page === EXPLORER_PATH.drive}
              expanded={driveExpanded}
              expandable
              onToggle={() => setDriveExpanded((open) => !open)}
              onClick={() => goTo(EXPLORER_PATH.drive)}
            />
            {driveExpanded ? (
              <>
                {hasRecoveryTool ? (
                  <NavItem
                    label={COPY.recoveredFolder}
                    icon="folder"
                    depth={1}
                    active={page === EXPLORER_PATH.recovered}
                    onClick={() => goTo(EXPLORER_PATH.recovered)}
                  />
                ) : null}
                <NavItem
                  label={COPY.sysUser}
                  icon="folder"
                  depth={1}
                  active={page === EXPLORER_PATH.user}
                  expanded={sysUserExpanded}
                  expandable
                  onToggle={() => setSysUserExpanded((open) => !open)}
                  onClick={() => goTo(EXPLORER_PATH.user)}
                />
                {sysUserExpanded ? (
                  <>
                    <NavItem
                      label={COPY.userFolder}
                      icon="folder-open-papers"
                      depth={2}
                      active={page === EXPLORER_PATH.toro}
                      expanded={toroExpanded}
                      expandable
                      onToggle={() => setToroExpanded((open) => !open)}
                      onClick={() => goTo(EXPLORER_PATH.toro)}
                    />
                    {toroExpanded ? (
                      <>
                        <NavItem
                          label={COPY.desktop}
                          icon="folder"
                          depth={3}
                          active={page === EXPLORER_PATH.desktop}
                          onClick={() => goTo(EXPLORER_PATH.desktop)}
                        />
                        <NavItem
                          label={COPY.pictures}
                          icon="folder"
                          depth={3}
                          active={page === EXPLORER_PATH.pictures}
                          onClick={() => goTo(EXPLORER_PATH.pictures)}
                        />
                      </>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : null}
          </NavGroup>
          <NavGroup title={COPY.network}>
            <NavItem label={COPY.network} icon="folder-network" inert />
          </NavGroup>
        </aside>

        <div
          className="min-h-0 flex-1 overflow-auto bg-white"
          onMouseDown={() => {
            setSelectedId(null)
            setSelectedDesktopApp(null)
          }}
        >
          {isEmpty ? (
            <p className="px-4 py-6 text-[16px] text-[#666]">
              {isRecovered ? COPY.empty : COPY.emptyDrive}
            </p>
          ) : (
            <IconGrid>
              {folderTiles.map((folder) => (
                <ExplorerTile
                  key={folder.path}
                  label={folder.label}
                  selected={selectedId === folder.path}
                  onSelect={() => setSelectedId(folder.path)}
                  onOpen={() => goTo(folder.path)}
                  icon={<RetroIcon name={folder.path === EXPLORER_PATH.drive ? 'hard-drive' : 'folder'} size={56} />}
                />
              ))}
              {isRecovered
                ? inventory.map((file) => (
                    <ExplorerTile
                      key={file.id}
                      label={file.name}
                      selected={selectedId === file.id}
                      onSelect={() => setSelectedId(file.id)}
                      icon={<RetroIcon name={fileTypeIcon(file.type)} size={56} />}
                    />
                  ))
                : null}
              {isDesktop
                ? desktopApps.map((app) => (
                    <ExplorerTile
                      key={app.type}
                      label={app.title}
                      selected={selectedDesktopApp === app.type}
                      onSelect={() => setSelectedDesktopApp(app.type)}
                      onOpen={() => openDesktopApp(app.type)}
                      icon={app.icon({ size: 56 })}
                    />
                  ))
                : null}
              {visibleFiles.map((file) => (
                <ExplorerTile
                  key={file.id}
                  label={file.name}
                  selected={selectedId === file.id}
                  onSelect={() => setSelectedId(file.id)}
                  onOpen={() => openFile(file.id)}
                  icon={
                    file.type === 'image' && (file.imageThumb ?? file.imageSrc) ? (
                      <img
                        src={file.imageThumb ?? file.imageSrc}
                        alt=""
                        width={56}
                        height={56}
                        draggable={false}
                        decoding="sync"
                        loading="eager"
                        className="h-14 w-14 border border-[#3a6ea5] bg-white object-contain"
                      />
                    ) : (
                      <RetroIcon name={fileTypeIcon(file.type)} size={56} />
                    )
                  }
                />
              ))}
            </IconGrid>
          )}
        </div>
      </div>

      <div className="flex h-[28px] items-center justify-between border-t border-[#b8b8b8] bg-gradient-to-b from-[#e8e8e8] to-[#d4d4d4] px-2 text-[14px] text-[#333]">
        <span>{COPY.items.replace('{count}', String(statusCount))}</span>
        <span className="truncate">{statusDetail}</span>
      </div>
    </div>
  )
}

function AddressCrumbs({ path, onGo }: { path: string; onGo: (path: string) => void }) {
  const parts = ancestorPaths(path)

  return (
    <>
      {parts.map((part, index) => {
        const last = index === parts.length - 1
        return (
          <span key={part} className="flex min-w-0 items-center gap-1">
            {index > 0 ? <span className="text-[#888]">›</span> : null}
            {last ? (
              <span className="truncate font-semibold text-[#1a1a1a]">{folderLabel(part)}</span>
            ) : (
              <Crumb label={folderLabel(part)} active={false} onClick={() => onGo(part)} />
            )}
          </span>
        )
      })}
    </>
  )
}

function IconGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2 p-3">{children}</div>
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
        'win7-raised h-[28px] shrink-0 rounded-sm border border-[#6f6f6f] bg-gradient-to-b from-[#f8f8f8] to-[#d0d0d0] px-2 text-[14px]',
        disabled ? 'cursor-not-allowed text-[#8a8a8a]' : 'text-[#222] hover:from-[#fcfcfc] hover:to-[#d8d8d8]',
      )}
    >
      {children}
    </button>
  )
}

function Crumb({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'truncate hover:underline',
        active ? 'font-semibold text-[#1a1a1a]' : 'text-[#003399]',
      )}
    >
      {label}
    </button>
  )
}

function NavGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <div className="mb-1 px-0.5 text-[13px] font-bold tracking-wide text-[#3b6ea5] uppercase">
        {title}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

function NavItem({
  label,
  icon,
  active,
  depth = 0,
  inert,
  expandable,
  expanded,
  onToggle,
  onClick,
}: {
  label: string
  icon?: RetroIconName
  active?: boolean
  depth?: number
  inert?: boolean
  expandable?: boolean
  expanded?: boolean
  onToggle?: () => void
  onClick?: () => void
}) {
  return (
    <div className="flex items-center" style={{ paddingLeft: depth * 10 }}>
      {expandable ? (
        <button
          type="button"
          aria-label={expanded ? COPY.collapse : COPY.expand}
          onClick={(event) => {
            event.stopPropagation()
            onToggle?.()
          }}
          className="flex h-[20px] w-[20px] shrink-0 items-center justify-center text-[12px] text-[#3b6ea5]"
        >
          {expanded ? '▼' : '►'}
        </button>
      ) : (
        <span className="w-[20px] shrink-0" />
      )}
      <button
        type="button"
        disabled={inert}
        onClick={onClick}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-left text-[14px]',
          inert && 'cursor-default text-[#666]',
          active && 'bg-[#3399ff] font-semibold text-white',
          !active && !inert && 'text-[#1a1a1a] hover:bg-[#c4e0ff]',
        )}
      >
        {icon ? <RetroIcon name={icon} size={20} /> : null}
        <span className="truncate">{label}</span>
      </button>
    </div>
  )
}

function ExplorerTile({
  label,
  selected,
  icon,
  onSelect,
  onOpen,
}: {
  label: string
  selected: boolean
  icon: ReactNode
  onSelect?: () => void
  onOpen?: () => void
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => {
        event.stopPropagation()
        onSelect?.()
      }}
      onDoubleClick={() => onOpen?.()}
      className={cn(
        'flex w-[112px] flex-col items-center gap-1 rounded-sm px-1 py-1.5 text-center',
        selected ? 'bg-[#3399ff]/80 text-white' : 'text-[#1a1a1a] hover:bg-[#3399ff]/15',
      )}
    >
      {icon}
      <span className="w-full break-all text-[14px] leading-tight">{label}</span>
    </button>
  )
}
