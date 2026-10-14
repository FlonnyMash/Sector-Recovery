export const UPGRADES = [
  {
    id: 'auto_script_v1',
    name: 'Automated Script v1.0',
    description: 'A batch job that pulls one fragment per second while you work.',
    baseCost: 50,
    costMultiplier: 1.15,
    fragmentsPerSecond: 1,
  },
  {
    id: 'sector_crawler',
    name: 'Sector Crawler',
    description: 'Walks the FAT looking for orphaned clusters. +5 fragments/sec.',
    baseCost: 250,
    costMultiplier: 1.15,
    fragmentsPerSecond: 5,
  },
  {
    id: 'head_calibrator',
    name: 'Head Calibrator',
    description: 'Keeps the read head aligned on damaged platters. +25 fragments/sec.',
    baseCost: 1500,
    costMultiplier: 1.18,
    fragmentsPerSecond: 25,
  },
] as const

export type UpgradeId = (typeof UPGRADES)[number]['id']

export function initialUpgradeCounts(): Record<UpgradeId, number> {
  return Object.fromEntries(UPGRADES.map((upgrade) => [upgrade.id, 0])) as Record<
    UpgradeId,
    number
  >
}

export function getUpgrade(id: UpgradeId) {
  const upgrade = UPGRADES.find((item) => item.id === id)
  if (!upgrade) {
    throw new Error(`Unknown upgrade: ${id}`)
  }
  return upgrade
}

export function getUpgradeCost(id: UpgradeId, owned: number): number {
  const upgrade = getUpgrade(id)
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned))
}

export function computeFragmentsPerSecond(owned: Record<UpgradeId, number>): number {
  return UPGRADES.reduce(
    (sum, upgrade) => sum + upgrade.fragmentsPerSecond * (owned[upgrade.id] ?? 0),
    0,
  )
}
