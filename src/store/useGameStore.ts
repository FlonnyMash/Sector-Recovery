import { create } from 'zustand'
import { strings } from '../i18n'
import type { ArcadeGameId } from '../game/arcadeCatalog'
import { instantiateLootByName, rollLoot, type ScanResult } from '../game/loot'
import { computeFragmentsPerSecond, getUpgradeCost, initialUpgradeCounts } from '../game/upgrades'
import type { UpgradeId } from '../game/upgrades'
import {
  createInitialFiles,
  newlyUnlockedFiles,
  unlockFilesForSector as markFilesUnlockedForSector,
  viewerAppForFile,
  withLifetimeGain,
} from '../game/virtualFiles'
import {
  APP_OS,
  AUCTION_COUNTDOWN_MS,
  COLD_CASE_PUBLISH_MS,
  HDD_MESSAGE_DELAY_ARTICLE_FIRST_MS,
  HDD_MESSAGE_DELAY_MS,
  KENJI_AUCTION_NUDGE_MS,
  KENJI_WON_DELAY_MS,
  LIVE_MESSAGE_COUNT,
  MOM_NUDGE_COUNT,
  MOM_NUDGE_MS,
  initialPrologueState,
  type AppType,
  type AuctionLotId,
  type ChatConversationId,
  type NotificationKind,
  type OsEnvironment,
  type OsNotification,
  type PrologueState,
  type RecoveredFile,
  type SystemStage,
  type VirtualFile,
  type WahooTab,
  type WindowState,
} from '../types/game'
import { nextChatTime, sequentialChatTimes } from '../utils/format'
import { getGameClockOrigin, resetGameClock, restoreGameClock } from '../utils/gameClock'
import { playNotificationSound } from '../utils/sounds'
import {
  DEV_SESSION_KEY,
  parseDevSession,
  serializeDevSession,
  type DevSessionState,
} from './devSession'

export type { RecoveredFile, VirtualFile }

const APP_TITLES: Record<AppType, string> = {
  'system-explorer': strings.apps.systemExplorer,
  'net-explorer': strings.apps.netExplorer,
  'sector-recover': strings.apps.sectorRecover,
  'operator-notes': strings.apps.operatorNotes,
  'photo-viewer': strings.apps.photoViewer,
  messenger: strings.apps.messenger,
  'news-browser': strings.apps.newsBrowser,
  'friend-chat': strings.apps.friendChat,
  arcade: strings.apps.arcade,
  'dev-tools-host': strings.apps.devTools,
  'dev-tools-target': strings.apps.devTools,
}

const DEV_APP_TYPES: readonly AppType[] = ['dev-tools-host', 'dev-tools-target']

const DOWNLOAD_DURATION_MS = 3000
const NOTIFICATION_TTL_MS = 5000

let hddTimer: number | null = null
let auctionSoldTimer: number | null = null
let kenjiWonTimer: number | null = null
let downloadTimer: number | null = null
let momClockTimer: number | null = null
let momClockLastTick = 0
let momClockElapsedMs = 0
const notificationTimers = new Map<string, number>()

function stopMomClockInterval() {
  if (momClockTimer === null) return
  window.clearInterval(momClockTimer)
  momClockTimer = null
}

function narrativeClockComplete(prologue: PrologueState): boolean {
  const auctionBeat =
    prologue.auctionCountdownStartedAt !== null || prologue.kenjiAuctionNudgeSent
  return (
    auctionBeat &&
    prologue.isColdCasePublished &&
    (prologue.hasReadTargetArticle || prologue.momNudgeReceived)
  )
}

function clearHddTimer() {
  if (hddTimer === null) return
  window.clearTimeout(hddTimer)
  hddTimer = null
}

function clearAuctionTimers() {
  if (auctionSoldTimer !== null) {
    window.clearTimeout(auctionSoldTimer)
    auctionSoldTimer = null
  }
  if (kenjiWonTimer !== null) {
    window.clearTimeout(kenjiWonTimer)
    kenjiWonTimer = null
  }
}

function clearDownloadTimer() {
  if (downloadTimer === null) return
  window.clearInterval(downloadTimer)
  downloadTimer = null
}

function clearNotificationTimers() {
  for (const timer of notificationTimers.values()) window.clearTimeout(timer)
  notificationTimers.clear()
}

function lastKenjiStamp(prologue: PrologueState): string | null {
  if (prologue.partitionMountedTime) return prologue.partitionMountedTime
  if (prologue.liveMessageTimes.length > 0) {
    return prologue.liveMessageTimes[prologue.liveMessageTimes.length - 1] ?? null
  }
  if (prologue.kenjiAuctionWonTime) return prologue.kenjiAuctionWonTime
  if (prologue.kenjiAuctionNudgeTime) return prologue.kenjiAuctionNudgeTime
  const earlier = strings.chat.earlier
  return earlier[earlier.length - 1]?.time ?? null
}

function lastMomStamp(prologue: PrologueState): string | null {
  if (prologue.momNudgeTimes.length > 0) {
    return prologue.momNudgeTimes[prologue.momNudgeTimes.length - 1] ?? null
  }
  if (prologue.momNudgeTime) return prologue.momNudgeTime
  const mom = strings.chat.mom
  return mom[mom.length - 1]?.time ?? null
}

function bumpChatRecency(
  prologue: PrologueState,
  id: ChatConversationId,
): Partial<Record<ChatConversationId, number>> {
  return { ...prologue.chatRecency, [id]: Date.now() }
}

