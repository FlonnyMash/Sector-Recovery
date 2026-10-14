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

export function formatRate(value: number): string {
  if (value >= 100) return value.toFixed(0)
  if (value >= 10) return value.toFixed(1)
  return value.toFixed(2)
}

function trimDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '')
}
