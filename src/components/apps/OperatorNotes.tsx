export function OperatorNotes() {
  return (
    <div className="h-full bg-[#fff8d2] p-4 font-[Tahoma,'Segoe_UI',sans-serif] text-[17px] leading-relaxed text-[#3b3318]">
      <div className="mb-3 border-b border-[#d9c56a] pb-2 text-[20px] font-bold">
        SECTOR RECOVERY UTILITY
      </div>
      <p className="mb-3 text-[16px] text-[#6a5c24]">Build 1.2.0 · 2011-03-14</p>
      <p className="mb-2">Operator notes:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Mount the recovered image as PhysicalDrive1.</li>
        <li>Open Wahoo! Net and download SectorRecover v1.2 from Wahoo! Soft.</li>
        <li>Use Scan Sector to pull data fragments and hunt for leftover files.</li>
        <li>Buy automation add-ons from inside SectorRecover when you can afford them.</li>
      </ul>
    </div>
  )
}