function isFriendChatFocused(windows: WindowState[]): boolean {
  const activeId = selectActiveWindowId(windows)
  if (!activeId) return false
  const active = windows.find((window) => window.id === activeId)
  return active?.type === 'friend-chat'
}

function scheduleKenjiWon(delayMs: number) {
  if (kenjiWonTimer !== null) return
  kenjiWonTimer = window.setTimeout(() => {
    kenjiWonTimer = null
    const afterSold = useGameStore.getState().prologue
    if (afterSold.kenjiAuctionWonSent) return
    const stamp = nextChatTime(lastKenjiStamp(afterSold))
    useGameStore.setState({
      prologue: patchPrologue(afterSold, {
        kenjiAuctionWonSent: true,
        kenjiAuctionWonTime: stamp,
        chatNotificationPending: true,
        chatRecency: bumpChatRecency(afterSold, 'kenji'),
      }),
      pendingChatFocus: 'kenji',
    })
    useGameStore.getState().pushNotification({
      title: strings.notifications.kenjiTitle,
      body: afterSold.kenjiAuctionNudgeSent
        ? strings.chat.auctionWonAfterNudge
        : strings.chat.auctionWonDirect,
      kind: 'chat',
      conversationId: 'kenji',
    })
    // Reaching here with the article already read means the player did the
    // reading before the auction resolved, so Kenji can follow up sooner.
    maybeScheduleHddMessages(
      useGameStore.getState,
      (partial) => {
        useGameStore.setState(partial)
      },
      HDD_MESSAGE_DELAY_ARTICLE_FIRST_MS,
    )
  }, delayMs)
}

function scheduleAuctionSold(delayMs: number) {
  if (auctionSoldTimer !== null) return
  auctionSoldTimer = window.setTimeout(() => {
    auctionSoldTimer = null
    const afterCountdown = useGameStore.getState().prologue
    if (afterCountdown.auctionLot404Sold) return
    useGameStore.setState({
      prologue: patchPrologue(afterCountdown, { auctionLot404Sold: true }),
    })
    scheduleKenjiWon(KENJI_WON_DELAY_MS)
  }, delayMs)
}

function beginPartitionDownload(fromProgress: number) {
  clearDownloadTimer()
  const startProgress = Math.max(0, Math.min(99, fromProgress))
  const remainingMs = Math.max(50, DOWNLOAD_DURATION_MS * ((100 - startProgress) / 100))
  const startedAt = performance.now()
  downloadTimer = window.setInterval(() => {
    const elapsed = Math.min(1, (performance.now() - startedAt) / remainingMs)
    const progress = Math.min(100, Math.round(startProgress + (100 - startProgress) * elapsed))
    useGameStore.getState().setImageDownloadProgress(progress)
    if (progress < 100 || downloadTimer === null) return
    clearDownloadTimer()
    useGameStore.setState((state) => ({
      prologue: patchPrologue(state.prologue, {
        imageDownloadProgress: 100,
        isPartitionDownloaded: true,
        partitionMountedTime: nextChatTime(lastKenjiStamp(state.prologue)),
        chatRecency: bumpChatRecency(state.prologue, 'kenji'),
        rebootPromptActive: true,
      }),
    }))
    useGameStore.getState().pushNotification({
      title: strings.notifications.rebootTitle,
      body: strings.notifications.rebootBody,
      kind: 'system',
    })
  }, 50)
}

function maybeScheduleHddMessages(
  get: () => GameState,
  set: (partial: { prologue: PrologueState; pendingChatFocus?: ChatConversationId | null }) => void,
  delayMs: number = HDD_MESSAGE_DELAY_MS,
) {
  const { prologue } = get()
  if (!prologue.hasReadTargetArticle || !prologue.kenjiAuctionWonSent || prologue.friendMessageReceived) {
    return
  }
  if (hddTimer !== null) return
  hddTimer = window.setTimeout(() => {
    hddTimer = null
    const current = get().prologue
    if (current.friendMessageReceived) return
    const stamp = nextChatTime(lastKenjiStamp(current))
    set({
      prologue: patchPrologue(current, {
        friendMessageReceived: true,
        chatNotificationPending: true,
        liveMessagesRevealed: Math.max(1, current.liveMessagesRevealed),
        liveMessageTimes:
          current.liveMessageTimes.length > 0 ? current.liveMessageTimes : [stamp],
        chatRecency: bumpChatRecency(current, 'kenji'),
      }),
      pendingChatFocus: 'kenji',
    })
    get().pushNotification({
      title: strings.notifications.kenjiTitle,
      body: strings.chat.live[0],
      kind: 'chat',
      conversationId: 'kenji',
    })
  }, delayMs)
}

export function selectActiveWindowId(windows: WindowState[]): string | null {
  const visible = windows.filter((window) => window.isOpen && !window.isMinimized)
  if (visible.length === 0) return null
  return visible.reduce((best, window) => (window.zIndex > best.zIndex ? window : best)).id
}

export function selectWindowsForOs(windows: WindowState[], os: OsEnvironment): WindowState[] {
  return windows.filter((window) => APP_OS[window.type] === os)
}

export function selectCurrentOs(stage: SystemStage, bootTarget: OsEnvironment): OsEnvironment {
  return stage === 'host_os' || stage === 'target_os' ? stage : bootTarget
}

