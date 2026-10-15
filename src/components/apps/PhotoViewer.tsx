import { useEffect, useRef, useState } from 'react'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'
import { cn } from '../../utils/cn'

const COPY = strings.photoViewer
const ZOOMS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3] as const

export function PhotoViewer() {
  const files = useGameStore((state) => state.files)
  const activeFileId = useGameStore((state) => state.activeFileId)
  const openFile = useGameStore((state) => state.openFile)
  const setWindowTitle = useGameStore((state) => state.setWindowTitle)
  const rootRef = useRef<HTMLDivElement>(null)

  const pictures = files.filter((file) => file.isUnlocked && file.type === 'image')
  const selected = pictures.find((file) => file.id === activeFileId) ?? pictures[0] ?? null
  const index = selected ? pictures.findIndex((file) => file.id === selected.id) : -1

  const selectedId = selected?.id ?? null
  const [trackedId, setTrackedId] = useState(selectedId)
  const [scale, setScale] = useState<number | 'fit'>('fit')
  const [naturalWidth, setNaturalWidth] = useState(0)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)

  if (trackedId !== selectedId) {
    setTrackedId(selectedId)
    setScale('fit')
    setNaturalWidth(0)
    setLoadedSrc(null)
  }

  const fullLoaded = selected?.imageSrc !== undefined && loadedSrc === selected.imageSrc
  // Until the full-size picture arrives, stand in with the inline thumbnail
  // so the viewer never shows an empty frame.
  const placeholder = !fullLoaded ? selected?.imageThumb : undefined

  useEffect(() => {
    rootRef.current?.focus()
  }, [])

  useEffect(() => {
    const title = selected
      ? `${selected.name} — ${strings.apps.photoViewer}`
      : strings.apps.photoViewer
    setWindowTitle('photo-viewer', title)
  }, [selected, setWindowTitle])

  const showOffset = (delta: number) => {
    const next = pictures[index + delta]
    if (next) openFile(next.id)
  }

  const stepZoom = (direction: -1 | 1) => {
    setScale((current) => {
      if (current === 'fit') return direction === 1 ? 1 : 0.75
      const at = ZOOMS.findIndex((step) => step === current)
      const start = at === -1 ? 0 : at
      const nextIndex = Math.min(ZOOMS.length - 1, Math.max(0, start + direction))
      return ZOOMS[nextIndex] ?? current
    })
  }

  const zoomLabel = scale === 'fit' ? COPY.fit : `${Math.round(scale * 100)}%`

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') showOffset(-1)
        if (event.key === 'ArrowRight') showOffset(1)
        if (event.key === '+' || event.key === '=') stepZoom(1)
        if (event.key === '-' || event.key === '_') stepZoom(-1)
      }}
      className="flex h-full flex-col bg-[#ececec] font-[Tahoma,'Segoe_UI',sans-serif] text-[12px] text-[#222] outline-none"
    >
      <div className="flex h-[26px] shrink-0 items-center gap-2 border-b border-[#c8c8c8] bg-gradient-to-b from-[#f7f7f7] to-[#e6e6e6] px-2">
        <span className="truncate font-semibold">{selected?.name ?? COPY.emptyTitle}</span>
        {selected ? (
          <span className="min-w-0 flex-1 truncate text-[#666]">
            {selected.path} · {selected.content}
          </span>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-[#1c1c1c]">
        {selected?.imageSrc ? (
          scale === 'fit' ? (
            <div className="relative flex h-full w-full items-center justify-center p-4">
              {placeholder ? (
                <img
                  src={placeholder}
                  alt=""
                  aria-hidden
                  draggable={false}
                  decoding="sync"
                  className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] object-contain blur-[1px]"
                />
              ) : null}
              <img
                ref={(node) => {
                  // Cached pictures can finish before React attaches onLoad.
                  if (node?.complete && node.naturalWidth > 0) setLoadedSrc(selected.imageSrc ?? null)
                }}
                src={selected.imageSrc}
                alt={selected.name}
                draggable={false}
                onLoad={() => setLoadedSrc(selected.imageSrc ?? null)}
                className={cn(
                  'relative max-h-full max-w-full object-contain shadow-[0_10px_28px_rgba(0,0,0,0.55)]',
                  placeholder ? 'invisible' : '',
                )}
              />
            </div>
          ) : (
            <div className="flex min-h-full min-w-full items-center justify-center p-6">
              <img
                ref={(node) => {
                  if (node?.complete && node.naturalWidth > 0) {
                    setNaturalWidth(node.naturalWidth)
                    setLoadedSrc(selected.imageSrc ?? null)
                  }
                }}
                src={selected.imageSrc}
                alt={selected.name}
                draggable={false}
                onLoad={(event) => {
                  setNaturalWidth(event.currentTarget.naturalWidth)
                  setLoadedSrc(selected.imageSrc ?? null)
                }}
                className="shadow-[0_10px_28px_rgba(0,0,0,0.55)]"
                style={
                  naturalWidth > 0
                    ? { width: Math.round(naturalWidth * scale), maxWidth: 'none', height: 'auto' }
                    : undefined
                }
              />
            </div>
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center text-[#bdbdbd]">
            <span className="text-[15px] font-semibold text-white">{COPY.emptyTitle}</span>
            <span>{COPY.empty}</span>
          </div>
        )}
      </div>

      <div className="flex h-[36px] shrink-0 items-center gap-1 border-t border-[#b8b8b8] bg-gradient-to-b from-[#f4f4f4] to-[#dcdcdc] px-2">
        <ViewerButton disabled={index <= 0} onClick={() => showOffset(-1)}>
          {COPY.previous}
        </ViewerButton>
        <ViewerButton disabled={index < 0 || index >= pictures.length - 1} onClick={() => showOffset(1)}>
          {COPY.next}
        </ViewerButton>
        <span className="mx-1 h-4 w-px bg-[#b0b0b0]" />
        <ViewerButton disabled={!selected} onClick={() => stepZoom(-1)}>
          {COPY.zoomOut}
        </ViewerButton>
        <span className="win7-inset min-w-[92px] bg-white px-2 py-0.5 text-center text-[11px] text-[#333]">
          {zoomLabel}
        </span>
        <ViewerButton disabled={!selected} onClick={() => stepZoom(1)}>
          {COPY.zoomIn}
        </ViewerButton>
        <ViewerButton disabled={!selected || scale === 'fit'} onClick={() => setScale('fit')}>
          {COPY.fit}
        </ViewerButton>
        <ViewerButton disabled={!selected || scale === 1} onClick={() => setScale(1)}>
          {COPY.actual}
        </ViewerButton>
      </div>

      {pictures.length > 0 ? (
        <div className="flex h-[74px] shrink-0 items-center gap-2 overflow-auto border-t border-[#d0d0d0] bg-[#f7f7f7] px-2">
          {pictures.map((picture) => (
            <button
              key={picture.id}
              type="button"
              title={picture.name}
              onClick={() => openFile(picture.id)}
              className={cn(
                'h-[56px] w-[76px] shrink-0 overflow-hidden border-2 bg-[#1c1c1c]',
                picture.id === selected?.id ? 'border-[#3399ff]' : 'border-[#c5c5c5] hover:border-[#7eb6e0]',
              )}
            >
              {picture.imageThumb ?? picture.imageSrc ? (
                <img
                  src={picture.imageThumb ?? picture.imageSrc}
                  alt=""
                  draggable={false}
                  decoding="sync"
                  className="h-full w-full bg-white object-contain"
                />
              ) : (
                <span className="flex h-full items-center justify-center px-1 text-[10px] text-[#888]">
                  {picture.name}
                </span>
              )}
            </button>
          ))}
          <span className="ml-auto shrink-0 pr-1 text-[11px] text-[#555]">
            {COPY.count
              .replace('{index}', String(index + 1))
              .replace('{count}', String(pictures.length))}
          </span>
        </div>
      ) : null}
    </div>
  )
}

function ViewerButton({
  children,
  disabled,
  onClick,
}: {
  children: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={children}
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
