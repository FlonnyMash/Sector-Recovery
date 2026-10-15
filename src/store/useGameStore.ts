import { create } from 'zustand'
import { strings } from '../i18n'
import { instantiateLootByName, rollLoot, type ScanResult } from '../game/loot'
import { computeFragmentsPerSecond, getUpgradeCost, initialUpgradeCounts } from '../game/upgrades'
import type { UpgradeId } from '../game/upgrades'
import {
  APP_OS,
  AUCTION_COUNTDOWN_MS,
  COLD_CASE_PUBLISH_MS,
  HDD_MESSAGE_DELAY_MS,
  KENJI_AUCTION_NUDGE_MS,
  KENJI_WON_DELAY_MS,
  LIVE_MESSAGE_COUNT,
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
  type WindowState,
} from '../types/game'
import { formatChatClock } from '../utils/format'
import { resetGameClock } from '../utils/gameClock'
import { playNotificationSound } from '../utils/sounds'

export type { RecoveredFile }

const APP_TITLES: Record<AppType, string> = {
  'system-explorer': strings.apps.systemExplorer,
  'net-explorer': strings.apps.netExplorer,
  'sector-recover': strings.apps.sectorRecover,
  'operator-notes': strings.apps.operatorNotes,
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

function maybeScheduleHddMessages(
  get: () => GameState,
  set: (partial: { prologue: PrologueState; pendingChatFocus?: ChatConversationId | null }) => void,
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
    set({
      prologue: patchPrologue(current, {
        friendMessageReceived: true,
        chatNotificationPending: true,
      }),
      pendingChatFocus: 'kenji',
    })
    get().pushNotification({
      title: strings.notifications.kenjiTitle,
      body: strings.notifications.kenjiBody,
      kind: 'chat',
    })
  }, HDD_MESSAGE_DELAY_MS)
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
  hasRecoveryTool: boolean
  /** Dev-only multiplier applied to passive income. 1 = normal speed. */
  timeScale: number
  /** Dev-only multiplier applied to the host-OS story idle clock. 1 = real time. */
  narrativeTimeScale: number
  narrativeElapsedMs: number
  pendingChatFocus: ChatConversationId | null
  newsArticleRequest: string | null
  auctionLotRequest: AuctionLotId | null
  upgrades: Record<UpgradeId, number>
  windows: WindowState[]
  nextZIndex: number
  systemStage: SystemStage
  bootTarget: OsEnvironment
  isLegacyOSUnlocked: boolean
  prologue: PrologueState
  notifications: OsNotification[]
  scanSector: () => ScanResult
  downloadRecoveryTool: () => void
  tick: (deltaSeconds: number) => void
  purchaseUpgrade: (id: UpgradeId) => void
  openWindow: (type: AppType) => void
  closeWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  toggleMaximize: (id: string) => void
  focusWindow: (id: string) => void
  toggleFromTaskbar: (id: string) => void
  showDesktop: () => void
  markTargetArticleRead: () => void
  revealNextLiveMessage: () => void
  clearChatNotification: () => void
  clearMomChatNotification: () => void
  startMomNudgeClock: () => void
  pauseMomNudgeClock: () => void
  deliverMomNudge: () => void
  watchAuction: () => void
  deliverKenjiAuctionNudge: () => void
  consumePendingChatFocus: () => void
  requestNewsArticle: (articleId: string) => void
  clearNewsArticleRequest: () => void
  requestAuctionLot: (id: AuctionLotId) => void
  clearAuctionLotRequest: () => void
  startPartitionDownload: () => void
  setImageDownloadProgress: (progress: number) => void
  pushNotification: (input: { title: string; body: string; kind: NotificationKind }) => void
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
  hasRecoveryTool: false,
  timeScale: 1,
  narrativeTimeScale: 1,
  narrativeElapsedMs: 0,
  pendingChatFocus: null,
  newsArticleRequest: null,
  auctionLotRequest: null,
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
    const { inventory } = get()
    const isNew =
      roll.item !== null && !inventory.some((file) => file.name === roll.item?.name)
    set((state) => ({
      dataFragments: state.dataFragments + roll.fragments,
      inventory: isNew && roll.item ? [...state.inventory, roll.item] : state.inventory,
    }))
    return { fragments: roll.fragments, item: roll.item, isNew }
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
    set((state) => ({
      dataFragments:
        state.dataFragments + state.fragmentsPerSecond * deltaSeconds * state.timeScale,
    }))
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
          liveMessageTimes: [...state.prologue.liveMessageTimes, formatChatClock()],
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
    set({
      prologue: patchPrologue(prologue, {
        momNudgeReceived: true,
        momChatNotificationPending: true,
        momNudgeTime: formatChatClock(),
      }),
      pendingChatFocus: 'mom',
    })
    get().pushNotification({
      title: strings.notifications.momTitle,
      body: strings.notifications.momBody,
      kind: 'chat',
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

    if (auctionSoldTimer !== null) return
    auctionSoldTimer = window.setTimeout(() => {
      auctionSoldTimer = null
      const afterCountdown = get().prologue
      if (afterCountdown.auctionLot404Sold) return
      set({
        prologue: patchPrologue(afterCountdown, { auctionLot404Sold: true }),
      })

      if (kenjiWonTimer !== null) return
      kenjiWonTimer = window.setTimeout(() => {
        kenjiWonTimer = null
        const afterSold = get().prologue
        if (afterSold.kenjiAuctionWonSent) return
        set({
          prologue: patchPrologue(afterSold, {
            kenjiAuctionWonSent: true,
            kenjiAuctionWonTime: formatChatClock(),
            chatNotificationPending: true,
          }),
          pendingChatFocus: 'kenji',
        })
        get().pushNotification({
          title: strings.notifications.kenjiTitle,
          body: strings.notifications.kenjiBody,
          kind: 'chat',
        })
        maybeScheduleHddMessages(get, set)
      }, KENJI_WON_DELAY_MS)
    }, AUCTION_COUNTDOWN_MS)
  },

  deliverKenjiAuctionNudge: () => {
    const { prologue } = get()
    if (prologue.kenjiAuctionNudgeSent) return
    if (prologue.auctionCountdownStartedAt !== null || prologue.auctionLot404Sold) return
    set({
      prologue: patchPrologue(prologue, {
        kenjiAuctionNudgeSent: true,
        kenjiAuctionNudgeTime: formatChatClock(),
        chatNotificationPending: true,
      }),
      pendingChatFocus: 'kenji',
    })
    get().pushNotification({
      title: strings.notifications.kenjiTitle,
      body: strings.notifications.kenjiBody,
      kind: 'chat',
    })
    if (narrativeClockComplete(get().prologue)) {
      stopMomClockInterval()
    }
  },

  consumePendingChatFocus: () => {
    set({ pendingChatFocus: null })
  },

  requestNewsArticle: (articleId) => {
    set({ newsArticleRequest: articleId })
  },

  clearNewsArticleRequest: () => {
    set({ newsArticleRequest: null })
  },

  requestAuctionLot: (id) => {
    set({ auctionLotRequest: id })
  },

  clearAuctionLotRequest: () => {
    set({ auctionLotRequest: null })
  },

  startPartitionDownload: () => {
    const { prologue } = get()
    if (prologue.isPartitionDownloaded) return
    if (prologue.imageDownloadProgress > 0 && prologue.imageDownloadProgress < 100) return

    if (downloadTimer !== null) {
      window.clearInterval(downloadTimer)
      downloadTimer = null
    }

    const startedAt = performance.now()
    set({
      prologue: patchPrologue(prologue, { imageDownloadProgress: 1 }),
    })

    downloadTimer = window.setInterval(() => {
      const progress = Math.min(
        100,
        Math.round(((performance.now() - startedAt) / DOWNLOAD_DURATION_MS) * 100),
      )
      get().setImageDownloadProgress(progress)
      if (progress >= 100 && downloadTimer !== null) {
        window.clearInterval(downloadTimer)
        downloadTimer = null
        set((state) => ({
          prologue: patchPrologue(state.prologue, {
            imageDownloadProgress: 100,
            isPartitionDownloaded: true,
            partitionMountedTime: formatChatClock(),
            rebootPromptActive: true,
          }),
        }))
        get().pushNotification({
          title: strings.notifications.rebootTitle,
          body: strings.notifications.rebootBody,
          kind: 'system',
        })
      }
    }, 50)
  },

  setImageDownloadProgress: (progress) => {
    set((state) => ({
      prologue: patchPrologue(state.prologue, {
        imageDownloadProgress: Math.max(0, Math.min(100, progress)),
      }),
    }))
  },

  pushNotification: ({ title, body, kind }) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const notification: OsNotification = { id, title, body, kind }
    const { systemStage, bootTarget } = get()
    set((state) => ({ notifications: [...state.notifications, notification] }))
    const timer = window.setTimeout(() => {
      get().dismissNotification(id)
    }, NOTIFICATION_TTL_MS)
    notificationTimers.set(id, timer)
    playNotificationSound(selectCurrentOs(systemStage, bootTarget))
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
    set((state) => ({ dataFragments: Math.max(0, state.dataFragments + amount) }))
  },

  devSetFragments: (amount) => {
    if (!Number.isFinite(amount)) return
    set({ dataFragments: Math.max(0, amount) })
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
    if (downloadTimer !== null) {
      window.clearInterval(downloadTimer)
      downloadTimer = null
    }
    stopMomClockInterval()
    set((state) => ({
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
        kenjiAuctionNudgeTime: state.prologue.kenjiAuctionNudgeTime ?? formatChatClock(),
        kenjiAuctionWonTime: state.prologue.kenjiAuctionWonTime ?? formatChatClock(),
        liveMessageTimes:
          state.prologue.liveMessageTimes.length >= LIVE_MESSAGE_COUNT
            ? state.prologue.liveMessageTimes
            : Array.from({ length: LIVE_MESSAGE_COUNT }, () => formatChatClock()),
        partitionMountedTime: state.prologue.partitionMountedTime ?? formatChatClock(),
      }),
    }))
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
    if (downloadTimer !== null) {
      window.clearInterval(downloadTimer)
      downloadTimer = null
    }
    stopMomClockInterval()
    momClockElapsedMs = 0
    resetGameClock()
    for (const timer of notificationTimers.values()) window.clearTimeout(timer)
    notificationTimers.clear()
    set({
      dataFragments: 0,
      fragmentsPerSecond: 0,
      inventory: [],
      hasRecoveryTool: false,
      timeScale: 1,
      narrativeTimeScale: 1,
      narrativeElapsedMs: 0,
      pendingChatFocus: null,
      newsArticleRequest: null,
      auctionLotRequest: null,
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
  },
}))
