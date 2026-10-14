export type SystemStage =
  | 'host_os'
  | 'shutting_down'
  | 'black_screen'
  | 'motherboard_splash'
  | 'bios'
  | 'booting'
  | 'target_os'
export type OsEnvironment = 'host_os' | 'target_os'

export type AppType =
  | 'recovery-terminal'
  | 'operator-notes'
  | 'news-browser'
  | 'friend-chat'
  | 'arcade'

export const APP_OS: Record<AppType, OsEnvironment> = {
  'recovery-terminal': 'target_os',
  'operator-notes': 'target_os',
  'news-browser': 'host_os',
  'friend-chat': 'host_os',
  'arcade': 'host_os',
}

export interface WindowState {
  id: string
  title: string
  type: AppType
  isOpen: boolean
  isMinimized: boolean
  isMaximized: boolean
  zIndex: number
}

export interface PrologueState {
  hasReadTargetArticle: boolean
  chatNotificationPending: boolean
  friendMessageReceived: boolean
  imageDownloadProgress: number
  isPartitionDownloaded: boolean
  rebootPromptActive: boolean
  liveMessagesRevealed: number
}

export const initialPrologueState: PrologueState = {
  hasReadTargetArticle: false,
  chatNotificationPending: false,
  friendMessageReceived: false,
  imageDownloadProgress: 0,
  isPartitionDownloaded: false,
  rebootPromptActive: false,
  liveMessagesRevealed: 0,
}

export type NotificationKind = 'chat' | 'system'

export interface OsNotification {
  id: string
  title: string
  body: string
  kind: NotificationKind
}

export const LIVE_MESSAGE_COUNT = 4
