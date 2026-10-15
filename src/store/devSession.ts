import { isArcadeGameId, type ArcadeGameId } from '../game/arcadeCatalog'
import { initialUpgradeCounts, type UpgradeId } from '../game/upgrades'
import {
  APP_OS,
  initialPrologueState,
  type AuctionLotId,
  type ChatConversationId,
  type OsEnvironment,
  type OsNotification,
  type PrologueState,
  type RecoveredFile,
  type SystemStage,
  type WahooTab,
  type WindowState,
} from '../types/game'

export const DEV_SESSION_KEY = 'sector-recovery:dev-session'
const DEV_SESSION_VERSION = 1

const STAGES: readonly SystemStage[] = [
  'host_os',
  'host_login',
  'shutting_down',
  'black_screen',
  'motherboard_splash',
  'bios',
  'booting',
  'legacy_login',
  'target_os',
]

const ENVIRONMENTS: readonly OsEnvironment[] = ['host_os', 'target_os']

const CHATS: readonly ChatConversationId[] = ['kenji', 'mom', 'study-group', 'yujiro', 'rin']

const LOTS: readonly AuctionLotId[] = ['lot-404', 'lot-401', 'lot-402', 'lot-403', 'lot-405']

const WAHOO_TABS: readonly WahooTab[] = ['home', 'news', 'auctions', 'gaming']

export interface SavedFileUnlock {
  id: string
  isUnlocked: boolean
}

/** Data fields restored after a dev-server update. Actions are never stored. */
export interface DevSessionState {
  dataFragments: number
  fragmentsPerSecond: number
  inventory: RecoveredFile[]
  fileUnlocks: SavedFileUnlock[]
  lifetimeFragments: number
  recoveredSector: number
  activeFileId: string | null
  hasRecoveryTool: boolean
  timeScale: number
  narrativeTimeScale: number
  narrativeElapsedMs: number
  pendingChatFocus: ChatConversationId | null
  newsArticleRequest: string | null
  explorerRevealRequest: { path: string; fileId: string } | null
  auctionLotRequest: AuctionLotId | null
  wahooTabRequest: WahooTab | null
  installedArcadeGames: ArcadeGameId[]
  upgrades: Record<UpgradeId, number>
  windows: WindowState[]
  nextZIndex: number
  systemStage: SystemStage
  bootTarget: OsEnvironment
  isLegacyOSUnlocked: boolean
  prologue: PrologueState
  notifications: OsNotification[]
}

export interface DevSessionSnapshot {
  version: typeof DEV_SESSION_VERSION
  momClockElapsedMs: number
  clockOrigin: number
  state: DevSessionState
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function stringOrNull(value: unknown): string | null {
  if (value === null) return null
  return typeof value === 'string' ? value : null
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null
}

function parseInventory(value: unknown): RecoveredFile[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is RecoveredFile => {
    if (!isRecord(item)) return false
    return typeof item.id === 'string' && typeof item.name === 'string' && typeof item.type === 'string'
  })
}

function parseFileUnlocks(value: unknown): SavedFileUnlock[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is SavedFileUnlock => {
    if (!isRecord(item)) return false
    return typeof item.id === 'string' && typeof item.isUnlocked === 'boolean'
  })
}

function parseWindows(value: unknown): WindowState[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is WindowState => {
    if (!isRecord(item)) return false
    return (
      typeof item.id === 'string' &&
      typeof item.title === 'string' &&
      typeof item.type === 'string' &&
      item.type in APP_OS &&
      typeof item.isOpen === 'boolean' &&
      typeof item.isMinimized === 'boolean' &&
      typeof item.isMaximized === 'boolean' &&
      typeof item.zIndex === 'number'
    )
  })
}

function parseNotifications(value: unknown): OsNotification[] {
  if (!Array.isArray(value)) return []
  const notes: OsNotification[] = []
  for (const item of value) {
    if (!isRecord(item)) continue
    if (typeof item.id !== 'string' || typeof item.title !== 'string' || typeof item.body !== 'string') {
      continue
    }
    if (item.kind !== 'chat' && item.kind !== 'system') continue
    const conversationId = oneOf(item.conversationId, CHATS)
    notes.push({
      id: item.id,
      title: item.title,
      body: item.body,
      kind: item.kind,
      ...(conversationId ? { conversationId } : {}),
    })
  }
  return notes
}

function parseReveal(
  value: unknown,
): { path: string; fileId: string } | null {
  if (value === null || value === undefined) return null
  if (!isRecord(value)) return null
  if (typeof value.path !== 'string' || typeof value.fileId !== 'string') return null
  return { path: value.path, fileId: value.fileId }
}

function parseArcadeGames(value: unknown): ArcadeGameId[] {
  if (!Array.isArray(value)) return []
  const ids: ArcadeGameId[] = []
  for (const item of value) {
    if (!isArcadeGameId(item) || ids.includes(item)) continue
    ids.push(item)
  }
  return ids
}

function parseUpgrades(value: unknown): Record<UpgradeId, number> {
  const counts = initialUpgradeCounts()
  if (!isRecord(value)) return counts
  for (const id of Object.keys(counts) as UpgradeId[]) {
    counts[id] = Math.max(0, finiteNumber(value[id], 0))
  }
  return counts
}

