import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'
import { LIVE_MESSAGE_COUNT } from '../../types/game'
import { cn } from '../../utils/cn'

const TYPING_MS = 1400
const PANE_TRANSITION = { duration: 0.18, ease: 'easeOut' as const }

type ConversationId = (typeof strings.chat.conversations)[number]['id']

interface LocalMessage {
  from: 'player'
  time: string
  text: string
}

export function ModernChat() {
  const prologue = useGameStore((state) => state.prologue)
  const revealNextLiveMessage = useGameStore((state) => state.revealNextLiveMessage)
  const startPartitionDownload = useGameStore((state) => state.startPartitionDownload)
  const clearChatNotification = useGameStore((state) => state.clearChatNotification)

  const [activeId, setActiveId] = useState<ConversationId>('kenji')
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [sent, setSent] = useState<Record<ConversationId, LocalMessage[]>>({
    kenji: [],
    mom: [],
    'study-group': [],
  })
  const [typing, setTyping] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const kenjiActive = activeId === 'kenji'

  useEffect(() => {
    if (kenjiActive) clearChatNotification()
  }, [kenjiActive, clearChatNotification])

  const waitingForNext =
    kenjiActive && prologue.friendMessageReceived && prologue.liveMessagesRevealed < LIVE_MESSAGE_COUNT

  useEffect(() => {
    if (!waitingForNext) return

    const start = window.setTimeout(() => setTyping(true), 40)
    const id = window.setTimeout(() => {
      setTyping(false)
      revealNextLiveMessage()
    }, TYPING_MS)

    return () => {
      window.clearTimeout(start)
      window.clearTimeout(id)
      setTyping(false)
    }
  }, [waitingForNext, prologue.liveMessagesRevealed, revealNextLiveMessage])

  useEffect(() => {
    const node = scrollerRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [
    activeId,
    sent,
    typing,
    prologue.liveMessagesRevealed,
    prologue.isPartitionDownloaded,
    prologue.imageDownloadProgress,
  ])

  const conversations = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return strings.chat.conversations.filter((conversation) =>
      needle ? conversation.name.toLowerCase().includes(needle) : true,
    )
  }, [query])

  const active = strings.chat.conversations.find((conversation) => conversation.id === activeId)
  const liveMessages = strings.chat.live.slice(0, prologue.liveMessagesRevealed)
  const showAttachment = prologue.liveMessagesRevealed >= LIVE_MESSAGE_COUNT

  function sendDraft() {
    const text = draft.trim()
    if (!text) return
    const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    setSent((current) => ({
      ...current,
      [activeId]: [...current[activeId], { from: 'player', time, text }],
    }))
    setDraft('')
  }

  return (
    <div className="flex h-full bg-white font-[ui-sans-serif,-apple-system,'Segoe_UI',sans-serif] text-[13px] text-neutral-900">
      <aside className="flex w-[30%] min-w-[200px] flex-col border-r border-black/8 bg-[#f5f5f7]">
        <div className="px-3 pt-3 pb-2">
          <div className="mb-2 px-1 text-[17px] font-semibold tracking-tight">
            {strings.chat.appName}
          </div>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={strings.chat.searchPlaceholder}
            className="h-8 w-full rounded-full border-0 bg-black/6 px-3 text-[12px] outline-none placeholder:text-neutral-400"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-1.5 pb-2">
          {conversations.map((conversation) => {
            const unread = conversation.id === 'kenji' && prologue.chatNotificationPending
            const selected = conversation.id === activeId
            const preview = sidebarPreview(conversation.id, prologue, sent[conversation.id])
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => {
                  setActiveId(conversation.id)
                  setDraft('')
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left',
                  selected ? 'bg-[#0a84ff] text-white' : 'text-neutral-900 hover:bg-black/5',
                )}
              >
                <Avatar name={conversation.name} color={conversation.color} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold">{conversation.name}</span>
                    <span
                      className={cn(
                        'shrink-0 text-[10px]',
                        selected ? 'text-white/70' : 'text-neutral-400',
                      )}
                    >
                      {conversation.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'truncate text-[12px]',
                        selected ? 'text-white/80' : 'text-neutral-500',
                      )}
                    >
                      {preview}
                    </span>
                    {unread ? (
                      <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[#0a84ff] ring-2 ring-white" />
                    ) : null}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-white">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={PANE_TRANSITION}
              className="flex h-full min-h-0 flex-col"
            >
              <header className="flex items-center gap-3 border-b border-black/6 px-4 py-2.5">
                <Avatar name={active.name} color={active.color} />
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold">{active.name}</div>
                  <div className="text-[11px] text-neutral-500">{active.status}</div>
                </div>
              </header>

              <div ref={scrollerRef} className="min-h-0 flex-1 space-y-1.5 overflow-auto px-4 py-4">
                <div className="pb-2 text-center text-[11px] text-neutral-400">
                  {strings.chat.today}
                </div>

                {active.id === 'kenji' ? (
                  <>
                    {strings.chat.earlier.map((message, index) => (
                      <Bubble
                        key={`${message.time}-${message.text}`}
                        from={message.from === 'player' ? 'player' : 'them'}
                        time={message.time}
                        index={index}
                      >
                        {message.text}
                      </Bubble>
                    ))}
                    {liveMessages.map((text, index) => (
                      <Bubble key={`live-${index}`} from="them" index={strings.chat.earlier.length + index}>
                        {text}
                      </Bubble>
                    ))}
                    {showAttachment ? (
                      <AttachmentCard
                        progress={prologue.imageDownloadProgress}
                        downloaded={prologue.isPartitionDownloaded}
                        onDownload={startPartitionDownload}
                      />
                    ) : null}
                    {prologue.isPartitionDownloaded ? (
                      <Bubble from="them" index={strings.chat.earlier.length + liveMessages.length}>
                        {strings.chat.final}
                      </Bubble>
                    ) : null}
                    {sent.kenji.map((message, index) => (
                      <Bubble
                        key={`${message.time}-${message.text}`}
                        from="player"
                        time={message.time}
                        index={
                          strings.chat.earlier.length +
                          liveMessages.length +
                          (prologue.isPartitionDownloaded ? 1 : 0) +
                          index
                        }
                      >
                        {message.text}
                      </Bubble>
                    ))}
                    <AnimatePresence>
                      {typing ? (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex justify-start"
                        >
                          <TypingDots />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </>
                ) : (
                  <>
                    {(active.id === 'mom' ? strings.chat.mom : strings.chat.studyGroup).map(
                      (message, index) => (
                        <Bubble
                          key={`${message.time}-${message.text}`}
                          from={message.from === 'player' ? 'player' : 'them'}
                          sender={'sender' in message ? message.sender : undefined}
                          time={message.time}
                          index={index}
                        >
                          {message.text}
                        </Bubble>
                      ),
                    )}
                    {sent[active.id].map((message, index) => (
                      <Bubble
                        key={`${message.time}-${message.text}`}
                        from="player"
                        time={message.time}
                        index={
                          (active.id === 'mom' ? strings.chat.mom : strings.chat.studyGroup).length +
                          index
                        }
                      >
                        {message.text}
                      </Bubble>
                    ))}
                  </>
                )}
              </div>

              <form
                className="flex items-center gap-2 px-3 py-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  sendDraft()
                }}
              >
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={strings.chat.inputPlaceholder}
                  className="h-9 min-w-0 flex-1 rounded-full bg-[#f1f1f3] px-4 text-[13px] outline-none placeholder:text-neutral-400"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="rounded-full bg-[#0a84ff] px-3.5 py-1.5 text-[13px] font-semibold text-white disabled:opacity-40"
                >
                  {strings.chat.send}
                </button>
              </form>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>
    </div>
  )
}

function sidebarPreview(
  id: ConversationId,
  prologue: ReturnType<typeof useGameStore.getState>['prologue'],
  extras: LocalMessage[],
) {
  if (extras.length > 0) return extras[extras.length - 1].text
  if (id === 'kenji') {
    if (prologue.isPartitionDownloaded) return strings.chat.final
    if (prologue.liveMessagesRevealed > 0) {
      return strings.chat.live[prologue.liveMessagesRevealed - 1]
    }
  }
  return strings.chat.conversations.find((conversation) => conversation.id === id)?.preview ?? ''
}

function Avatar({ name, color }: { name: string; color: string }) {
  const initial = name.trim().charAt(0).toUpperCase()
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {initial}
    </span>
  )
}

