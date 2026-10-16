import { selectVisibleApps } from '../../game/apps'
import { strings } from '../../i18n'
import { useGameStore } from '../../store/useGameStore'
import type { AppType, OsEnvironment } from '../../types/game'
import { cn } from '../../utils/cn'
import { RetroIcon } from './retroIcons'

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
      <div className="absolute bottom-24 left-1/2 z-[60] w-[420px] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/15 bg-[#1c1c22]/80 shadow-2xl backdrop-blur-xl">
        <div className="px-4 py-3 text-[17px] font-medium tracking-wide text-white/80">
          {header}
        </div>
        <div className="grid grid-cols-3 gap-2 px-3 pb-3">
          {apps.map((app) => (
            <button
              key={app.type}
              type="button"
              onClick={() => onOpenApp(app.type)}
              className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-center text-[14px] text-white/90 hover:bg-white/10"
            >
              {app.icon({ size: 40 })}
              <span className="w-full truncate">{app.title}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-white/10 bg-black/20 p-2">
          <button
            type="button"
            onClick={restart}
            className={cn(
              'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[16px] text-white/90 hover:bg-white/10',
              ready && 'restart-ready bg-amber-400/15 font-semibold text-amber-100',
            )}
          >
            <span>{strings.os.restartSystem}</span>
            {ready ? (
              <span className="rounded-md bg-[#d97600] px-1.5 py-0.5 text-[12px] font-bold tracking-wide text-white uppercase">
                {strings.os.updateBadge}
              </span>
            ) : null}
          </button>
          {ready ? (
            <div className="px-3 pb-1 text-[13px] text-amber-200/80">{strings.os.bootImageReady}</div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="classic-raised absolute bottom-[40px] left-0 z-[60] w-[290px] bg-[#c0c0c0] py-0.5">
      {apps.map((app) => (
        <button
          key={app.type}
          type="button"
          onClick={() => onOpenApp(app.type)}
          className="flex w-full items-center gap-1.5 px-1.5 py-[5px] text-left text-[14px] text-black hover:bg-[#000080] hover:text-white"
        >
          {app.icon({ size: 20 })}
          <span className="truncate">{app.title}</span>
        </button>
      ))}
      <div className="mx-1 my-0.5 border-t border-[#808080] shadow-[0_1px_0_#ffffff]" />
      <button
        type="button"
        onClick={restart}
        className={cn(
          'flex w-full items-center justify-between px-1.5 py-[5px] text-left text-[14px] text-black hover:bg-[#000080] hover:text-white',
          ready && 'restart-ready bg-[#fff4cc] font-semibold',
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <RetroIcon name="plug" size={20} />
          <span className="truncate">{strings.os.restartSystem}</span>
        </span>
        {ready ? (
          <span className="bg-[#d97600] px-1 py-px text-[12px] font-bold tracking-wide text-white uppercase">
            {strings.os.updateBadge}
          </span>
        ) : null}
      </button>
      {ready ? (
        <div className="px-1.5 pb-0.5 text-[13px] text-[#6a4a10]">{strings.os.bootImageReady}</div>
      ) : null}
    </div>
  )
}
