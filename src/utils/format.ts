import { getGameNow } from './gameClock'

export function formatFragments(value: number): string {
  const amount = Math.floor(value)
  if (amount >= 1_000_000) {
    return `${trimDecimal(amount / 1_000_000)}M`
  }
  if (amount >= 10_000) {
    return `${trimDecimal(amount / 1_000)}K`
  }
  return amount.toLocaleString()
}

export function formatDataSize(fragments: number): string {
  const kb = Math.max(0, fragments)
  if (kb >= 1_048_576) {
    return `${(kb / 1_048_576).toFixed(2)} GB`
  }
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(2)} MB`
  }
  return `${Math.floor(kb).toLocaleString()} KB`
}

export function formatChatClock(date = getGameNow()): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function formatRate(value: number): string {
  if (value >= 100) return value.toFixed(0)
  if (value >= 10) return value.toFixed(1)
  return value.toFixed(2)
}

function trimDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '')
}
