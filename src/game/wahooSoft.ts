import { strings } from '../i18n'

export const SOFT_CATEGORY_IDS = ['data-recovery', 'virtual-pets', 'default-apps'] as const
export type SoftCategoryId = (typeof SOFT_CATEGORY_IDS)[number]

export type SoftItemStatus = 'available' | 'coming-soon'

export type SoftItemId =
  | 'sectorrecover'
  | 'wahoo-pets'
  | 'desktop-buddy'
  | 'media-player'
  | 'picture-viewer'

export interface SoftCategoryDef {
  id: SoftCategoryId
  label: string
  description: string
}

export interface SoftItemDef {
  id: SoftItemId
  categoryId: SoftCategoryId
  name: string
  blurb: string
  version: string
  size: string
  license: string
  status: SoftItemStatus
}

const COPY = strings.netExplorer.soft

export const SOFT_CATEGORIES: SoftCategoryDef[] = [
  {
    id: 'data-recovery',
    label: COPY.categories.dataRecovery.label,
    description: COPY.categories.dataRecovery.description,
  },
  {
    id: 'virtual-pets',
    label: COPY.categories.virtualPets.label,
    description: COPY.categories.virtualPets.description,
  },
  {
    id: 'default-apps',
    label: COPY.categories.defaultApps.label,
    description: COPY.categories.defaultApps.description,
  },
]

export const SOFT_ITEMS: SoftItemDef[] = [
  {
    id: 'sectorrecover',
    categoryId: 'data-recovery',
    name: COPY.items.sectorrecover.name,
    blurb: COPY.items.sectorrecover.blurb,
    version: COPY.items.sectorrecover.version,
    size: COPY.items.sectorrecover.size,
    license: COPY.items.sectorrecover.license,
    status: 'available',
  },
  {
    id: 'wahoo-pets',
    categoryId: 'virtual-pets',
    name: COPY.items.wahooPets.name,
    blurb: COPY.items.wahooPets.blurb,
    version: COPY.items.wahooPets.version,
    size: COPY.items.wahooPets.size,
    license: COPY.items.wahooPets.license,
    status: 'coming-soon',
  },
  {
    id: 'desktop-buddy',
    categoryId: 'virtual-pets',
    name: COPY.items.desktopBuddy.name,
    blurb: COPY.items.desktopBuddy.blurb,
    version: COPY.items.desktopBuddy.version,
    size: COPY.items.desktopBuddy.size,
    license: COPY.items.desktopBuddy.license,
    status: 'coming-soon',
  },
  {
    id: 'media-player',
    categoryId: 'default-apps',
    name: COPY.items.mediaPlayer.name,
    blurb: COPY.items.mediaPlayer.blurb,
    version: COPY.items.mediaPlayer.version,
    size: COPY.items.mediaPlayer.size,
    license: COPY.items.mediaPlayer.license,
    status: 'coming-soon',
  },
  {
    id: 'picture-viewer',
    categoryId: 'default-apps',
    name: COPY.items.pictureViewer.name,
    blurb: COPY.items.pictureViewer.blurb,
    version: COPY.items.pictureViewer.version,
    size: COPY.items.pictureViewer.size,
    license: COPY.items.pictureViewer.license,
    status: 'coming-soon',
  },
]

export function itemsInCategory(id: SoftCategoryId): SoftItemDef[] {
  return SOFT_ITEMS.filter((item) => item.categoryId === id)
}
