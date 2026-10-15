export type MessengerContactId = 'taro' | 'yuka'
export type MessengerPresence = 'online' | 'offline'

export interface MessengerContact {
  id: MessengerContactId
  name: string
  status: MessengerPresence
  statusLine: string
  personalMessage: string
  nameColor: string
}

export interface MessengerMessage {
  id: string
  from: MessengerContactId
  text: string
  time: string
}

export function appendMessage(
  current: MessengerMessage[],
  incoming: MessengerMessage,
): MessengerMessage[] {
  if (current.some((message) => message.id === incoming.id)) return current
  return [...current, incoming]
}

export const MESSENGER_CONTACTS: MessengerContact[] = [
  {
    id: 'taro',
    name: 'Taro',
    status: 'online',
    statusLine: 'Online',
    personalMessage: 'still here',
    nameColor: '#1a5fb4',
  },
  {
    id: 'yuka',
    name: 'Yuka',
    status: 'offline',
    statusLine: 'Offline',
    personalMessage: '',
    nameColor: '#b03a5c',
  },
]

export const SEED_TRANSCRIPT: MessengerMessage[] = [
  { id: 'm1', from: 'taro', text: 'last train is twenty minutes', time: '11:41 PM' },
  { id: 'm2', from: 'yuka', text: 'i know', time: '11:43 PM' },
  { id: 'm3', from: 'taro', text: 'you should still go', time: '11:44 PM' },
  { id: 'm4', from: 'yuka', text: "i don't want to shut this machine down yet", time: '11:47 PM' },
  { id: 'm5', from: 'taro', text: 'the lab closes at midnight', time: '11:49 PM' },
  { id: 'm6', from: 'yuka', text: "rain still isn't stopping", time: '11:52 PM' },
  { id: 'm7', from: 'taro', text: "i'll wait with you until then", time: '11:54 PM' },
  { id: 'm8', from: 'yuka', text: 'you always say that', time: '11:58 PM' },
  { id: 'm9', from: 'taro', text: '...', time: '12:00 AM' },
  { id: 'm10', from: 'yuka', text: 'stay a little longer?', time: '12:02 AM' },
]

export const YUKA_LATE_MESSAGE: MessengerMessage = {
  id: 'yuka-dont-go-yet',
  from: 'yuka',
  text: "don't go yet",
  time: '12:04 AM',
}

export const TYPING_START_MS = 800
export const TYPING_DURATION_MS = 2000

export const MESSENGER_UI = {
  signedInAs: 'Signed in as Taro',
  available: 'Available',
  recoveredSession: 'Recovered session',
  onlineGroup: 'Online',
  offlineGroup: 'Offline',
  typing: 'Yuka is typing a message',
  composePlaceholder: 'Type a message...',
  send: 'Send',
  logDate: 'Saturday, March 19, 2011',
} as const
