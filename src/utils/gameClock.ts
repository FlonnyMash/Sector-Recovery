/** In-world clock origin: every playthrough starts at 15:21. */
const GAME_START_HOUR = 15
const GAME_START_MINUTE = 21

let startedAtMs = Date.now()

export function resetGameClock(now = Date.now()) {
  startedAtMs = now
}

export function getGameClockOrigin() {
  return startedAtMs
}

export function restoreGameClock(origin: number) {
  if (!Number.isFinite(origin) || origin <= 0) return
  startedAtMs = origin
}

export function getGameNow(now = Date.now()): Date {
  const elapsed = now - startedAtMs
  const start = new Date(startedAtMs)
  start.setHours(GAME_START_HOUR, GAME_START_MINUTE, 0, 0)
  return new Date(start.getTime() + elapsed)
}
