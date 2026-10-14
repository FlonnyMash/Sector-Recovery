export function OperatorNotes() {
  return (
    <div className="h-full bg-[#fff8d2] p-4 font-[Tahoma,'Segoe_UI',sans-serif] text-[13px] leading-relaxed text-[#3b3318]">
      <div className="mb-3 border-b border-[#d9c56a] pb-2 text-[15px] font-bold">
        SECTOR RECOVERY UTILITY
      </div>
      <p className="mb-3 text-[12px] text-[#6a5c24]">Build 1.0.0 · 2011-03-14</p>
      <p className="mb-2">Operator notes:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Mount the recovered image as PhysicalDrive1.</li>
        <li>Use Extract Sector to pull fragments by hand.</li>
        <li>Purchase automation from the terminal store when you can afford it.</li>
        <li>Keep the Recovery Terminal in the foreground while scripts are running.</li>
      </ul>
    </div>
  )
}
