import type { RetroIconName } from '../components/os/retroIcons'

export const UPGRADES = [
  {
    id: 'auto_scanner_bot',
    icon: 'document-search' satisfies RetroIconName,
    name: 'Auto-Scanner Bot',
    description: 'A background worker that keeps reading sectors while you browse. +2 fragments/sec.',
    baseCost: 500,
    costMultiplier: 1.15,
    fragmentsPerSecond: 2,
  },
  {
    id: 'cluster_crawler',
    icon: 'data-nodes' satisfies RetroIconName,
    name: 'Cluster Crawler Pro',
    description: 'Walks the FAT looking for orphaned clusters. +10 fragments/sec.',
    baseCost: 2000,
    costMultiplier: 1.15,
    fragmentsPerSecond: 10,
  },
  {
    id: 'head_calibrator',
    icon: 'hard-drive-external' satisfies RetroIconName,
    name: 'Head Calibrator Deluxe',
    description: 'Keeps the read head aligned on damaged platters. +50 fragments/sec.',
    baseCost: 9000,
    costMultiplier: 1.18,
    fragmentsPerSecond: 50,
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
