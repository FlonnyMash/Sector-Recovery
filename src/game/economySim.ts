/** Early-game economy model used by `scripts/economy-sim.ts` and Dev Tools. */

export const CLICKS_PER_SECOND = 5
export const FRAGMENTS_PER_CLICK = 1
export const ECONOMY_SIM_STRATEGY =
  'Always buy the next most cost-efficient upgrade the moment it is affordable.'

const MAX_ITERATIONS = 50_000
const MAX_SIMULATED_SECONDS = 24 * 60 * 60

type Upgrade = {
  id: string
  name: string
  baseCost: number
  multiplier: number
  production: number
}

const UPGRADES: readonly Upgrade[] = [
  {
    id: 'basic_sector_scan',
    name: 'Basic Sector Scan',
    baseCost: 15,
    multiplier: 1.15,
    production: 1,
  },
  {
    id: 'background_process',
    name: 'Background Process',
    baseCost: 100,
    multiplier: 1.15,
    production: 4,
  },
  {
    id: 'botnet_node',
    name: 'Botnet Node',
    baseCost: 1100,
    multiplier: 1.15,
    production: 20,
  },
]

type MilestoneDef = {
  lifetime: number
  label: string
}

const MILESTONES: readonly MilestoneDef[] = [
  { lifetime: 1_000, label: '1,000 total fragments' },
  {
    lifetime: 50_000,
    label: '50,000 fragments — unlock Chatlogs_2011.zip',
  },
]

export type SimState = {
  time: number
  wallet: number
  lifetime: number
  passive: number
  levels: Record<string, number>
}

export type PurchaseRow = {
  time: string
  seconds: string
  upgrade: string
  level: number
  cost: number
  wallet: number
  lifetime: number
  passivePerSec: number
}

export type MilestoneRow = {
  milestone: string
  time: string
  seconds: string
  wallet: number
  lifetime: number
  passivePerSec: number
  basicSectorScan: number
  backgroundProcess: number
  botnetNode: number
}

export type EconomySimResult = {
  purchases: PurchaseRow[]
  milestones: MilestoneRow[]
  state: SimState
  stoppedEarly: string | null
}

function upgradeCost(upgrade: Upgrade, level: number): number {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.multiplier, level))
}

function incomePerSecond(passive: number): number {
  return passive + CLICKS_PER_SECOND * FRAGMENTS_PER_CLICK
}

function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatSeconds(seconds: number): string {
  return seconds.toFixed(2)
}

function snapshotLevels(state: SimState): Record<string, number> {
  return { ...state.levels }
}

function bestAffordableOrNextTarget(state: SimState): { upgrade: Upgrade; cost: number } | null {
  let best: { upgrade: Upgrade; cost: number; score: number } | null = null

  for (const upgrade of UPGRADES) {
    const level = state.levels[upgrade.id] ?? 0
    const cost = upgradeCost(upgrade, level)
    const score = upgrade.production / cost
    if (!best || score > best.score) {
      best = { upgrade, cost, score }
    }
  }

  return best
}

function advanceIncome(state: SimState, dt: number): void {
  const income = incomePerSecond(state.passive)
  const gained = income * dt
  state.time += dt
  state.wallet += gained
  state.lifetime += gained
}

function catchMilestones(
  before: SimState,
  after: SimState,
  remaining: MilestoneDef[],
  rows: MilestoneRow[],
): void {
  while (remaining.length > 0) {
    const next = remaining[0]
    if (!next || after.lifetime < next.lifetime) return

    const span = after.lifetime - before.lifetime
    const fraction = span <= 0 ? 1 : (next.lifetime - before.lifetime) / span
    const t = before.time + (after.time - before.time) * fraction
    const walletAt = before.wallet + (after.wallet - before.wallet) * fraction

    rows.push({
      milestone: next.label,
      time: formatClock(t),
      seconds: formatSeconds(t),
      wallet: Math.round(walletAt * 100) / 100,
      lifetime: next.lifetime,
      passivePerSec: before.passive,
      basicSectorScan: before.levels.basic_sector_scan ?? 0,
      backgroundProcess: before.levels.background_process ?? 0,
      botnetNode: before.levels.botnet_node ?? 0,
    })
    remaining.shift()
  }
}

function buyUpgrade(state: SimState, upgrade: Upgrade, cost: number): void {
  state.wallet -= cost
  state.levels[upgrade.id] = (state.levels[upgrade.id] ?? 0) + 1
  state.passive += upgrade.production
}

export function runEconomySim(): EconomySimResult {
  const state: SimState = {
    time: 0,
    wallet: 0,
    lifetime: 0,
    passive: 0,
    levels: Object.fromEntries(UPGRADES.map((upgrade) => [upgrade.id, 0])),
  }

  const targetLifetime = MILESTONES[MILESTONES.length - 1]?.lifetime ?? 0
  const remainingMilestones = [...MILESTONES]
  const purchases: PurchaseRow[] = []
  const milestones: MilestoneRow[] = []
  let stoppedEarly: string | null = null

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    if (state.lifetime >= targetLifetime) break
    if (state.time >= MAX_SIMULATED_SECONDS) {
      stoppedEarly = `Stopped at ${MAX_SIMULATED_SECONDS}s safety cap.`
      break
    }

    const target = bestAffordableOrNextTarget(state)
    if (!target) break

    if (state.wallet >= target.cost) {
      buyUpgrade(state, target.upgrade, target.cost)
      purchases.push({
        time: formatClock(state.time),
        seconds: formatSeconds(state.time),
        upgrade: target.upgrade.name,
        level: state.levels[target.upgrade.id] ?? 0,
        cost: target.cost,
        wallet: Math.round(state.wallet * 100) / 100,
        lifetime: Math.round(state.lifetime * 100) / 100,
        passivePerSec: state.passive,
      })
      continue
    }

    const income = incomePerSecond(state.passive)
    if (income <= 0) {
      stoppedEarly = 'Income is 0; simulation cannot progress.'
      break
    }

    const dtToPurchase = (target.cost - state.wallet) / income
    const dtToGoal = (targetLifetime - state.lifetime) / income
    const dt = Math.min(dtToPurchase, dtToGoal)
    const before = {
      time: state.time,
      wallet: state.wallet,
      lifetime: state.lifetime,
      passive: state.passive,
      levels: snapshotLevels(state),
    }

    advanceIncome(state, dt)
    catchMilestones(before, state, remainingMilestones, milestones)

    if (state.lifetime >= targetLifetime) break
  }

  return { purchases, milestones, state, stoppedEarly }
}

export function summarizeEconomySim(state: SimState): string {
  const levels = UPGRADES.map((upgrade) => `${upgrade.name} ${state.levels[upgrade.id] ?? 0}`).join(
    ', ',
  )
  return `Finished at ${formatClock(state.time)} (${formatSeconds(state.time)}s) · wallet ${state.wallet.toFixed(2)} · lifetime ${state.lifetime.toFixed(2)} · ${state.passive}/s passive · ${levels}`
}