function parsePrologue(value: unknown): PrologueState | null {
  if (!isRecord(value)) return null
  const base = initialPrologueState
  const prologue: PrologueState = {
    ...base,
    hasReadTargetArticle: value.hasReadTargetArticle === true,
    isColdCasePublished: value.isColdCasePublished === true,
    chatNotificationPending: value.chatNotificationPending === true,
    friendMessageReceived: value.friendMessageReceived === true,
    imageDownloadProgress: Math.max(0, Math.min(100, finiteNumber(value.imageDownloadProgress, 0))),
    isPartitionDownloaded: value.isPartitionDownloaded === true,
    rebootPromptActive: value.rebootPromptActive === true,
    liveMessagesRevealed: Math.max(0, finiteNumber(value.liveMessagesRevealed, 0)),
    momNudgeReceived: value.momNudgeReceived === true,
    momNudgeRevealed: Math.max(0, finiteNumber(value.momNudgeRevealed, 0)),
    momChatNotificationPending: value.momChatNotificationPending === true,
    auctionCountdownStartedAt:
      typeof value.auctionCountdownStartedAt === 'number' && Number.isFinite(value.auctionCountdownStartedAt)
        ? value.auctionCountdownStartedAt
        : null,
    auctionLot404Sold: value.auctionLot404Sold === true,
    kenjiAuctionNudgeSent: value.kenjiAuctionNudgeSent === true,
    kenjiAuctionWonSent: value.kenjiAuctionWonSent === true,
    kenjiAuctionNudgeTime: stringOrNull(value.kenjiAuctionNudgeTime),
    kenjiAuctionWonTime: stringOrNull(value.kenjiAuctionWonTime),
    liveMessageTimes: Array.isArray(value.liveMessageTimes)
      ? value.liveMessageTimes.filter((entry): entry is string => typeof entry === 'string')
      : [],
    partitionMountedTime: stringOrNull(value.partitionMountedTime),
    momNudgeTime: stringOrNull(value.momNudgeTime),
    momNudgeTimes: Array.isArray(value.momNudgeTimes)
      ? value.momNudgeTimes.filter((entry): entry is string => typeof entry === 'string')
      : [],
    chatRecency: parseChatRecency(value.chatRecency),
  }
  if (prologue.friendMessageReceived && prologue.liveMessagesRevealed === 0) {
    prologue.liveMessagesRevealed = 1
  }
  if (prologue.momNudgeReceived && prologue.momNudgeRevealed === 0) {
    prologue.momNudgeRevealed = 1
  }
  if (prologue.momNudgeTimes.length === 0 && prologue.momNudgeTime) {
    prologue.momNudgeTimes = [prologue.momNudgeTime]
  }
  return prologue
}

function parseChatRecency(value: unknown): Partial<Record<ChatConversationId, number>> {
  if (!isRecord(value)) return {}
  const recency: Partial<Record<ChatConversationId, number>> = {}
  for (const id of CHATS) {
    const stamp = value[id]
    if (typeof stamp === 'number' && Number.isFinite(stamp)) recency[id] = stamp
  }
  return recency
}

export function parseDevSession(raw: string): DevSessionSnapshot | null {
  try {
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value) || value.version !== DEV_SESSION_VERSION) return null
    if (!isRecord(value.state)) return null
    const data = value.state
    const systemStage = oneOf(data.systemStage, STAGES)
    const bootTarget = oneOf(data.bootTarget, ENVIRONMENTS)
    const prologue = parsePrologue(data.prologue)
    if (!systemStage || !bootTarget || !prologue) return null
    if (typeof data.dataFragments !== 'number' || !Number.isFinite(data.dataFragments)) return null

    return {
      version: DEV_SESSION_VERSION,
      momClockElapsedMs: Math.max(0, finiteNumber(value.momClockElapsedMs, 0)),
      clockOrigin: finiteNumber(value.clockOrigin, 0),
      state: {
        dataFragments: Math.max(0, data.dataFragments),
        fragmentsPerSecond: Math.max(0, finiteNumber(data.fragmentsPerSecond, 0)),
        inventory: parseInventory(data.inventory),
        fileUnlocks: parseFileUnlocks(data.fileUnlocks),
        lifetimeFragments: Math.max(0, finiteNumber(data.lifetimeFragments, 0)),
        recoveredSector: Math.max(0, finiteNumber(data.recoveredSector, 0)),
        activeFileId: stringOrNull(data.activeFileId),
        hasRecoveryTool: data.hasRecoveryTool === true,
        timeScale: Math.max(0.01, finiteNumber(data.timeScale, 1)),
        narrativeTimeScale: Math.max(0.01, finiteNumber(data.narrativeTimeScale, 1)),
        narrativeElapsedMs: Math.max(0, finiteNumber(data.narrativeElapsedMs, 0)),
        pendingChatFocus: oneOf(data.pendingChatFocus, CHATS),
        newsArticleRequest: stringOrNull(data.newsArticleRequest),
        explorerRevealRequest: parseReveal(data.explorerRevealRequest),
        auctionLotRequest: oneOf(data.auctionLotRequest, LOTS),
        wahooTabRequest: oneOf(data.wahooTabRequest, WAHOO_TABS),
        installedArcadeGames: parseArcadeGames(data.installedArcadeGames),
        upgrades: parseUpgrades(data.upgrades),
        windows: parseWindows(data.windows),
        nextZIndex: Math.max(1, finiteNumber(data.nextZIndex, 100)),
        systemStage,
        bootTarget,
        isLegacyOSUnlocked: data.isLegacyOSUnlocked === true,
        prologue,
        notifications: parseNotifications(data.notifications),
      },
    }
  } catch {
    return null
  }
}

export function serializeDevSession(snapshot: DevSessionSnapshot): string {
  return JSON.stringify(snapshot)
}
