const PREFIX = 'sector-recovery:highscore:'

function readNumber(key: string): number {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return 0
    const value = Number(raw)
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

function writeNumber(key: string, value: number) {
  try {
    localStorage.setItem(PREFIX + key, String(value))
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function getHighScore(game: string): number {
  return readNumber(game)
}

export function recordHighScore(game: string, value: number): number {
  const next = Math.max(getHighScore(game), value)
  writeNumber(game, next)
  return next
}

export function getBestTime(game: string): number | null {
  try {
    const raw = localStorage.getItem(PREFIX + `${game}:time`)
    if (raw === null) return null
    const value = Number(raw)
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

export function recordBestTime(game: string, seconds: number): number {
  const current = getBestTime(game)
  const next = current === null ? seconds : Math.min(current, seconds)
  writeNumber(`${game}:time`, next)
  return next
}
