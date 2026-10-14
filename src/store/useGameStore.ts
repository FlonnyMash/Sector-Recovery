import { create } from 'zustand'
import { strings } from '../i18n'
import { computeFragmentsPerSecond, getUpgradeCost, initialUpgradeCounts } from '../game/upgrades'
import type { UpgradeId } from '../game/upgrades'
import {
  APP_OS,
  LIVE_MESSAGE_COUNT,
  initialPrologueState,
  type AppType,
  type NotificationKind,
  type OsEnvironment,
  type OsNotification,
  type PrologueState,
  type SystemStage,
  type WindowState,
} from '../types/game'
import { playNotificationSound } from '../utils/sounds'

const APP_TITLES: Record<AppType, string> = {
  'recovery-terminal': strings.apps.recoveryTerminal,
  'operator-notes': strings.apps.operatorNotes,
  'news-browser': strings.apps.newsBrowser,
  'friend-chat': strings.apps.friendChat,
  arcade: strings.apps.arcade,
}

const ARTICLE_DELAY_MS = 2500
const DOWNLOAD_DURATION_MS = 3000
const NOTIFICATION_TTL_MS = 5000

let articleTimer: number | null = null
let downloadTimer: number | null = null
const notificationTimers = new Map<string, number>()

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
  upgrades: Record<UpgradeId, number>
  windows: WindowState[]
  nextZIndex: number
  systemStage: SystemStage
  bootTarget: OsEnvironment
  prologue: PrologueState
  notifications: OsNotification[]
  extractSector: () => void
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
}

function patchPrologue(prologue: PrologueState, patch: Partial<PrologueState>): PrologueState {
  return { ...prologue, ...patch }
}

export const useGameStore = create<GameState>((set, get) => ({
  dataFragments: 0,
  fragmentsPerSecond: 0,
  upgrades: initialUpgradeCounts(),
  windows: [],
  nextZIndex: 100,
  systemStage: 'host_os',
  bootTarget: 'host_os',
  prologue: initialPrologueState,
  notifications: [],

  extractSector: () => {
    set((state) => ({ dataFragments: state.dataFragments + 1 }))
  },

  tick: (deltaSeconds) => {
    const { fragmentsPerSecond } = get()
    if (fragmentsPerSecond <= 0 || deltaSeconds <= 0) return
    set((state) => ({
      dataFragments: state.dataFragments + state.fragmentsPerSecond * deltaSeconds,
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
    const clearChat = type === 'friend-chat'

    if (existing) {
      set((state) => ({
        windows: windows.map((window) =>
          window.id === existing.id
            ? { ...window, isMinimized: false, zIndex: nextZIndex }
            : window,
        ),
        nextZIndex: nextZIndex + 1,
        prologue: clearChat
          ? patchPrologue(state.prologue, { chatNotificationPending: false })
          : state.prologue,
      }))
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

    set((state) => ({
      windows: [...windows, windowState],
      nextZIndex: nextZIndex + 1,
      prologue: clearChat
        ? patchPrologue(state.prologue, { chatNotificationPending: false })
        : state.prologue,
    }))
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
    if (activeId === id && !target.isMinimized) {
      if (target.type === 'friend-chat' && get().prologue.chatNotificationPending) {
        set((state) => ({
          prologue: patchPrologue(state.prologue, { chatNotificationPending: false }),
        }))
      }
      return
    }

    set((state) => ({
      windows: windows.map((window) =>
        window.id === id ? { ...window, zIndex: nextZIndex, isMinimized: false } : window,
      ),
      nextZIndex: nextZIndex + 1,
      prologue:
        target.type === 'friend-chat'
          ? patchPrologue(state.prologue, { chatNotificationPending: false })
          : state.prologue,
    }))
  },

  toggleFromTaskbar: (id) => {
    const { windows, nextZIndex } = get()
    const target = windows.find((window) => window.id === id)
    if (!target) return

    if (target.isMinimized) {
      set((state) => ({
        windows: windows.map((window) =>
          window.id === id
            ? { ...window, isMinimized: false, zIndex: nextZIndex }
            : window,
        ),
        nextZIndex: nextZIndex + 1,
        prologue:
          target.type === 'friend-chat'
            ? patchPrologue(state.prologue, { chatNotificationPending: false })
            : state.prologue,
      }))
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

    set((state) => ({
      windows: windows.map((window) =>
        window.id === id ? { ...window, zIndex: nextZIndex } : window,
      ),
      nextZIndex: nextZIndex + 1,
      prologue:
        target.type === 'friend-chat'
          ? patchPrologue(state.prologue, { chatNotificationPending: false })
          : state.prologue,
    }))
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

    if (articleTimer !== null) return
    articleTimer = window.setTimeout(() => {
      articleTimer = null
      const current = get().prologue
      if (current.friendMessageReceived) return
      set({
        prologue: patchPrologue(current, {
          friendMessageReceived: true,
          chatNotificationPending: true,
        }),
      })
      get().pushNotification({
        title: strings.notifications.kenjiTitle,
        body: strings.notifications.kenjiBody,
        kind: 'chat',
      })
    }, ARTICLE_DELAY_MS)
  },

  revealNextLiveMessage: () => {
    set((state) => {
      if (state.prologue.liveMessagesRevealed >= LIVE_MESSAGE_COUNT) return state
      return {
        prologue: patchPrologue(state.prologue, {
          liveMessagesRevealed: state.prologue.liveMessagesRevealed + 1,
        }),
      }
    })
  },

  clearChatNotification: () => {
    set((state) => ({
      prologue: patchPrologue(state.prologue, { chatNotificationPending: false }),
    }))
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
    const { bootTarget } = get()
    set({
      systemStage: bootTarget,
      windows: [],
    })
  },
}))
