import type { ComponentType, ReactNode } from 'react'
import { ModernChat } from '../components/apps/ModernChat'
import { MiniGame } from '../components/apps/MiniGame'
import { NewsBrowser } from '../components/apps/NewsBrowser'
import { OperatorNotes } from '../components/apps/OperatorNotes'
import { RecoveryTerminal } from '../components/apps/RecoveryTerminal'
import { ArcadeIcon, BrowserIcon, ChatIcon, NotesIcon, TerminalIcon } from '../components/os/icons'
import { strings } from '../i18n'
import { APP_OS, type AppType, type OsEnvironment } from '../types/game'

export interface AppDefinition {
  type: AppType
  title: string
  os: OsEnvironment
  icon: (props: { size?: number; badge?: boolean }) => ReactNode
  component: ComponentType
  defaultSize: { width: number; height: number }
  minSize: { width: number; height: number }
}

export const APPS: Record<AppType, AppDefinition> = {
  'news-browser': {
    type: 'news-browser',
    title: strings.apps.newsBrowser,
    os: APP_OS['news-browser'],
    icon: ({ size }) => <BrowserIcon size={size} />,
    component: NewsBrowser,
    defaultSize: { width: 820, height: 560 },
    minSize: { width: 540, height: 400 },
  },
  'friend-chat': {
    type: 'friend-chat',
    title: strings.apps.friendChat,
    os: APP_OS['friend-chat'],
    icon: ({ size, badge }) => <ChatIcon size={size} badge={badge} />,
    component: ModernChat,
    defaultSize: { width: 860, height: 600 },
    minSize: { width: 580, height: 400 },
  },
  arcade: {
    type: 'arcade',
    title: strings.apps.arcade,
    os: APP_OS.arcade,
    icon: ({ size }) => <ArcadeIcon size={size} />,
    component: MiniGame,
    defaultSize: { width: 640, height: 520 },
    minSize: { width: 580, height: 440 },
  },
  'recovery-terminal': {
    type: 'recovery-terminal',
    title: strings.apps.recoveryTerminal,
    os: APP_OS['recovery-terminal'],
    icon: ({ size }) => <TerminalIcon size={size} />,
    component: RecoveryTerminal,
    defaultSize: { width: 720, height: 520 },
    minSize: { width: 600, height: 440 },
  },
  'operator-notes': {
    type: 'operator-notes',
    title: strings.apps.operatorNotes,
    os: APP_OS['operator-notes'],
    icon: ({ size }) => <NotesIcon size={size} />,
    component: OperatorNotes,
    defaultSize: { width: 420, height: 360 },
    minSize: { width: 320, height: 260 },
  },
}

export const APP_LIST = Object.values(APPS)

export function APP_LIST_FOR_OS(os: OsEnvironment): AppDefinition[] {
  return APP_LIST.filter((app) => app.os === os)
}
