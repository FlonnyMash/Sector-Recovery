import { APP_LIST } from '../../game/apps'
import type { AppType } from '../../types/game'

interface StartMenuProps {
  onOpenApp: (type: AppType) => void
}

export function StartMenu({ onOpenApp }: StartMenuProps) {
  return (
    <div className="absolute bottom-10 left-1 z-[60] w-[280px] overflow-hidden rounded-t-md border border-white/40 bg-[#dce9f5]/80 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
      <div className="bg-gradient-to-r from-[#1d4f86] to-[#3d8ad0] px-3 py-2 text-[13px] font-semibold text-white">
        Sector Recovery
      </div>
      <div className="p-1">
        {APP_LIST.map((app) => (
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
    </div>
  )
}