interface GameState {
  dataFragments: number
  fragmentsPerSecond: number
  inventory: RecoveredFile[]
  files: VirtualFile[]
  lifetimeFragments: number
  recoveredSector: number
  activeFileId: string | null
  hasRecoveryTool: boolean
  /** Dev-only multiplier applied to passive income. 1 = normal speed. */
  timeScale: number
  /** Dev-only multiplier applied to the host-OS story idle clock. 1 = real time. */
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
  scanSector: () => ScanResult
  unlockFilesForSector: (sector: number) => void
  openFile: (fileId: string) => void
  openFileLocation: (fileId: string) => void
  downloadRecoveryTool: () => void
  tick: (deltaSeconds: number) => void
  purchaseUpgrade: (id: UpgradeId) => void
  openWindow: (type: AppType) => void
  setWindowTitle: (type: AppType, title: string) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  toggleMaximize: (id: string) => void
  focusWindow: (id: string) => void
  toggleFromTaskbar: (id: string) => void
  showDesktop: () => void
  markTargetArticleRead: () => void
  revealNextLiveMessage: () => void
  revealNextMomNudge: () => void
  clearChatNotification: () => void
  clearMomChatNotification: () => void
  startMomNudgeClock: () => void
  pauseMomNudgeClock: () => void
  deliverMomNudge: () => void
  watchAuction: () => void
  deliverKenjiAuctionNudge: () => void
  consumePendingChatFocus: () => void
  focusChat: (id: ChatConversationId) => void
  requestNewsArticle: (articleId: string) => void
  clearNewsArticleRequest: () => void
  clearExplorerRevealRequest: () => void
  requestAuctionLot: (id: AuctionLotId) => void
  clearAuctionLotRequest: () => void
  requestWahooTab: (tab: WahooTab) => void
  clearWahooTabRequest: () => void
  installArcadeGame: (id: ArcadeGameId) => void
  startPartitionDownload: () => void
  setImageDownloadProgress: (progress: number) => void
  pushNotification: (input: {
    title: string
    body: string
    kind: NotificationKind
    conversationId?: ChatConversationId
  }) => void
  dismissNotification: (id: string) => void
  holdNotification: (id: string) => void
  releaseNotification: (id: string) => void
  startRebootSequence: () => void
  setSystemStage: (stage: SystemStage) => void
  restartSystem: () => void
  bootFrom: (target: OsEnvironment) => void
  finishBoot: () => void
  unlockLegacyOS: () => void
  signInHostOS: () => void
  // Developer tools (only reachable from the dev-only Dev Tools app).
  devSwitchOs: (target: OsEnvironment) => void
  devAddFragments: (amount: number) => void
  devSetFragments: (amount: number) => void
  devSetRecoveryTool: (installed: boolean) => void
  devPatchPrologue: (patch: Partial<PrologueState>) => void
  devCompletePrologue: () => void
  devGrantUpgrade: (id: UpgradeId, count: number) => void
  devResetUpgrades: () => void
  devSetInventory: (names: string[]) => void
  devSetTimeScale: (scale: number) => void
  devSetNarrativeTimeScale: (scale: number) => void
  devCloseOtherWindows: () => void
  devResetGame: () => void
}

function patchPrologue(prologue: PrologueState, patch: Partial<PrologueState>): PrologueState {
  return { ...prologue, ...patch }
}

