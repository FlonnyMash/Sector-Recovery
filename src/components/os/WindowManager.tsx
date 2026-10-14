import { useMemo, type RefObject } from 'react'
import { APPS } from '../../game/apps'
import { selectActiveWindowId, selectWindowsForOs, useGameStore } from '../../store/useGameStore'
import type { OsEnvironment } from '../../types/game'
import { OSWindow } from './OSWindow'

interface WindowManagerProps {
  desktopRef: RefObject<HTMLDivElement | null>
  os: OsEnvironment
}

export function WindowManager({ desktopRef, os }: WindowManagerProps) {
  const windows = useGameStore((state) => state.windows)
  const osWindows = useMemo(() => selectWindowsForOs(windows, os), [windows, os])
  const activeId = selectActiveWindowId(osWindows)

  return (
    <>
      {osWindows.map((windowState, index) => {
        const app = APPS[windowState.type]
        const AppComponent = app.component
        return (
          <OSWindow
            key={windowState.id}
            windowState={windowState}
            isActive={windowState.id === activeId}
            cascadeIndex={index}
            desktopRef={desktopRef}
          >
            <AppComponent />
          </OSWindow>
        )
      })}
    </>
  )
}
