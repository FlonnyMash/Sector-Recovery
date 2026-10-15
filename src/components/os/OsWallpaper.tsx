export function OsWallpaper({ host }: { host: boolean }) {
  return (
    <div
      className={
        host
          ? 'absolute inset-0 bg-gradient-to-br from-[#1a1440] via-[#3d1d6b] to-[#c45c78]'
          : 'absolute inset-0 bg-gradient-to-br from-[#0b3d66] via-[#1a5f8a] to-[#0a7a7a]'
      }
    >
      {host ? (
        <>
          <div className="absolute -top-24 -left-16 h-[520px] w-[520px] rounded-full bg-[#7c5cff]/35 blur-3xl" />
          <div className="absolute right-[-80px] bottom-[-40px] h-[480px] w-[480px] rounded-full bg-[#ff8a6a]/28 blur-3xl" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_42%)]" />
      )}
    </div>
  )
}