function applyNarrativeThresholds(
  get: () => GameState,
  set: (partial: { prologue: PrologueState; narrativeElapsedMs?: number }) => void,
) {
  const { prologue } = get()
  if (momClockElapsedMs >= COLD_CASE_PUBLISH_MS && !prologue.isColdCasePublished) {
    set({ prologue: patchPrologue(prologue, { isColdCasePublished: true }) })
  }
  if (momClockElapsedMs >= KENJI_AUCTION_NUDGE_MS) {
    get().deliverKenjiAuctionNudge()
  }
  if (momClockElapsedMs >= MOM_NUDGE_MS) {
    get().deliverMomNudge()
  }
  if (narrativeClockComplete(get().prologue)) {
    stopMomClockInterval()
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  dataFragments: 0,
  fragmentsPerSecond: 0,
  inventory: [],
  files: createInitialFiles(),
  lifetimeFragments: 0,
  recoveredSector: 0,
  activeFileId: null,
  hasRecoveryTool: false,
  timeScale: 1,
  narrativeTimeScale: 1,
  narrativeElapsedMs: 0,
  pendingChatFocus: null,
  newsArticleRequest: null,
  explorerRevealRequest: null,
  auctionLotRequest: null,
  wahooTabRequest: null,
  installedArcadeGames: [],
  upgrades: initialUpgradeCounts(),
  windows: [],
  nextZIndex: 100,
  systemStage: 'host_os',
  bootTarget: 'host_os',
  isLegacyOSUnlocked: false,
  prologue: initialPrologueState,
  notifications: [],

  scanSector: () => {
    const roll = rollLoot()
    const { inventory, files } = get()
    const isNew =
      roll.item !== null && !inventory.some((file) => file.name === roll.item?.name)
    set((state) => {
      const lifetime = withLifetimeGain(
        state.files,
        state.recoveredSector,
        state.lifetimeFragments,
        roll.fragments,
      )
      return {
        dataFragments: state.dataFragments + roll.fragments,
        inventory: isNew && roll.item ? [...state.inventory, roll.item] : state.inventory,
        ...lifetime,
      }
    })
    return {
      fragments: roll.fragments,
      item: roll.item,
      isNew,
      unlockedFiles: newlyUnlockedFiles(files, get().files),
    }
  },

  unlockFilesForSector: (sector) => {
    if (!Number.isInteger(sector) || sector < 1) return
    set((state) => ({
      files: markFilesUnlockedForSector(state.files, sector),
    }))
  },

  openFile: (fileId) => {
    const file = get().files.find((entry) => entry.id === fileId)
    if (!file || !file.isUnlocked) return
    set({ activeFileId: fileId })
    const viewer = viewerAppForFile(file)
    if (viewer) get().openWindow(viewer)
  },

  openFileLocation: (fileId) => {
    const file = get().files.find((entry) => entry.id === fileId)
    if (!file || !file.isUnlocked) return
    set({
      activeFileId: fileId,
      explorerRevealRequest: { path: file.path, fileId: file.id },
    })
    get().openWindow('system-explorer')
  },

  downloadRecoveryTool: () => {
    if (get().hasRecoveryTool) return
    set({ hasRecoveryTool: true })
    get().pushNotification({
      title: strings.notifications.toolInstalledTitle,
      body: strings.notifications.toolInstalledBody,
      kind: 'system',
    })
  },

  tick: (deltaSeconds) => {
    const { fragmentsPerSecond } = get()
    if (fragmentsPerSecond <= 0 || deltaSeconds <= 0) return
    set((state) => {
      const gained = state.fragmentsPerSecond * deltaSeconds * state.timeScale
      const lifetime = withLifetimeGain(
        state.files,
        state.recoveredSector,
        state.lifetimeFragments,
        gained,
      )
      return {
        dataFragments: state.dataFragments + gained,
        ...lifetime,
      }
    })
  },

  purchaseUpgrade: (id) => {
    const { dataFragments, upgrades } = get()
    const owned = upgrades[id] ?? 0
    const cost = getUpgradeCost(id, owned)
    if (dataFragments < cost) return

    const nextOwned = { ...upgrades, [id]: owned + 1 }
    set({
      dataFragments: dataFragments - cost,
      upgrades: nextOwned,
      fragmentsPerSecond: computeFragmentsPerSecond(nextOwned),
    })
  },

  openWindow: (type) => {
    const { windows, nextZIndex } = get()
    const existing = windows.find((window) => window.type === type && window.isOpen)

    if (existing) {
      set({
        windows: windows.map((window) =>
          window.id === existing.id
            ? { ...window, isMinimized: false, zIndex: nextZIndex }
            : window,
        ),
        nextZIndex: nextZIndex + 1,
      })
      return
    }

    const windowState: WindowState = {
      id: type,
      title: APP_TITLES[type],
      type,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex,
    }

    set({
      windows: [...windows, windowState],
      nextZIndex: nextZIndex + 1,
    })
  },

  setWindowTitle: (type, title) => {
    const { windows } = get()
    const target = windows.find((window) => window.type === type && window.isOpen)
    if (!target || target.title === title) return
    set({
      windows: windows.map((window) =>
        window.id === target.id ? { ...window, title } : window,
      ),
    })
  },

  closeWindow: (id) => {
    set((state) => ({
      windows: state.windows.filter((window) => window.id !== id),
    }))
  },

  minimizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((window) =>
        window.id === id ? { ...window, isMinimized: true } : window,
      ),
    }))
  },

  toggleMaximize: (id) => {
    const { windows, nextZIndex } = get()
    set({
      windows: windows.map((window) =>
        window.id === id
          ? {
              ...window,
              isMaximized: !window.isMaximized,
              isMinimized: false,
              zIndex: nextZIndex,
            }
          : window,
      ),
      nextZIndex: nextZIndex + 1,
    })
  },

  focusWindow: (id) => {
    const { windows, nextZIndex } = get()
    const target = windows.find((window) => window.id === id)
    if (!target) return

    const activeId = selectActiveWindowId(windows)
    if (activeId === id && !target.isMinimized) return

    set({
      windows: windows.map((window) =>
        window.id === id ? { ...window, zIndex: nextZIndex, isMinimized: false } : window,
      ),
      nextZIndex: nextZIndex + 1,
    })
  },

  toggleFromTaskbar: (id) => {
    const { windows, nextZIndex } = get()
    const target = windows.find((window) => window.id === id)
    if (!target) return

    if (target.isMinimized) {
      set({
        windows: windows.map((window) =>
          window.id === id
            ? { ...window, isMinimized: false, zIndex: nextZIndex }
            : window,
        ),
        nextZIndex: nextZIndex + 1,
      })
      return
    }

    const activeId = selectActiveWindowId(windows)
    if (activeId === id) {
      set({
        windows: windows.map((window) =>
          window.id === id ? { ...window, isMinimized: true } : window,
        ),
      })
      return
    }

    set({
      windows: windows.map((window) =>
        window.id === id ? { ...window, zIndex: nextZIndex } : window,
      ),
      nextZIndex: nextZIndex + 1,
    })
  },

  showDesktop: () => {
    set((state) => ({
      windows: state.windows.map((window) => ({ ...window, isMinimized: true })),
    }))
  },

  markTargetArticleRead: () => {
    const { prologue } = get()
    if (prologue.hasReadTargetArticle) return

    set({
      prologue: patchPrologue(prologue, { hasReadTargetArticle: true }),
    })
    if (narrativeClockComplete(get().prologue)) {
      stopMomClockInterval()
    }
    maybeScheduleHddMessages(get, set)
  },

  revealNextLiveMessage: () => {
    set((state) => {
      if (state.prologue.liveMessagesRevealed >= LIVE_MESSAGE_COUNT) return state
      return {
        prologue: patchPrologue(state.prologue, {
          liveMessagesRevealed: state.prologue.liveMessagesRevealed + 1,
          liveMessageTimes: [
            ...state.prologue.liveMessageTimes,
            nextChatTime(lastKenjiStamp(state.prologue)),
          ],
          chatRecency: bumpChatRecency(state.prologue, 'kenji'),
        }),
      }
    })
  },

  revealNextMomNudge: () => {
    set((state) => {
      if (state.prologue.momNudgeRevealed >= MOM_NUDGE_COUNT) return state
      const stamp = nextChatTime(lastMomStamp(state.prologue))
      return {
        prologue: patchPrologue(state.prologue, {
          momNudgeRevealed: state.prologue.momNudgeRevealed + 1,
          momNudgeTimes: [...state.prologue.momNudgeTimes, stamp],
          momNudgeTime: state.prologue.momNudgeTime ?? stamp,
          chatRecency: bumpChatRecency(state.prologue, 'mom'),
        }),
      }
    })
  },

  clearChatNotification: () => {
    set((state) => ({
      prologue: patchPrologue(state.prologue, { chatNotificationPending: false }),
    }))
  },

  clearMomChatNotification: () => {
    set((state) => ({
      prologue: patchPrologue(state.prologue, { momChatNotificationPending: false }),
    }))
  },

  startMomNudgeClock: () => {
    const { prologue, systemStage } = get()
    if (systemStage !== 'host_os') return
    if (narrativeClockComplete(prologue)) return
    if (momClockTimer !== null) return

    momClockLastTick = performance.now()
    momClockTimer = window.setInterval(() => {
      const now = performance.now()
      const delta = now - momClockLastTick
      momClockLastTick = now
      const state = get()
      if (narrativeClockComplete(state.prologue)) {
        stopMomClockInterval()
        return
      }
      momClockElapsedMs += delta * state.narrativeTimeScale
      set({ narrativeElapsedMs: momClockElapsedMs })
      applyNarrativeThresholds(get, set)
    }, 100)
  },

  pauseMomNudgeClock: () => {
    if (momClockTimer === null) return
    const now = performance.now()
    const delta = now - momClockLastTick
    momClockLastTick = now
    const state = get()
    if (!narrativeClockComplete(state.prologue)) {
      momClockElapsedMs += delta * state.narrativeTimeScale
      set({ narrativeElapsedMs: momClockElapsedMs })
      applyNarrativeThresholds(get, set)
    }
    stopMomClockInterval()
  },

  deliverMomNudge: () => {
    const { prologue } = get()
    if (prologue.hasReadTargetArticle || prologue.momNudgeReceived) return
    const stamp = nextChatTime(lastMomStamp(prologue))
    set({
      prologue: patchPrologue(prologue, {
        momNudgeReceived: true,
        momNudgeRevealed: Math.max(1, prologue.momNudgeRevealed),
        momChatNotificationPending: true,
        momNudgeTime: stamp,
        momNudgeTimes: prologue.momNudgeTimes.length > 0 ? prologue.momNudgeTimes : [stamp],
        chatRecency: bumpChatRecency(prologue, 'mom'),
      }),
      pendingChatFocus: 'mom',
    })
    get().pushNotification({
      title: strings.notifications.momTitle,
      body: strings.chat.momNudge[0].text,
      kind: 'chat',
      conversationId: 'mom',
    })
    if (narrativeClockComplete(get().prologue)) {
      stopMomClockInterval()
    }
  },

  watchAuction: () => {
    const { prologue } = get()
    if (prologue.auctionCountdownStartedAt !== null || prologue.auctionLot404Sold) return

    set({
      prologue: patchPrologue(prologue, { auctionCountdownStartedAt: Date.now() }),
    })
    if (narrativeClockComplete(get().prologue)) {
      stopMomClockInterval()
    }

    scheduleAuctionSold(AUCTION_COUNTDOWN_MS)
  },

  deliverKenjiAuctionNudge: () => {
    const { prologue } = get()
    if (prologue.kenjiAuctionNudgeSent) return
    if (prologue.auctionCountdownStartedAt !== null || prologue.auctionLot404Sold) return
    const stamp = nextChatTime(lastKenjiStamp(prologue))
    set({
      prologue: patchPrologue(prologue, {
        kenjiAuctionNudgeSent: true,
        kenjiAuctionNudgeTime: stamp,
        chatNotificationPending: true,
        chatRecency: bumpChatRecency(prologue, 'kenji'),
      }),
      pendingChatFocus: 'kenji',
    })
    get().pushNotification({
      title: strings.notifications.kenjiTitle,
      body: strings.chat.auctionNudge,
      kind: 'chat',
      conversationId: 'kenji',
    })
    if (narrativeClockComplete(get().prologue)) {
      stopMomClockInterval()
    }
  },

  consumePendingChatFocus: () => {
    set({ pendingChatFocus: null })
  },

  focusChat: (id) => {
    set({ pendingChatFocus: id })
    get().openWindow('friend-chat')
  },

  requestNewsArticle: (articleId) => {
    set({ newsArticleRequest: articleId })
  },

  clearNewsArticleRequest: () => {
    set({ newsArticleRequest: null })
  },

  clearExplorerRevealRequest: () => {
    set({ explorerRevealRequest: null })
  },

  requestAuctionLot: (id) => {
    set({ auctionLotRequest: id })
  },

  clearAuctionLotRequest: () => {
    set({ auctionLotRequest: null })
  },

  requestWahooTab: (tab) => {
    set({ wahooTabRequest: tab })
  },

  clearWahooTabRequest: () => {
    set({ wahooTabRequest: null })
  },

  installArcadeGame: (id) => {
    set((state) => {
      if (state.installedArcadeGames.includes(id)) return state
      return { installedArcadeGames: [...state.installedArcadeGames, id] }
    })
  },

  startPartitionDownload: () => {
    const { prologue } = get()
    if (prologue.isPartitionDownloaded) return
    if (prologue.imageDownloadProgress > 0 && prologue.imageDownloadProgress < 100) return
    if (downloadTimer !== null) return

    set({
      prologue: patchPrologue(prologue, { imageDownloadProgress: 1 }),
    })
    beginPartitionDownload(1)
  },

  setImageDownloadProgress: (progress) => {
    set((state) => ({
      prologue: patchPrologue(state.prologue, {
        imageDownloadProgress: Math.max(0, Math.min(100, progress)),
      }),
    }))
  },

  pushNotification: ({ title, body, kind, conversationId }) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const notification: OsNotification = { id, title, body, kind, conversationId }
    const { systemStage, bootTarget, windows } = get()
    set((state) => ({ notifications: [...state.notifications, notification] }))
    const timer = window.setTimeout(() => {
      get().dismissNotification(id)
    }, NOTIFICATION_TTL_MS)
    notificationTimers.set(id, timer)
    const os = selectCurrentOs(systemStage, bootTarget)
    if (kind === 'chat' && isFriendChatFocused(windows)) {
      // In-chat pops play from ModernChat as each line lands.
      return
    }
    playNotificationSound(os)
  },

  dismissNotification: (id) => {
    const timer = notificationTimers.get(id)
    if (timer !== undefined) {
      window.clearTimeout(timer)
      notificationTimers.delete(id)
    }
    set((state) => ({
      notifications: state.notifications.filter((item) => item.id !== id),
    }))
  },

  holdNotification: (id) => {
    const timer = notificationTimers.get(id)
    if (timer === undefined) return
    window.clearTimeout(timer)
    notificationTimers.delete(id)
  },

  releaseNotification: (id) => {
    if (!get().notifications.some((item) => item.id === id)) return
    const existing = notificationTimers.get(id)
    if (existing !== undefined) window.clearTimeout(existing)
    const timer = window.setTimeout(() => {
      get().dismissNotification(id)
    }, NOTIFICATION_TTL_MS)
    notificationTimers.set(id, timer)
  },

  startRebootSequence: () => {
    set({
      windows: [],
      systemStage: 'shutting_down',
      notifications: [],
    })
  },

  setSystemStage: (stage) => {
    set({ systemStage: stage })
  },

  restartSystem: () => {
    get().startRebootSequence()
  },

  bootFrom: (target) => {
    set({
      bootTarget: target,
      systemStage: 'booting',
      windows: [],
      notifications: [],
    })
  },

  finishBoot: () => {
    const { bootTarget, isLegacyOSUnlocked } = get()
    const nextStage: SystemStage =
      bootTarget === 'target_os' && !isLegacyOSUnlocked
        ? 'legacy_login'
        : bootTarget === 'host_os'
          ? 'host_login'
          : bootTarget
    set({
      systemStage: nextStage,
      windows: [],
    })
  },

  unlockLegacyOS: () => {
    set({
      isLegacyOSUnlocked: true,
      systemStage: 'target_os',
    })
  },

  signInHostOS: () => {
    set({ systemStage: 'host_os' })
  },

  devSwitchOs: (target) => {
    // Dev shortcut: jump straight to the other environment without the
    // shutdown / BIOS / boot sequence. Windows are kept; they are filtered
    // per OS so the ones from the other environment simply reappear later.
    set({
      systemStage: target,
      bootTarget: target,
      notifications: [],
      ...(target === 'target_os' ? { isLegacyOSUnlocked: true } : {}),
    })
  },

  devAddFragments: (amount) => {
    if (!Number.isFinite(amount) || amount === 0) return
    set((state) => {
      const dataFragments = Math.max(0, state.dataFragments + amount)
      if (amount <= 0) return { dataFragments }
      return {
        dataFragments,
        ...withLifetimeGain(state.files, state.recoveredSector, state.lifetimeFragments, amount),
      }
    })
  },

  devSetFragments: (amount) => {
    if (!Number.isFinite(amount)) return
    const next = Math.max(0, amount)
    set((state) => {
      const gained = Math.max(0, next - state.lifetimeFragments)
      return {
        dataFragments: next,
        ...withLifetimeGain(state.files, state.recoveredSector, state.lifetimeFragments, gained),
      }
    })
  },

  devSetRecoveryTool: (installed) => {
    set({ hasRecoveryTool: installed })
  },

  devPatchPrologue: (patch) => {
    set((state) => ({ prologue: patchPrologue(state.prologue, patch) }))
    if ('hasReadTargetArticle' in patch || 'momNudgeReceived' in patch) {
      momClockElapsedMs = 0
      set((state) => ({
        narrativeElapsedMs: 0,
        prologue: patchPrologue(state.prologue, { isColdCasePublished: false }),
      }))
    }
    const { prologue, systemStage } = get()
    if (narrativeClockComplete(prologue)) {
      stopMomClockInterval()
      return
    }
    if (systemStage === 'host_os') get().startMomNudgeClock()
  },

  devCompletePrologue: () => {
    clearHddTimer()
    clearAuctionTimers()
    clearDownloadTimer()
    stopMomClockInterval()
    set((state) => {
      const earlierLast = strings.chat.earlier[strings.chat.earlier.length - 1]?.time
      const kenjiAuctionNudgeTime =
        state.prologue.kenjiAuctionNudgeTime ?? nextChatTime(earlierLast)
      const kenjiAuctionWonTime =
        state.prologue.kenjiAuctionWonTime ?? nextChatTime(kenjiAuctionNudgeTime)
      const liveMessageTimes =
        state.prologue.liveMessageTimes.length >= LIVE_MESSAGE_COUNT
          ? state.prologue.liveMessageTimes
          : sequentialChatTimes(LIVE_MESSAGE_COUNT, kenjiAuctionWonTime)
      const liveLast = liveMessageTimes[liveMessageTimes.length - 1] ?? kenjiAuctionWonTime
      return {
        prologue: patchPrologue(state.prologue, {
          hasReadTargetArticle: true,
          isColdCasePublished: true,
          friendMessageReceived: true,
          chatNotificationPending: false,
          liveMessagesRevealed: LIVE_MESSAGE_COUNT,
          imageDownloadProgress: 100,
          isPartitionDownloaded: true,
          rebootPromptActive: true,
          auctionCountdownStartedAt: state.prologue.auctionCountdownStartedAt ?? Date.now(),
          auctionLot404Sold: true,
          kenjiAuctionNudgeSent: true,
          kenjiAuctionWonSent: true,
          kenjiAuctionNudgeTime,
          kenjiAuctionWonTime,
          liveMessageTimes,
          partitionMountedTime: state.prologue.partitionMountedTime ?? nextChatTime(liveLast),
          chatRecency: bumpChatRecency(state.prologue, 'kenji'),
        }),
      }
    })
  },

  devGrantUpgrade: (id, count) => {
    const { upgrades } = get()
    const nextOwned = { ...upgrades, [id]: Math.max(0, (upgrades[id] ?? 0) + count) }
    set({ upgrades: nextOwned, fragmentsPerSecond: computeFragmentsPerSecond(nextOwned) })
  },

  devResetUpgrades: () => {
    const nextOwned = initialUpgradeCounts()
    set({ upgrades: nextOwned, fragmentsPerSecond: computeFragmentsPerSecond(nextOwned) })
  },

  devSetInventory: (names) => {
    const { inventory } = get()
    const existing = new Map(inventory.map((file) => [file.name, file]))
    const next: RecoveredFile[] = []
    const seen = new Set<string>()
    for (const name of names) {
      if (seen.has(name)) continue
      seen.add(name)
      const kept = existing.get(name)
      if (kept) {
        next.push(kept)
        continue
      }
      const created = instantiateLootByName(name)
      if (created) next.push(created)
    }
    set({ inventory: next })
  },

  devSetTimeScale: (scale) => {
    if (!Number.isFinite(scale) || scale <= 0) return
    set({ timeScale: scale })
  },

  devSetNarrativeTimeScale: (scale) => {
    if (!Number.isFinite(scale) || scale <= 0) return
    set({ narrativeTimeScale: scale })
  },

  devCloseOtherWindows: () => {
    set((state) => ({
      windows: state.windows.filter((window) => DEV_APP_TYPES.includes(window.type)),
    }))
  },

  devResetGame: () => {
    clearHddTimer()
    clearAuctionTimers()
    clearDownloadTimer()
    stopMomClockInterval()
    momClockElapsedMs = 0
    resetGameClock()
    clearNotificationTimers()
    set({
      dataFragments: 0,
      fragmentsPerSecond: 0,
      inventory: [],
      files: createInitialFiles(),
      lifetimeFragments: 0,
      recoveredSector: 0,
      activeFileId: null,
      hasRecoveryTool: false,
      timeScale: 1,
      narrativeTimeScale: 1,
      narrativeElapsedMs: 0,
      pendingChatFocus: null,
      newsArticleRequest: null,
      explorerRevealRequest: null,
      auctionLotRequest: null,
      wahooTabRequest: null,
      installedArcadeGames: [],
      upgrades: initialUpgradeCounts(),
      windows: [],
      nextZIndex: 100,
      systemStage: 'host_os',
      bootTarget: 'host_os',
      isLegacyOSUnlocked: false,
      prologue: initialPrologueState,
      notifications: [],
    })
    get().startMomNudgeClock()
    flushDevSession()
  },
}))