function Bubble({
  from,
  time,
  sender,
  index = 0,
  children,
}: {
  from: 'player' | 'them'
  time?: string
  sender?: string
  index?: number
  children: string
}) {
  const mine = from === 'player'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.03, 0.2) }}
      className={cn('flex', mine ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[78%] px-3 py-2 leading-snug',
          mine
            ? 'rounded-2xl rounded-br-md bg-[#0a84ff] text-white'
            : 'rounded-2xl rounded-bl-md bg-[#e9e9eb] text-black',
        )}
      >
        {sender ? (
          <div className="mb-0.5 text-[10px] font-semibold text-neutral-500">{sender}</div>
        ) : null}
        <div>{children}</div>
        {time ? (
          <div className={cn('mt-1 text-[10px]', mine ? 'text-white/70' : 'text-neutral-400')}>
            {time}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-[#e9e9eb] px-3 py-2.5">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          className="h-1.5 w-1.5 rounded-full bg-neutral-500"
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.15 }}
        />
      ))}
    </div>
  )
}

function AttachmentCard({
  progress,
  downloaded,
  onDownload,
}: {
  progress: number
  downloaded: boolean
  onDownload: () => void
}) {
  const downloading = progress > 0 && progress < 100
  return (
    <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-[#e9e9eb] p-3">
      <div className="flex items-start gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[11px] font-bold text-[#0a84ff]">
          IMG
        </span>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold">{strings.chat.attachmentName}</div>
          <div className="text-[11px] text-neutral-500">
            {strings.chat.attachmentSize} · {strings.chat.attachmentHint}
          </div>
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
        <motion.div
          className="h-full rounded-full bg-[#0a84ff]"
          animate={{ width: `${downloaded ? 100 : progress}%` }}
          transition={{ duration: 0.12, ease: 'linear' }}
        />
      </div>
      <button
        type="button"
        disabled={downloading || downloaded}
        onClick={onDownload}
        className={cn(
          'mt-2 h-8 w-full rounded-full text-[12px] font-semibold',
          downloaded
            ? 'bg-white text-[#248a3d]'
            : downloading
              ? 'bg-white/70 text-neutral-500'
              : 'bg-[#0a84ff] text-white hover:bg-[#0077ed]',
        )}
      >
        {downloaded
          ? strings.chat.mounted
          : downloading
            ? `${strings.chat.downloading} ${Math.round(progress)}%`
            : strings.chat.download}
      </button>
    </div>
  )
}
