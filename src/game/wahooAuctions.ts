import { strings } from '../i18n'
import type { AuctionLotId, PrologueState } from '../types/game'

export type { AuctionLotId }

export interface AuctionLot {
  id: AuctionLotId
  lotNumber: number
  title: string
  description: string
  sellerNotes: string
  status: 'sold' | 'active'
  bid: string
  highBidder: string
  winner?: string
  bids: number
  ends?: string
}

const copy = strings.wahoo.auctions

export const AUCTION_LOTS: AuctionLot[] = [
  {
    id: 'lot-404',
    lotNumber: 404,
    title: copy.lot404Title,
    description: copy.lot404Desc,
    sellerNotes: copy.lot404Notes,
    status: 'active',
    bid: '¥3,200',
    highBidder: strings.chat.contactHandle,
    bids: 5,
  },
  {
    id: 'lot-401',
    lotNumber: 401,
    title: copy.lot401Title,
    description: copy.lot401Desc,
    sellerNotes: copy.lot401Notes,
    status: 'active',
    bid: '¥1,500',
    highBidder: 'RetroOtaku_91',
    bids: 4,
    ends: '2d 11h',
  },
  {
    id: 'lot-402',
    lotNumber: 402,
    title: copy.lot402Title,
    description: copy.lot402Desc,
    sellerNotes: copy.lot402Notes,
    status: 'active',
    bid: '¥4,800',
    highBidder: 'DenDenParts',
    bids: 9,
    ends: '1d 04h',
  },
  {
    id: 'lot-403',
    lotNumber: 403,
    title: copy.lot403Title,
    description: copy.lot403Desc,
    sellerNotes: copy.lot403Notes,
    status: 'active',
    bid: '¥8,900',
    highBidder: 'LabBench_Osaka',
    bids: 6,
    ends: '3d 08h',
  },
  {
    id: 'lot-405',
    lotNumber: 405,
    title: copy.lot405Title,
    description: copy.lot405Desc,
    sellerNotes: copy.lot405Notes,
    status: 'active',
    bid: '¥2,100',
    highBidder: 'CRT_Collector',
    bids: 3,
    ends: '4d 19h',
  },
]

export function resolveLot(
  lot: AuctionLot,
  prologue: Pick<PrologueState, 'auctionLot404Sold'>,
): AuctionLot {
  if (lot.id !== 'lot-404' || !prologue.auctionLot404Sold) return lot
  return {
    ...lot,
    status: 'sold',
    winner: strings.chat.contactHandle,
    highBidder: strings.chat.contactHandle,
    ends: copy.endedJustNow,
  }
}