function captureDevSession() {
  const state = useGameStore.getState()
  const sessionState: DevSessionState = {
    dataFragments: state.dataFragments,
    fragmentsPerSecond: state.fragmentsPerSecond,
    inventory: state.inventory,
    fileUnlocks: state.files.map((file) => ({ id: file.id, isUnlocked: file.isUnlocked })),
    lifetimeFragments: state.lifetimeFragments,
    recoveredSector: state.recoveredSector,
    activeFileId: state.activeFileId,
    hasRecoveryTool: state.hasRecoveryTool,
    timeScale: state.timeScale,
    narrativeTimeScale: state.narrativeTimeScale,
    narrativeElapsedMs: state.narrativeElapsedMs,
    pendingChatFocus: state.pendingChatFocus,
    newsArticleRequest: state.newsArticleRequest,
    explorerRevealRequest: state.explorerRevealRequest,
    auctionLotRequest: state.auctionLotRequest,
    wahooTabRequest: state.wahooTabRequest,
    installedArcadeGames: state.installedArcadeGames,
    upgrades: state.upgrades,
    windows: state.windows,
    nextZIndex: state.nextZIndex,
    systemStage: state.systemStage,
    bootTarget: state.bootTarget,
    isLegacyOSUnlocked: state.isLegacyOSUnlocked,
    prologue: state.prologue,
    notifications: state.notifications,
  }
  return {
    version: 1 as const,
    momClockElapsedMs,
    clockOrigin: getGameClockOrigin(),
    state: sessionState,
  }
}

