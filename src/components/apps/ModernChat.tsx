import { AnimatePresence, motion } from 'framer-motion'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { strings } from '../../i18n'
import { selectActiveWindowId, selectCurrentOs, useGameStore } from '../../store/useGameStore'
import {
  LIVE_MESSAGE_COUNT,
  MOM_NUDGE_COUNT,
  type ChatConversationId,
  type ChatLinkPreview,
} from '../../types/game'
import { cn } from '../../utils/cn'
import { nextChatTime } from '../../utils/format'
import { playMessageSound } from '../../utils/sounds'

const TYPING_MS_PER_CHAR = 42
const TYPING_MIN_MS = 2000
const TYPING_MAX_MS = 11000
const TYPING_GAP_MS = 320
const PANE_TRANSITION = { duration: 0.18, ease: 'easeOut' as const }
const SCROLL_BOTTOM_PX = 48

function typingDurationMs(text: string): number {
  return Math.min(TYPING_MAX_MS, Math.max(TYPING_MIN_MS, Math.round(text.length * TYPING_MS_PER_CHAR)))
}

type ConversationId = ChatConversationId

const COLD_CASE_ARTICLE = strings.news.articles.find((article) => article.id === 'cold-case-article')!

function nextKenjiLiveText(revealed: number): string {
  return strings.chat.live[revealed] ?? ''
}

function nextMomNudgeText(revealed: number): string {
  if (revealed < strings.chat.momNudge.length) {
    return strings.chat.momNudge[revealed]?.text ?? ''
  }
  return `${COLD_CASE_ARTICLE.title} ${COLD_CASE_ARTICLE.excerpt}`
}

const MOM_LINK_PREVIEW: ChatLinkPreview = {
  url: `${strings.news.addressArticle}/${COLD_CASE_ARTICLE.id}`,
  siteName: strings.news.portalName,
  kicker: COLD_CASE_ARTICLE.kicker,
  title: COLD_CASE_ARTICLE.title,
  excerpt: COLD_CASE_ARTICLE.excerpt,
  targetAppId: 'news-browser',
  targetArticleId: COLD_CASE_ARTICLE.id,
}

const AUCTION_LINK_PREVIEW: ChatLinkPreview = {
  url: `${strings.wahoo.addresses.auctions}/lot-404`,
  siteName: strings.wahoo.bookmarks.auctions,
  kicker: strings.chat.auctionLink.kicker,
  title: strings.chat.auctionLink.title,
  excerpt: strings.chat.auctionLink.excerpt,
  targetAppId: 'news-browser',
  targetAuctionLotId: 'lot-404',
}

interface LocalMessage {
  from: 'player'
  time: string
  text: string
}

