import type { AppType, VirtualFile, VirtualFileType } from '../types/game'
import { meme2011Thumb } from '../assets/photos/meme2011Thumb'

/** Lifetime fragment (KB) thresholds at which each 1-based sector is fully recovered. */
export const SECTOR_THRESHOLDS: readonly number[] = [250, 2_000, 15_000]

export const EXPLORER_PATH = {
  computer: 'computer',
  drive: 'C:',
  recovered: 'C:/Recovered_Data',
  user: 'C:/User',
  toro: 'C:/User/Toro',
  desktop: 'C:/User/Toro/Desktop',
  pictures: 'C:/User/Toro/Pictures',
} as const

const VIRTUAL_FILE_CATALOG: readonly VirtualFile[] = [
  {
    id: 'meme-2011',
    name: '2011_meme.jpg',
    path: EXPLORER_PATH.pictures,
    type: 'image',
    imageSrc: '/photos/meme-2011.png',
    imageThumb: meme2011Thumb,
    content: 'Recovered JPEG stream — 2011-03-14.',
    isUnlocked: false,
    requiredSector: 1,
  },
  {
    id: 'letter-txt',
    name: 'letter.txt',
    path: 'C:/User/Toro/Documents',
    type: 'text',
    content: 'Toro — if you find this, the login is not the door.',
    isUnlocked: false,
    requiredSector: 2,
  },
  {
    id: 'kernel-sys',
    name: 'kernel.sys',
    path: 'C:/7F3A91/B12_KRNL',
    type: 'system',
    content: 'B12_KRNL  7F3A91  STATUS=LOCKED',
    isUnlocked: false,
    requiredSector: 3,
  },
]

/** File-type → window app. Notepad is not registered yet. */
export const FILE_VIEWER_APP: Partial<Record<VirtualFileType, AppType>> = {
  image: 'photo-viewer',
  // text: notepad
}

export const VIRTUAL_FILE_COUNT = VIRTUAL_FILE_CATALOG.length

/** Warm the browser cache so the Photo Viewer shows full-size pictures instantly. */
function preloadVirtualImages() {
  if (typeof window === 'undefined') return
  for (const file of VIRTUAL_FILE_CATALOG) {
    if (!file.imageSrc) continue
    const image = new Image()
    image.decoding = 'async'
    image.src = file.imageSrc
  }
}

preloadVirtualImages()

export function createInitialFiles(): VirtualFile[] {
  return VIRTUAL_FILE_CATALOG.map((file) => ({ ...file }))
}

export function newlyUnlockedFiles(before: readonly VirtualFile[], after: readonly VirtualFile[]): VirtualFile[] {
  const wasLocked = new Set(before.filter((file) => !file.isUnlocked).map((file) => file.id))
  return after.filter((file) => file.isUnlocked && wasLocked.has(file.id))
}

export function recoveredSectorForLifetime(lifetime: number): number {
  let sector = 0
  for (let index = 0; index < SECTOR_THRESHOLDS.length; index++) {
    const threshold = SECTOR_THRESHOLDS[index]
    if (threshold !== undefined && lifetime >= threshold) sector = index + 1
  }
  return sector
}

export function unlockFilesForSector(files: VirtualFile[], sector: number): VirtualFile[] {
  let changed = false
  const next = files.map((file) => {
    if (file.requiredSector !== sector || file.isUnlocked) return file
    changed = true
    return { ...file, isUnlocked: true }
  })
  return changed ? next : files
}

export function withLifetimeGain(
  files: VirtualFile[],
  recoveredSector: number,
  lifetimeFragments: number,
  gained: number,
): { files: VirtualFile[]; recoveredSector: number; lifetimeFragments: number } {
  if (gained <= 0) {
    return { files, recoveredSector, lifetimeFragments }
  }
  const nextLifetime = lifetimeFragments + gained
  const nextSector = recoveredSectorForLifetime(nextLifetime)
  let nextFiles = files
  for (let sector = recoveredSector + 1; sector <= nextSector; sector++) {
    nextFiles = unlockFilesForSector(nextFiles, sector)
  }
  return {
    files: nextFiles,
    recoveredSector: nextSector,
    lifetimeFragments: nextLifetime,
  }
}

export function filesInDirectory(files: readonly VirtualFile[], path: string): VirtualFile[] {
  return files.filter((file) => file.isUnlocked && file.path === path)
}

export function dynamicChildFolders(files: readonly VirtualFile[], path: string): string[] {
  if (path === EXPLORER_PATH.computer) return []
  const prefix = `${path}/`
  const names: string[] = []
  const seen = new Set<string>()
  for (const file of files) {
    if (!file.isUnlocked || !file.path.startsWith(prefix)) continue
    const rest = file.path.slice(prefix.length)
    const slash = rest.indexOf('/')
    const segment = slash === -1 ? rest : rest.slice(0, slash)
    if (!segment || seen.has(segment)) continue
    seen.add(segment)
    names.push(segment)
  }
  names.sort((a, b) => a.localeCompare(b))
  return names
}

export function joinPath(parent: string, segment: string): string {
  if (parent === EXPLORER_PATH.computer) return segment
  return `${parent}/${segment}`
}

export function viewerAppForFile(file: VirtualFile): AppType | null {
  return FILE_VIEWER_APP[file.type] ?? null
}