function applySavedFiles(unlocks: DevSessionState['fileUnlocks']) {
  const unlocked = new Set(unlocks.filter((file) => file.isUnlocked).map((file) => file.id))
  return createInitialFiles().map((file) =>
    unlocked.has(file.id) ? { ...file, isUnlocked: true } : file,
  )
}

const DEV_SAVE_DELAY_MS = 400
let devSaveTimer: number | null = null
let devSessionDiscarded = false

/** Drop the dev-tab save so the next load starts a new game. */
export function discardDevSession() {
  devSessionDiscarded = true
  if (devSaveTimer !== null) {
    window.clearTimeout(devSaveTimer)
    devSaveTimer = null
  }
  try {
    sessionStorage.removeItem(DEV_SESSION_KEY)
  } catch {
    // sessionStorage can throw when it is disabled.
  }
}

function flushDevSession() {
  if (!import.meta.env.DEV || devSessionDiscarded) return
  if (devSaveTimer !== null) {
    window.clearTimeout(devSaveTimer)
    devSaveTimer = null
  }
  try {
    sessionStorage.setItem(DEV_SESSION_KEY, serializeDevSession(captureDevSession()))
  } catch {
    // sessionStorage can throw when it is disabled or full.
  }
}

function scheduleDevSessionSave() {
  if (!import.meta.env.DEV || devSaveTimer !== null) return
  devSaveTimer = window.setTimeout(() => {
    devSaveTimer = null
    flushDevSession()
  }, DEV_SAVE_DELAY_MS)
}