export function ModernChat() {
  const prologue = useGameStore((state) => state.prologue)
  const revealNextLiveMessage = useGameStore((state) => state.revealNextLiveMessage)
  const revealNextMomNudge = useGameStore((state) => state.revealNextMomNudge)
  const startPartitionDownload = useGameStore((state) => state.startPartitionDownload)
  const clearChatNotification = useGameStore((state) => state.clearChatNotification)
  const clearMomChatNotification = useGameStore((state) => state.clearMomChatNotification)
  const pendingChatFocus = useGameStore((state) => state.pendingChatFocus)
  const consumePendingChatFocus = useGameStore((state) => state.consumePendingChatFocus)

  const [activeId, setActiveId] = useState<ConversationId>(
    () => useGameStore.getState().pendingChatFocus ?? 'kenji',
  )
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [sent, setSent] = useState<Record<ConversationId, LocalMessage[]>>({
    kenji: [],
    mom: [],
    'study-group': [],
    yujiro: [],
    rin: [],
  })
  const [typing, setTyping] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const activeIdRef = useRef(activeId)
  const scrollMemoryRef = useRef<Partial<Record<ConversationId, number>>>({})
  const contentKeysRef = useRef<Partial<Record<ConversationId, string>>>({})
  const ignoreScrollRef = useRef(false)
  activeIdRef.current = activeId

  const kenjiActive = activeId === 'kenji'
  const momActive = activeId === 'mom'
  const chatVisible = useGameStore((state) =>
    state.windows.some((window) => window.type === 'friend-chat' && window.isOpen && !window.isMinimized),
  )
  const chatFocused = useGameStore((state) => {
    const activeId = selectActiveWindowId(state.windows)
    if (!activeId) return false
    return state.windows.find((window) => window.id === activeId)?.type === 'friend-chat'
  })
  const soundOs = useGameStore((state) => selectCurrentOs(state.systemStage, state.bootTarget))

  const contentKeys = useMemo(
    () => ({
      kenji: [
        strings.chat.earlier.length,
        prologue.kenjiAuctionNudgeSent ? 1 : 0,
        prologue.kenjiAuctionWonSent ? 1 : 0,
        prologue.liveMessagesRevealed,
        prologue.isPartitionDownloaded ? 1 : 0,
        typing && kenjiActive ? 1 : 0,
        sent.kenji.length,
      ].join(':'),
      mom: [
        prologue.momNudgeReceived ? 1 : 0,
        prologue.momNudgeRevealed,
        typing && momActive ? 1 : 0,
        sent.mom.length,
      ].join(':'),
      'study-group': String(sent['study-group'].length),
      yujiro: String(sent.yujiro.length),
      rin: String(sent.rin.length),
    }),
    [
      kenjiActive,
      momActive,
      typing,
      sent,
      prologue.kenjiAuctionNudgeSent,
      prologue.kenjiAuctionWonSent,
      prologue.liveMessagesRevealed,
      prologue.isPartitionDownloaded,
      prologue.momNudgeReceived,
      prologue.momNudgeRevealed,
    ],
  )

  const applyScrollPosition = useCallback((node: HTMLDivElement, id: ConversationId) => {
    const remembered = scrollMemoryRef.current[id]
    ignoreScrollRef.current = true
    node.scrollTop = remembered === undefined ? node.scrollHeight : remembered
    requestAnimationFrame(() => {
      ignoreScrollRef.current = false
    })
  }, [])

  const setScrollerRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollerRef.current = node
      if (node) applyScrollPosition(node, activeIdRef.current)
    },
    [applyScrollPosition],
  )

  const rememberScroll = useCallback(() => {
    if (ignoreScrollRef.current) return
    const node = scrollerRef.current
    if (!node) return
    const id = activeIdRef.current
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight
    if (distanceFromBottom <= SCROLL_BOTTOM_PX) {
      delete scrollMemoryRef.current[id]
    } else {
      scrollMemoryRef.current[id] = node.scrollTop
    }
  }, [])

  const selectConversation = useCallback(
    (id: ConversationId) => {
      rememberScroll()
      setTyping(false)
      setActiveId(id)
      setDraft('')
    },
    [rememberScroll],
  )

  useEffect(() => {
    if (!pendingChatFocus || pendingChatFocus === activeId) {
      if (pendingChatFocus) consumePendingChatFocus()
      return
    }
    rememberScroll()
    setTyping(false)
    setActiveId(pendingChatFocus)
    consumePendingChatFocus()
  }, [pendingChatFocus, activeId, consumePendingChatFocus, rememberScroll])

  useEffect(() => {
    if (kenjiActive) clearChatNotification()
    if (activeId === 'mom') clearMomChatNotification()
  }, [
    kenjiActive,
    activeId,
    prologue.chatNotificationPending,
    prologue.momChatNotificationPending,
    clearChatNotification,
    clearMomChatNotification,
  ])

  const waitingForKenji =
    chatVisible &&
    kenjiActive &&
    prologue.friendMessageReceived &&
    prologue.liveMessagesRevealed >= 1 &&
    prologue.liveMessagesRevealed < LIVE_MESSAGE_COUNT

  const waitingForMom =
    chatVisible &&
    momActive &&
    prologue.momNudgeReceived &&
    prologue.momNudgeRevealed >= 1 &&
    prologue.momNudgeRevealed < MOM_NUDGE_COUNT

  const kenjiIncomingCount =
    (prologue.kenjiAuctionNudgeSent ? 1 : 0) +
    (prologue.kenjiAuctionWonSent ? 1 : 0) +
    prologue.liveMessagesRevealed +
    (prologue.isPartitionDownloaded ? 1 : 0)
  const kenjiIncomingRef = useRef(kenjiIncomingCount)
  const momIncomingRef = useRef(prologue.momNudgeRevealed)

  useEffect(() => {
    const previous = kenjiIncomingRef.current
    kenjiIncomingRef.current = kenjiIncomingCount
    if (!chatFocused || !kenjiActive) return
    if (kenjiIncomingCount > previous) playMessageSound(soundOs)
  }, [kenjiIncomingCount, chatFocused, kenjiActive, soundOs])

  useEffect(() => {
    const previous = momIncomingRef.current
    momIncomingRef.current = prologue.momNudgeRevealed
    if (!chatFocused || !momActive) return
    if (prologue.momNudgeRevealed > previous) playMessageSound(soundOs)
  }, [prologue.momNudgeRevealed, chatFocused, momActive, soundOs])

  useEffect(() => {
    if (!waitingForKenji) return
    const duration = typingDurationMs(nextKenjiLiveText(prologue.liveMessagesRevealed))
    const start = window.setTimeout(() => setTyping(true), TYPING_GAP_MS)
    const id = window.setTimeout(() => {
      setTyping(false)
      revealNextLiveMessage()
    }, TYPING_GAP_MS + duration)

    return () => {
      window.clearTimeout(start)
      window.clearTimeout(id)
      setTyping(false)
    }
  }, [waitingForKenji, prologue.liveMessagesRevealed, revealNextLiveMessage])

  useEffect(() => {
    if (!waitingForMom) return
    const duration = typingDurationMs(nextMomNudgeText(prologue.momNudgeRevealed))
    const start = window.setTimeout(() => setTyping(true), TYPING_GAP_MS)
    const id = window.setTimeout(() => {
      setTyping(false)
      revealNextMomNudge()
    }, TYPING_GAP_MS + duration)

    return () => {
      window.clearTimeout(start)
      window.clearTimeout(id)
      setTyping(false)
    }
  }, [waitingForMom, prologue.momNudgeRevealed, revealNextMomNudge])

  useLayoutEffect(() => {
    for (const id of Object.keys(contentKeys) as ConversationId[]) {
      const next = contentKeys[id]
      const prev = contentKeysRef.current[id]
      if (prev !== undefined && prev !== next) {
        delete scrollMemoryRef.current[id]
      }
      contentKeysRef.current[id] = next
    }

    const node = scrollerRef.current
    if (node) applyScrollPosition(node, activeId)
  }, [activeId, contentKeys, applyScrollPosition])

  const conversations = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const recency = prologue.chatRecency
    return strings.chat.conversations
      .filter((conversation) => (needle ? conversation.name.toLowerCase().includes(needle) : true))
      .slice()
      .sort((a, b) => (recency[b.id] ?? 0) - (recency[a.id] ?? 0))
  }, [query, prologue.chatRecency])

  const active = strings.chat.conversations.find((conversation) => conversation.id === activeId)
  const liveMessages = strings.chat.live.slice(0, prologue.liveMessagesRevealed)
  const showAttachment = prologue.liveMessagesRevealed >= LIVE_MESSAGE_COUNT

  function sendDraft() {
    const text = draft.trim()
    if (!text) return
    const time = nextChatTime(sidebarPreview(activeId, prologue, sent[activeId]).time)
    setSent((current) => ({
      ...current,
      [activeId]: [...current[activeId], { from: 'player', time, text }],
    }))
    setDraft('')
  }

  return (
    <div className="flex h-full bg-white font-[ui-sans-serif,-apple-system,'Segoe_UI',sans-serif] text-[17px] text-neutral-900">
      <aside className="flex w-[30%] min-w-[260px] flex-col border-r border-black/8 bg-[#f5f5f7]">
        <div className="px-3 pt-3 pb-2">
          <div className="mb-2 px-1 text-[22px] font-semibold tracking-tight">
            {strings.chat.appName}
          </div>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={strings.chat.searchPlaceholder}
            className="h-8 w-full rounded-full border-0 bg-black/6 px-3 text-[16px] outline-none placeholder:text-neutral-400"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-1.5 pb-2">
          {conversations.map((conversation) => {
            const unread =
              (conversation.id === 'kenji' && prologue.chatNotificationPending) ||
              (conversation.id === 'mom' && prologue.momChatNotificationPending)
            const selected = conversation.id === activeId
            const isTypingHere =
              typing &&
              ((conversation.id === 'kenji' && kenjiActive) ||
                (conversation.id === 'mom' && momActive))
            const preview = sidebarPreview(conversation.id, prologue, sent[conversation.id])
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => selectConversation(conversation.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left',
                  selected ? 'bg-[#0a84ff] text-white' : 'text-neutral-900 hover:bg-black/5',
                )}
              >
                <Avatar name={conversation.name} color={conversation.color} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[17px] font-semibold">{conversation.name}</span>
                    <span
                      className={cn(
                        'shrink-0 text-[13px]',
                        selected ? 'text-white/70' : 'text-neutral-400',
                      )}
                    >
                      {preview.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'truncate text-[16px]',
                        isTypingHere
                          ? selected
                            ? 'italic text-white'
                            : 'italic text-[#0a84ff]'
                          : selected
                            ? 'text-white/80'
                            : 'text-neutral-500',
                      )}
                    >
                      {isTypingHere ? strings.chat.sidebarTyping : preview.text}
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
                  <div className="truncate text-[18px] font-semibold">{active.name}</div>
                  <div className={cn('text-[14px]', typing ? 'text-[#0a84ff]' : 'text-neutral-500')}>
                    {typing && active.id === 'mom'
                      ? strings.chat.momTyping
                      : typing && active.id === 'kenji'
                        ? strings.chat.typing
                        : active.status}
                  </div>
                </div>
              </header>

              <div
                ref={setScrollerRef}
                onScroll={rememberScroll}
                className="min-h-0 flex-1 space-y-1.5 overflow-auto px-4 py-4"
              >
                <div className="pb-2 text-center text-[14px] text-neutral-400">
                  {active.id === 'rin' ? strings.chat.yesterday : strings.chat.today}
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
                    {prologue.kenjiAuctionNudgeSent ? (
                      <Bubble
                        from="them"
                        time={prologue.kenjiAuctionNudgeTime ?? undefined}
                        linkPreview={AUCTION_LINK_PREVIEW}
                        index={strings.chat.earlier.length}
                      >
                        {strings.chat.auctionNudge}
                      </Bubble>
                    ) : null}
                    {prologue.kenjiAuctionWonSent ? (
                      <Bubble
                        from="them"
                        time={prologue.kenjiAuctionWonTime ?? undefined}
                        index={
                          strings.chat.earlier.length + (prologue.kenjiAuctionNudgeSent ? 1 : 0)
                        }
                      >
                        {prologue.kenjiAuctionNudgeSent
                          ? strings.chat.auctionWonAfterNudge
                          : strings.chat.auctionWonDirect}
                      </Bubble>
                    ) : null}
                    {liveMessages.map((text, index) => (
                      <Bubble
                        key={`live-${index}`}
                        from="them"
                        time={prologue.liveMessageTimes[index]}
                        index={kenjiLeadCount(prologue) + index}
                      >
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
                      <Bubble
                        from="them"
                        time={prologue.partitionMountedTime ?? undefined}
                        index={kenjiLeadCount(prologue) + liveMessages.length}
                      >
                        {strings.chat.final}
                      </Bubble>
                    ) : null}
                    {sent.kenji.map((message, index) => (
                      <Bubble
                        key={`${message.time}-${message.text}`}
                        from="player"
                        time={message.time}
                        index={
                          kenjiLeadCount(prologue) +
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
                    {threadMessages(
                      active.id,
                      prologue.momNudgeReceived,
                      prologue.momNudgeRevealed,
                      prologue.momNudgeTimes,
                      prologue.momNudgeTime,
                    ).map((message, index) => (
                      <Bubble
                        key={`${message.time ?? 'nudge'}-${message.text}-${index}`}
                        from={message.from === 'player' ? 'player' : 'them'}
                        sender={message.sender}
                        time={message.time}
                        linkPreview={message.linkPreview}
                        index={index}
                      >
                        {message.text}
                      </Bubble>
                    ))}
                    {active.id === 'rin' && sent.rin.length === 0 ? (
                      <ReadReceipt label={strings.chat.rinReadAt} />
                    ) : null}
                    {sent[active.id].map((message, index) => (
                      <Bubble
                        key={`${message.time}-${message.text}`}
                        from="player"
                        time={message.time}
                        index={
                          threadMessages(
                            active.id,
                            prologue.momNudgeReceived,
                            prologue.momNudgeRevealed,
                            prologue.momNudgeTimes,
                            prologue.momNudgeTime,
                          ).length + index
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
                  className="h-9 min-w-0 flex-1 rounded-full bg-[#f1f1f3] px-4 text-[17px] outline-none placeholder:text-neutral-400"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="rounded-full bg-[#0a84ff] px-3.5 py-1.5 text-[17px] font-semibold text-white disabled:opacity-40"
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

interface ThreadMessage {
  from: 'player' | 'them'
  time?: string
  text: string
  sender?: string
  linkPreview?: ChatLinkPreview
}

function threadMessages(
  id: ConversationId,
  momNudgeReceived: boolean,
  momNudgeRevealed: number,
  momNudgeTimes: string[],
  momNudgeTime: string | null,
): ThreadMessage[] {
  if (id === 'study-group') return [...strings.chat.studyGroup]
  if (id === 'yujiro') return [...strings.chat.yujiro]
  if (id === 'rin') return [...strings.chat.rin]
  const messages: ThreadMessage[] = [...strings.chat.mom]
  if (!momNudgeReceived) return messages
  const count = Math.max(0, momNudgeRevealed)
  for (let index = 0; index < Math.min(count, strings.chat.momNudge.length); index += 1) {
    const message = strings.chat.momNudge[index]
    messages.push({
      from: message.from,
      text: message.text,
      time: momNudgeTimes[index] ?? momNudgeTime ?? undefined,
    })
  }
  if (count >= MOM_NUDGE_COUNT) {
    messages.push({
      from: 'them',
      text: '',
      time: momNudgeTimes[MOM_NUDGE_COUNT - 1] ?? momNudgeTime ?? undefined,
      linkPreview: MOM_LINK_PREVIEW,
    })
  }
  return messages
}

function kenjiLeadCount(
  prologue: ReturnType<typeof useGameStore.getState>['prologue'],
) {
  return (
    strings.chat.earlier.length +
    (prologue.kenjiAuctionNudgeSent ? 1 : 0) +
    (prologue.kenjiAuctionWonSent ? 1 : 0)
  )
}

function sidebarPreview(
  id: ConversationId,
  prologue: ReturnType<typeof useGameStore.getState>['prologue'],
  extras: LocalMessage[],
): { text: string; time: string } {
  const fallback = strings.chat.conversations.find((conversation) => conversation.id === id)
  const fallbackTime = fallback?.time ?? ''

  if (extras.length > 0) {
    const last = extras[extras.length - 1]
    return { text: last.text, time: last.time }
  }
  if (id === 'kenji') {
    if (prologue.isPartitionDownloaded) {
      return { text: strings.chat.final, time: prologue.partitionMountedTime ?? fallbackTime }
    }
    if (prologue.liveMessagesRevealed > 0) {
      const index = prologue.liveMessagesRevealed - 1
      return {
        text: strings.chat.live[index],
        time: prologue.liveMessageTimes[index] ?? fallbackTime,
      }
    }
    if (prologue.kenjiAuctionWonSent) {
      return {
        text: prologue.kenjiAuctionNudgeSent
          ? strings.chat.auctionWonAfterNudge
          : strings.chat.auctionWonDirect,
        time: prologue.kenjiAuctionWonTime ?? fallbackTime,
      }
    }
    if (prologue.kenjiAuctionNudgeSent) {
      return { text: strings.chat.auctionNudge, time: prologue.kenjiAuctionNudgeTime ?? fallbackTime }
    }
  }
  if (id === 'mom' && prologue.momNudgeReceived && prologue.momNudgeRevealed > 0) {
    const revealed = prologue.momNudgeRevealed
    const textIndex = Math.min(revealed, strings.chat.momNudge.length) - 1
    const timeIndex = Math.min(revealed, MOM_NUDGE_COUNT) - 1
    return {
      text: strings.chat.momNudge[textIndex]?.text ?? fallback?.preview ?? '',
      time: prologue.momNudgeTimes[timeIndex] ?? prologue.momNudgeTime ?? fallbackTime,
    }
  }
  return { text: fallback?.preview ?? '', time: fallbackTime }
}

function Avatar({ name, color }: { name: string; color: string }) {
  const initial = name.trim().charAt(0).toUpperCase()
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[17px] font-semibold text-white"
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
  linkPreview,
  children,
}: {
  from: 'player' | 'them'
  time?: string
  sender?: string
  index?: number
  linkPreview?: ChatLinkPreview
  children: ReactNode
}) {
  const mine = from === 'player'
  const hasText = typeof children === 'string' ? children.length > 0 : children != null
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
          <div className="mb-0.5 text-[13px] font-semibold text-neutral-500">{sender}</div>
        ) : null}
        {hasText ? <div>{children}</div> : null}
        {linkPreview ? <LinkPreviewCard preview={linkPreview} /> : null}
        {time ? (
          <div className={cn('mt-1 text-[13px]', mine ? 'text-white/70' : 'text-neutral-400')}>
            {time}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}

function LinkPreviewCard({ preview }: { preview: ChatLinkPreview }) {
  const openWindow = useGameStore((state) => state.openWindow)
  const requestNewsArticle = useGameStore((state) => state.requestNewsArticle)
  const requestAuctionLot = useGameStore((state) => state.requestAuctionLot)

  return (
    <button
      type="button"
      onClick={() => {
        if (preview.targetAuctionLotId) {
          requestAuctionLot(preview.targetAuctionLotId)
          openWindow(preview.targetAppId)
          return
        }
        if (preview.targetArticleId) {
          requestNewsArticle(preview.targetArticleId)
          openWindow(preview.targetAppId)
        }
      }}
      className="mt-2 w-full overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-black/8 hover:bg-[#f7f7f8]"
    >
      <div className="border-b border-black/6 bg-[#f4f4f6] px-3 py-1.5 text-[13px] font-semibold tracking-wide text-neutral-500 uppercase">
        {preview.siteName}
      </div>
      <div className="px-3 py-2">
        <div className="text-[13px] font-bold tracking-[0.14em] text-[#c45c78] uppercase">
          {preview.kicker}
        </div>
        <div className="mt-0.5 text-[17px] leading-snug font-semibold text-neutral-900">
          {preview.title}
        </div>
        <div className="mt-1 line-clamp-2 text-[14px] leading-snug text-neutral-500">
          {preview.excerpt}
        </div>
        <div className="mt-1.5 truncate text-[13px] text-[#0a84ff]">{preview.url}</div>
      </div>
    </button>
  )
}

function ReadReceipt({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, delay: 0.2 }}
      className="flex justify-end pr-1 text-[13px] text-neutral-400"
    >
      {label}
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
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[14px] font-bold text-[#0a84ff]">
          IMG
        </span>
        <div className="min-w-0">
          <div className="truncate text-[17px] font-semibold">{strings.chat.attachmentName}</div>
          <div className="text-[14px] text-neutral-500">
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
          'mt-2 h-8 w-full rounded-full text-[16px] font-semibold',
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
