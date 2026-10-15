import { selectVisibleApps } from '../../game/apps'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'
import type { AppType, OsEnvironment } from '../../types/game'
import { cn } from '../../utils/cn'

interface StartMenuProps {
  os: OsEnvironment
  onOpenApp: (type: AppType) => void
  onRestart: () => void
}

export function StartMenu({ os, onOpenApp, onRestart }: StartMenuProps) {
  const startRebootSequence = useGameStore((state) => state.startRebootSequence)
  const ready = useGameStore((state) => state.prologue.isPartitionDownloaded)
  const hasRecoveryTool = useGameStore((state) => state.hasRecoveryTool)
  const apps = selectVisibleApps(os, hasRecoveryTool)
  const header = os === 'host_os' ? strings.os.hostPcName : strings.os.targetPcName
  const modern = os === 'host_os'

  const restart = () => {
    onRestart()
    startRebootSequence()
  }

  if (modern) {
    return (
      <div className="absolute bottom-20 left-1/2 z-[60] w-[320px] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/15 bg-[#1c1c22]/80 shadow-2xl backdrop-blur-xl">
        <div className="px-4 py-3 text-[13px] font-medium tracking-wide text-white/80">
          {header}
        </div>
        <div className="grid grid-cols-3 gap-2 px-3 pb-3">
          {apps.map((app) => (
            <button
              key={app.type}
              type="button"
              onClick={() => onOpenApp(app.type)}
              className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-center text-[11px] text-white/90 hover:bg-white/10"
            >
              {app.icon({ size: 32 })}
              <span className="w-full truncate">{app.title}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-white/10 bg-black/20 p-2">
          <button
            type="button"
            onClick={restart}
            className={cn(
              'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12px] text-white/90 hover:bg-white/10',
              ready && 'restart-ready bg-amber-400/15 font-semibold text-amber-100',
            )}
          >
            <span>{strings.os.restartSystem}</span>
            {ready ? (
              <span className="rounded-md bg-[#d97600] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase">
                {strings.os.updateBadge}
              </span>
            ) : null}
          </button>
          {ready ? (
            <div className="px-3 pb-1 text-[10px] text-amber-200/80">{strings.os.bootImageReady}</div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="absolute bottom-10 left-1 z-[60] w-[280px] overflow-hidden rounded-t-md border border-white/40 bg-[#dce9f5]/80 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
      <div className="bg-gradient-to-r from-[#1d4f86] to-[#3d8ad0] px-3 py-2 text-[13px] font-semibold text-white">
        {header}
      </div>
      <div className="p-1">
        {apps.map((app) => (
          <button
            key={app.type}
            type="button"
            onClick={() => onOpenApp(app.type)}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[12px] text-[#1a1a1a] hover:bg-[#3399ff] hover:text-white"
          >
            {app.icon({ size: 24 })}
            <span>{app.title}</span>
          </button>
        ))}
      </div>
      <div className="border-t border-[#9ab4c8] bg-[#c5d6e6]/90 p-1">
        <button
          type="button"
          onClick={restart}
          className={cn(
            'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-[12px] text-[#1a1a1a] hover:bg-[#3399ff] hover:text-white',
            ready && 'restart-ready bg-[#fff4cc] font-semibold',
          )}
        >
          <span>{strings.os.restartSystem}</span>
          {ready ? (
            <span className="rounded-sm bg-[#d97600] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase">
              {strings.os.updateBadge}
            </span>
          ) : null}
        </button>
        {ready ? (
          <div className="px-2 pb-1 text-[10px] text-[#6a4a10]">{strings.os.bootImageReady}</div>
        ) : null}
      </div>
    </div>
  )
}