function resumeInFlightWork() {
  const { prologue, notifications } = useGameStore.getState()

  if (prologue.auctionCountdownStartedAt !== null && !prologue.auctionLot404Sold) {
    const elapsed = Date.now() - prologue.auctionCountdownStartedAt
    const soldIn = AUCTION_COUNTDOWN_MS - elapsed
    if (soldIn > 0) {
      scheduleAuctionSold(soldIn)
    } else {
      const sold = patchPrologue(prologue, { auctionLot404Sold: true })
      useGameStore.setState({ prologue: sold })
      const wonIn = Math.max(0, KENJI_WON_DELAY_MS - (elapsed - AUCTION_COUNTDOWN_MS))
      scheduleKenjiWon(wonIn)
    }
  } else if (prologue.auctionLot404Sold && !prologue.kenjiAuctionWonSent) {
    scheduleKenjiWon(KENJI_WON_DELAY_MS)
  }

  if (
    prologue.hasReadTargetArticle &&
    prologue.kenjiAuctionWonSent &&
    !prologue.friendMessageReceived
  ) {
    maybeScheduleHddMessages(useGameStore.getState, (partial) => {
      useGameStore.setState(partial)
    })
  }

  if (
    !prologue.isPartitionDownloaded &&
    prologue.imageDownloadProgress > 0 &&
    prologue.imageDownloadProgress < 100
  ) {
    beginPartitionDownload(prologue.imageDownloadProgress)
  }

  for (const note of notifications) {
    if (notificationTimers.has(note.id)) continue
    const timer = window.setTimeout(() => {
      useGameStore.getState().dismissNotification(note.id)
    }, NOTIFICATION_TTL_MS)
    notificationTimers.set(note.id, timer)
  }
}

