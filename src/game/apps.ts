/** App registry. No JSX here, so React Fast Refresh can update importers. */
import type { ComponentType, ReactNode } from 'react'
import { DevTools } from '../components/apps/DevTools'
import { Messenger } from '../components/apps/Messenger'
import { MiniGame } from '../components/apps/MiniGame'
import { ModernChat } from '../components/apps/ModernChat'
import { NetExplorer } from '../components/apps/NetExplorer'
import { NewsBrowser } from '../components/apps/NewsBrowser'
import { OperatorNotes } from '../components/apps/OperatorNotes'
import { PhotoViewer } from '../components/apps/PhotoViewer'
import { SectorRecover } from '../components/apps/SectorRecover'
import { SystemExplorer } from '../components/apps/SystemExplorer'
import { ArcadeIcon, BrowserIcon, ChatIcon, DevSwitchIcon } from '../components/os/icons'
import { retroAppIcon } from '../components/os/retroIcons'
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
  defaultSize: { width: 720, height: 830 },
  minSize: { width: 600, height: 520 },
}

export const APPS: Record<AppType, AppDefinition> = {
  'news-browser': {
    type: 'news-browser',
    title: strings.apps.newsBrowser,
    os: APP_OS['news-browser'],
    icon: BrowserIcon,
    component: NewsBrowser,
    defaultSize: { width: 1140, height: 810 },
    minSize: { width: 780, height: 570 },
  },
  'friend-chat': {
    type: 'friend-chat',
    title: strings.apps.friendChat,
    os: APP_OS['friend-chat'],
    icon: ChatIcon,
    component: ModernChat,
    defaultSize: { width: 1120, height: 780 },
    minSize: { width: 760, height: 520 },
  },
  arcade: {
    type: 'arcade',
    title: strings.apps.arcade,
    os: APP_OS.arcade,
    icon: ArcadeIcon,
    component: MiniGame,
    defaultSize: { width: 1170, height: 730 },
    minSize: { width: 940, height: 620 },
  },
  'system-explorer': {
    type: 'system-explorer',
    title: strings.apps.systemExplorer,
    os: APP_OS['system-explorer'],
    icon: retroAppIcon('computer-pc'),
    component: SystemExplorer,
    defaultSize: { width: 1010, height: 680 },
    minSize: { width: 730, height: 520 },
  },
  'net-explorer': {
    type: 'net-explorer',
    title: strings.apps.netExplorer,
    os: APP_OS['net-explorer'],
    icon: retroAppIcon('globe'),
    component: NetExplorer,
    defaultSize: { width: 1100, height: 820 },
    minSize: { width: 760, height: 600 },
  },
  'sector-recover': {
    type: 'sector-recover',
    title: strings.apps.sectorRecover,
    os: APP_OS['sector-recover'],
    icon: retroAppIcon('computer-recovery'),
    component: SectorRecover,
    defaultSize: { width: 940, height: 680 },
    minSize: { width: 780, height: 570 },
    requiresRecoveryTool: true,
  },
  'operator-notes': {
    type: 'operator-notes',
    title: strings.apps.operatorNotes,
    os: APP_OS['operator-notes'],
    icon: retroAppIcon('notepad-pencil'),
    component: OperatorNotes,
    defaultSize: { width: 540, height: 470 },
    minSize: { width: 420, height: 340 },
  },
  'photo-viewer': {
    type: 'photo-viewer',
    title: strings.apps.photoViewer,
    os: APP_OS['photo-viewer'],
    icon: retroAppIcon('document-image'),
    component: PhotoViewer,
    defaultSize: { width: 980, height: 730 },
    minSize: { width: 620, height: 500 },
  },
  messenger: {
    type: 'messenger',
    title: strings.apps.messenger,
    os: APP_OS.messenger,
    icon: retroAppIcon('chat-bubble'),
    component: Messenger,
    defaultSize: { width: 980, height: 700 },
    minSize: { width: 730, height: 520 },
  },
  'dev-tools-host': {
    type: 'dev-tools-host',
    title: strings.apps.devTools,
    os: APP_OS['dev-tools-host'],
    icon: DevSwitchIcon,
    component: DevTools,
    ...DEV_TOOLS_SIZE,
    devOnly: true,
  },
  'dev-tools-target': {
    type: 'dev-tools-target',
    title: strings.apps.devTools,
    os: APP_OS['dev-tools-target'],
    icon: retroAppIcon('circuit-board'),
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
