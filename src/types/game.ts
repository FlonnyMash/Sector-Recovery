export type SystemStage =
  | 'host_os'
  | 'host_login'
  | 'shutting_down'
  | 'black_screen'
  | 'motherboard_splash'
  | 'bios'
  | 'booting'
  | 'legacy_login'
  | 'target_os'
export type OsEnvironment = 'host_os' | 'target_os'

export type AppType =
  | 'system-explorer'
  | 'net-explorer'
  | 'sector-recover'
  | 'operator-notes'
  | 'news-browser'
  | 'friend-chat'
  | 'arcade'
  | 'dev-tools-host'
  | 'dev-tools-target'

export const APP_OS: Record<AppType, OsEnvironment> = {
  'system-explorer': 'target_os',
  'net-explorer': 'target_os',
  'sector-recover': 'target_os',
  'operator-notes': 'target_os',
  'news-browser': 'host_os',
  'friend-chat': 'host_os',
  'arcade': 'host_os',
  'dev-tools-host': 'host_os',
  'dev-tools-target': 'target_os',
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

export type ChatConversationId = 'kenji' | 'mom' | 'study-group' | 'yujiro' | 'rin'

export type AuctionLotId = 'lot-404' | 'lot-401' | 'lot-402' | 'lot-403' | 'lot-405'

export interface ChatLinkPreview {
  url: string
  siteName: string
  kicker: string
  title: string
  excerpt: string
  targetAppId: AppType
  targetArticleId?: string
  targetAuctionLotId?: AuctionLotId
}

export interface PrologueState {
  hasReadTargetArticle: boolean
  isColdCasePublished: boolean
  chatNotificationPending: boolean
  friendMessageReceived: boolean
  imageDownloadProgress: number
  isPartitionDownloaded: boolean
  rebootPromptActive: boolean
  liveMessagesRevealed: number
  momNudgeReceived: boolean
  momChatNotificationPending: boolean
  auctionCountdownStartedAt: number | null
  auctionLot404Sold: boolean
  kenjiAuctionNudgeSent: boolean
  kenjiAuctionWonSent: boolean
  kenjiAuctionNudgeTime: string | null
  kenjiAuctionWonTime: string | null
  liveMessageTimes: string[]
  partitionMountedTime: string | null
  momNudgeTime: string | null
}

export const initialPrologueState: PrologueState = {
  hasReadTargetArticle: false,
  isColdCasePublished: false,
  chatNotificationPending: false,
  friendMessageReceived: false,
  imageDownloadProgress: 0,
  isPartitionDownloaded: false,
  rebootPromptActive: false,
  liveMessagesRevealed: 0,
  momNudgeReceived: false,
  momChatNotificationPending: false,
  auctionCountdownStartedAt: null,
  auctionLot404Sold: false,
  kenjiAuctionNudgeSent: false,
  kenjiAuctionWonSent: false,
  kenjiAuctionNudgeTime: null,
  kenjiAuctionWonTime: null,
  liveMessageTimes: [],
  partitionMountedTime: null,
  momNudgeTime: null,
}

export type NotificationKind = 'chat' | 'system'

export interface OsNotification {
  id: string
  title: string
  body: string
  kind: NotificationKind
}

export const LIVE_MESSAGE_COUNT = 4
export const COLD_CASE_PUBLISH_MS = 180_000
export const MOM_NUDGE_MS = 300_000
export const AUCTION_COUNTDOWN_MS = 5000
export const AUCTION_SOLD_TO_DELAY_MS = 1000
export const KENJI_WON_DELAY_MS = 4000
export const KENJI_AUCTION_NUDGE_MS = 180_000
export const HDD_MESSAGE_DELAY_MS = 25_000

export type RecoveredFileType = 'image' | 'audio' | 'text' | 'system'

export interface RecoveredFile {
  id: string
  name: string
  type: RecoveredFileType
  size: string
  content?: string
}