function restoreDevSession() {
  let raw: string | null = null
  try {
    raw = sessionStorage.getItem(DEV_SESSION_KEY)
  } catch {
    return
  }
  if (!raw) return
  const snapshot = parseDevSession(raw)
  if (!snapshot) return
  momClockElapsedMs = snapshot.momClockElapsedMs
  if (snapshot.clockOrigin > 0) restoreGameClock(snapshot.clockOrigin)
  const { fileUnlocks, ...rest } = snapshot.state
  useGameStore.setState({
    ...rest,
    files: applySavedFiles(fileUnlocks),
    narrativeElapsedMs: Math.max(rest.narrativeElapsedMs, snapshot.momClockElapsedMs),
  })
}

if (import.meta.env.DEV) {
  restoreDevSession()

  let lastStage = useGameStore.getState().systemStage
  let lastPrologue = useGameStore.getState().prologue
  useGameStore.subscribe((state) => {
    if (state.systemStage !== lastStage || state.prologue !== lastPrologue) {
      lastStage = state.systemStage
      lastPrologue = state.prologue
      flushDevSession()
      return
    }
    scheduleDevSessionSave()
  })

  resumeInFlightWork()
  flushDevSession()

  window.addEventListener('pagehide', flushDevSession)

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      useGameStore.getState().pauseMomNudgeClock()
      flushDevSession()
      window.removeEventListener('pagehide', flushDevSession)
      stopMomClockInterval()
      clearHddTimer()
      clearAuctionTimers()
      clearDownloadTimer()
      clearNotificationTimers()
    })
  }
}
