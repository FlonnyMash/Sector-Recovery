import { create } from 'zustand'
import { computeFragmentsPerSecond, getUpgradeCost, initialUpgradeCounts } from '../game/upgrades'
import type { UpgradeId } from '../game/upgrades'
import type { AppType, WindowState } from '../types/game'

const APP_TITLES: Record<AppType, string> = {
  'recovery-terminal': 'Recovery Terminal',
  'operator-notes': 'Operator Notes',
}

export function selectActiveWindowId(windows: WindowState[]): string | null {
  const visible = windows.filter((window) => window.isOpen && !window.isMinimized)
  if (visible.length === 0) return null
  return visible.reduce((best, window) => (window.zIndex > best.zIndex ? window : best)).id
}

interface GameState {
  dataFragments: number
  fragmentsPerSecond: number
  upgrades: Record<UpgradeId, number>
  windows: WindowState[]
  nextZIndex: number
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
}

export const useGameStore = create<GameState>((set, get) => ({
  dataFragments: 0,
  fragmentsPerSecond: 0,
  upgrades: initialUpgradeCounts(),
  windows: [],
  nextZIndex: 100,

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
}))
