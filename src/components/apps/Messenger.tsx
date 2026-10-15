import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { strings } from '../../i18n'
import { cn } from '../../utils/cn'
import {
  appendMessage,
  MESSENGER_CONTACTS,
  MESSENGER_UI,
  SEED_TRANSCRIPT,
  TYPING_DURATION_MS,
  TYPING_START_MS,
  YUKA_LATE_MESSAGE,
  type MessengerContact,
  type MessengerContactId,
  type MessengerMessage,
  type MessengerPresence,
} from './messenger/transcript'

export function Messenger() {
  const [activeId, setActiveId] = useState<MessengerContactId>('taro')
  const [messages, setMessages] = useState<MessengerMessage[]>(SEED_TRANSCRIPT)
  const [yukaTyping, setYukaTyping] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const playedTypingRef = useRef(false)

  const signedIn =
    MESSENGER_CONTACTS.find((contact) => contact.id === 'taro') ?? MESSENGER_CONTACTS[0]
  const active = MESSENGER_CONTACTS.find((contact) => contact.id === activeId) ?? signedIn
  const online = useMemo(
    () => MESSENGER_CONTACTS.filter((contact) => contact.status === 'online'),
    [],
  )
  const offline = useMemo(
    () => MESSENGER_CONTACTS.filter((contact) => contact.status === 'offline'),
    [],
  )

  // Future: a useGameStore subscription should call this (or replace the local list)
  // instead of writing into the JSX.
  const pushMessage = useCallback((incoming: MessengerMessage) => {
    setMessages((current) => appendMessage(current, incoming))
  }, [])

  useEffect(() => {
    if (playedTypingRef.current) return

    const start = window.setTimeout(() => setYukaTyping(true), TYPING_START_MS)
    const done = window.setTimeout(() => {
      playedTypingRef.current = true
      setYukaTyping(false)
      pushMessage(YUKA_LATE_MESSAGE)
    }, TYPING_START_MS + TYPING_DURATION_MS)

    return () => {
      window.clearTimeout(start)
      window.clearTimeout(done)
      setYukaTyping(false)
    }
  }, [pushMessage])

  useEffect(() => {
    const node = logRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages, yukaTyping])

  return (
    <div className="flex h-full bg-[#e8f2fb] font-[Tahoma,'Segoe_UI',sans-serif] text-[12px] text-[#1a1a1a]">
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-[#7ea6c8] bg-gradient-to-b from-[#f4f9fd] to-[#d7e8f6]">
        <div className="bg-gradient-to-b from-[#d7ebfb] via-[#7eb6ea] to-[#1f6fbf] px-3 py-2.5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <div className="text-[13px] font-bold drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
            {strings.apps.messenger}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Avatar contact={signedIn} size="sm" />
            <div className="min-w-0">
              <div className="truncate text-[11px] font-semibold">{MESSENGER_UI.signedInAs}</div>
              <div className="truncate text-[10px] text-white/85">
                {MESSENGER_UI.available} · {MESSENGER_UI.recoveredSession}
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-1.5 py-2">
          <ContactGroup title={MESSENGER_UI.onlineGroup} count={online.length}>
            {online.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                selected={contact.id === activeId}
                onSelect={() => setActiveId(contact.id)}
              />
            ))}
          </ContactGroup>
          <ContactGroup title={MESSENGER_UI.offlineGroup} count={offline.length}>
            {offline.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                selected={contact.id === activeId}
                onSelect={() => setActiveId(contact.id)}
              />
            ))}
          </ContactGroup>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-[#f7fbff]">
        <header className="flex items-center gap-3 border-b border-[#9dbdd8] bg-gradient-to-b from-[#f4f9ff] via-[#d6e9f8] to-[#b7d4ee] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <Avatar contact={active} size="lg" />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold" style={{ color: active.nameColor }}>
              {active.name} ({active.statusLine})
            </div>
            <div className="truncate text-[11px] text-[#4a6a86]">
              {active.personalMessage || active.statusLine}
            </div>
          </div>
        </header>

        <div
          ref={logRef}
          className="min-h-0 flex-1 overflow-auto bg-white px-3 py-3 shadow-[inset_0_2px_8px_rgba(30,70,110,0.12)]"
        >
          <div className="mb-3 text-center text-[11px] text-[#7a8fa3]">{MESSENGER_UI.logDate}</div>
          <div className="space-y-2.5">
            {messages.map((message) => (
              <MessageLine key={message.id} message={message} />
            ))}
          </div>
        </div>

        <div className="border-t border-[#9dbdd8] bg-gradient-to-b from-[#eef6fc] to-[#d4e6f5] px-3 py-1.5 text-[11px] italic text-[#4a6a86]">
          {yukaTyping ? (
            <span>
              {MESSENGER_UI.typing}
              <TypingEllipsis />
            </span>
          ) : (
            <span className="opacity-50">&nbsp;</span>
          )}
        </div>

        <form
          className="flex items-end gap-2 border-t border-[#9dbdd8] bg-gradient-to-b from-[#e4f0fa] to-[#c5daf0] px-3 py-2"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="min-w-0 flex-1 rounded-sm border border-[#7ea6c8] bg-white shadow-[inset_0_1px_3px_rgba(30,70,110,0.18)]">
            <textarea
              readOnly
              rows={2}
              placeholder={MESSENGER_UI.composePlaceholder}
              className="h-[52px] w-full resize-none bg-transparent px-2 py-1.5 text-[12px] outline-none placeholder:text-[#8aa0b4]"
            />
          </div>
          <button
            type="submit"
            disabled
            className="h-8 rounded-sm border border-[#5a8ab8] bg-gradient-to-b from-[#f4f9ff] via-[#c5def4] to-[#7eb6ea] px-3 text-[12px] font-semibold text-[#16385c] opacity-55"
          >
            {MESSENGER_UI.send}
          </button>
        </form>
      </section>
    </div>
  )
}

