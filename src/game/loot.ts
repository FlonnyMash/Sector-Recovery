import type { RecoveredFile, RecoveredFileType } from '../types/game'

export type LootTemplate = {
  name: string
  type: RecoveredFileType
  size: string
  content?: string
}

const CORRUPTED_MEM: LootTemplate = { name: 'corrupted_mem.sys', type: 'system', size: '4 KB' }
const MEME_JPG: LootTemplate = { name: '2011_Meme.jpg', type: 'image', size: '1.2 MB' }
const AUDIO_SNIPPET: LootTemplate = { name: 'Audio_Snippet.mp3', type: 'audio', size: '3.4 MB' }

export const LOOT_TEMPLATES: readonly LootTemplate[] = [CORRUPTED_MEM, MEME_JPG, AUDIO_SNIPPET]

export const LOOT_NAMES = LOOT_TEMPLATES.map((template) => template.name)

export function instantiateLoot(template: LootTemplate): RecoveredFile {
  return {
    id: crypto.randomUUID(),
    name: template.name,
    type: template.type,
    size: template.size,
    content: template.content,
  }
}

export function instantiateLootByName(name: string): RecoveredFile | null {
  const template = LOOT_TEMPLATES.find((entry) => entry.name === name)
  return template ? instantiateLoot(template) : null
}

export interface LootRoll {
  fragments: number
  item: RecoveredFile | null
}

export interface ScanResult {
  fragments: number
  item: RecoveredFile | null
  isNew: boolean
}

interface FragmentsEntry {
  kind: 'fragments'
  weight: number
  min: number
  max: number
}

interface ItemEntry {
  kind: 'item'
  weight: number
  template: LootTemplate
}

type LootEntry = FragmentsEntry | ItemEntry

export const LOOT_TABLE: readonly LootEntry[] = [
  { kind: 'fragments', weight: 85, min: 1, max: 10 },
  { kind: 'item', weight: 10, template: CORRUPTED_MEM },
  { kind: 'item', weight: 4, template: MEME_JPG },
  { kind: 'item', weight: 1, template: AUDIO_SNIPPET },
]

const TOTAL_WEIGHT = LOOT_TABLE.reduce((sum, entry) => sum + entry.weight, 0)

export function rollLoot(random: () => number = Math.random): LootRoll {
  let roll = random() * TOTAL_WEIGHT
  for (const entry of LOOT_TABLE) {
    roll -= entry.weight
    if (roll > 0) continue
    if (entry.kind === 'fragments') {
      const span = entry.max - entry.min + 1
      const fragments = entry.min + Math.floor(random() * span)
      return { fragments, item: null }
    }
    return { fragments: 0, item: instantiateLoot(entry.template) }
  }
  return { fragments: 1, item: null }
}
