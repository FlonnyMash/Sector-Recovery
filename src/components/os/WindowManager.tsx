import type { RefObject } from 'react'
import { APPS } from '../../game/apps'
import { selectActiveWindowId, useGameStore } from '../../store/useGameStore'
import { OSWindow } from './OSWindow'

interface WindowManagerProps {
  desktopRef: RefObject<HTMLDivElement | null>
}

export function WindowManager({ desktopRef }: WindowManagerProps) {
  const windows = useGameStore((state) => state.windows)
  const activeId = selectActiveWindowId(windows)

  return (
    <>
      {windows.map((windowState, index) => {
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