function ContactGroup({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: ReactNode
}) {
  return (
    <div className="mb-2">
      <div className="px-1.5 py-1 text-[11px] font-bold tracking-wide text-[#1f6fbf]">
        {title} ({count})
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function ContactRow({
  contact,
  selected,
  onSelect,
}: {
  contact: MessengerContact
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-sm px-1.5 py-1.5 text-left',
        selected
          ? 'bg-gradient-to-b from-[#7eb6ea] to-[#2f7ec4] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]'
          : 'hover:bg-[#cfe6f8]',
      )}
    >
      <Avatar contact={contact} size="sm" inverted={selected} />
      <div className="min-w-0 flex-1">
        <div className={cn('truncate text-[12px] font-semibold', !selected && 'text-[#1a1a1a]')}>
          {contact.name} ({contact.statusLine})
        </div>
        {contact.personalMessage ? (
          <div className={cn('truncate text-[10px]', selected ? 'text-white/80' : 'text-[#5a738c]')}>
            {contact.personalMessage}
          </div>
        ) : null}
      </div>
    </button>
  )
}

function MessageLine({ message }: { message: MessengerMessage }) {
  const contact = MESSENGER_CONTACTS.find((entry) => entry.id === message.from)
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="font-bold" style={{ color: contact?.nameColor ?? '#1a1a1a' }}>
          {contact?.name ?? message.from}
        </span>
        <span className="text-[10px] text-[#8aa0b4]">{message.time}</span>
      </div>
      <div className="pl-0.5 leading-snug text-[#222]">{message.text}</div>
    </div>
  )
}

function Avatar({
  contact,
  size,
  inverted = false,
}: {
  contact: MessengerContact
  size: 'sm' | 'lg'
  inverted?: boolean
}) {
  const dimension = size === 'lg' ? 'h-11 w-11 text-[15px]' : 'h-8 w-8 text-[12px]'
  const initial = contact.name.charAt(0)
  return (
    <span className="relative shrink-0">
      <span
        className={cn(
          'flex items-center justify-center rounded-full border-2 font-bold text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.7)]',
          dimension,
          inverted ? 'border-white/80' : 'border-white',
        )}
        style={{ backgroundColor: contact.nameColor }}
      >
        {initial}
      </span>
      <StatusDot status={contact.status} />
    </span>
  )
}

function StatusDot({ status }: { status: MessengerPresence }) {
  return (
    <span
      className={cn(
        'absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border border-white',
        status === 'online'
          ? 'bg-[#3ea74a] shadow-[0_0_4px_rgba(62,167,74,0.9)]'
          : 'bg-[#8a96a4]',
      )}
    />
  )
}

function TypingEllipsis() {
  return (
    <span className="inline-flex w-4" aria-hidden="true">
      <span className="animate-pulse">.</span>
      <span className="animate-pulse [animation-delay:150ms]">.</span>
      <span className="animate-pulse [animation-delay:300ms]">.</span>
    </span>
  )
}
