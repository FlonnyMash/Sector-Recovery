import type { ComponentType, ReactNode } from 'react'
import { DevTools } from '../components/apps/DevTools'
import { MiniGame } from '../components/apps/MiniGame'
import { ModernChat } from '../components/apps/ModernChat'
import { NetExplorer } from '../components/apps/NetExplorer'
import { NewsBrowser } from '../components/apps/NewsBrowser'
import { OperatorNotes } from '../components/apps/OperatorNotes'
import { SectorRecover } from '../components/apps/SectorRecover'
import { SystemExplorer } from '../components/apps/SystemExplorer'
import {
  ArcadeIcon,
  BrowserIcon,
  ChatIcon,
  ComputerIcon,
  DevSwitchIcon,
  IeIcon,
  NotesIcon,
  RecoverToolIcon,
} from '../components/os/icons'
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
  requiresRecoveryTool?: boolean
  /** Only listed in development builds (`import.meta.env.DEV`). */
  devOnly?: boolean
}

const DEV_TOOLS_SIZE = {
  defaultSize: { width: 560, height: 640 },
  minSize: { width: 460, height: 400 },
}

export const APPS: Record<AppType, AppDefinition> = {
  'news-browser': {
    type: 'news-browser',
    title: strings.apps.newsBrowser,
    os: APP_OS['news-browser'],
    icon: ({ size }) => <BrowserIcon size={size} />,
    component: NewsBrowser,
    defaultSize: { width: 880, height: 620 },
    minSize: { width: 600, height: 440 },
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
  'system-explorer': {
    type: 'system-explorer',
    title: strings.apps.systemExplorer,
    os: APP_OS['system-explorer'],
    icon: ({ size }) => <ComputerIcon size={size} />,
    component: SystemExplorer,
    defaultSize: { width: 780, height: 520 },
    minSize: { width: 560, height: 400 },
  },
  'net-explorer': {
    type: 'net-explorer',
    title: strings.apps.netExplorer,
    os: APP_OS['net-explorer'],
    icon: ({ size }) => <IeIcon size={size} />,
    component: NetExplorer,
    defaultSize: { width: 820, height: 580 },
    minSize: { width: 560, height: 420 },
  },
  'sector-recover': {
    type: 'sector-recover',
    title: strings.apps.sectorRecover,
    os: APP_OS['sector-recover'],
    icon: ({ size }) => <RecoverToolIcon size={size} />,
    component: SectorRecover,
    defaultSize: { width: 720, height: 520 },
    minSize: { width: 600, height: 440 },
    requiresRecoveryTool: true,
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
  'dev-tools-host': {
    type: 'dev-tools-host',
    title: strings.apps.devTools,
    os: APP_OS['dev-tools-host'],
    icon: ({ size }) => <DevSwitchIcon size={size} />,
    component: DevTools,
    ...DEV_TOOLS_SIZE,
    devOnly: true,
  },
  'dev-tools-target': {
    type: 'dev-tools-target',
    title: strings.apps.devTools,
    os: APP_OS['dev-tools-target'],
    icon: ({ size }) => <DevSwitchIcon size={size} />,
    component: DevTools,
    ...DEV_TOOLS_SIZE,
    devOnly: true,
  },
}

export const APP_LIST = Object.values(APPS)

export function APP_LIST_FOR_OS(os: OsEnvironment): AppDefinition[] {
  return APP_LIST.filter((app) => app.os === os && (import.meta.env.DEV || !app.devOnly))
}

export function selectVisibleApps(os: OsEnvironment, hasRecoveryTool: boolean): AppDefinition[] {
  return APP_LIST_FOR_OS(os).filter((app) => !app.requiresRecoveryTool || hasRecoveryTool)
}
