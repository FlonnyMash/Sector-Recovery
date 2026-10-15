// Run from the repo root:
// npx tsx scripts/economy-sim.ts

import {
  CLICKS_PER_SECOND,
  ECONOMY_SIM_STRATEGY,
  FRAGMENTS_PER_CLICK,
  runEconomySim,
  summarizeEconomySim,
  type MilestoneRow,
  type PurchaseRow,
} from '../src/game/economySim.ts'

function printReport(purchases: PurchaseRow[], milestones: MilestoneRow[], summary: string, stoppedEarly: string | null): void {
  console.log('Sector Recovery — early-game economy simulation')
  console.log(`Clicks: ${CLICKS_PER_SECOND}/s × ${FRAGMENTS_PER_CLICK} fragment`)
  console.log(`Strategy: ${ECONOMY_SIM_STRATEGY}`)
  console.log('')

  if (stoppedEarly) console.warn(stoppedEarly)

  console.log('Milestones')
  console.table(milestones)

  console.log('Purchase timeline')
  console.table(purchases)

  console.log(summary)
}

const result = runEconomySim()
printReport(result.purchases, result.milestones, summarizeEconomySim(result.state), result.stoppedEarly)
