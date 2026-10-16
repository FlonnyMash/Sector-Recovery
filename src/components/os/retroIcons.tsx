/**
 * Icon catalogue shared by the target OS (32x32 pixel-art PNGs in
 * /public/Old_Icons) and the matching modern Linux-style SVGs
 * (/public/new_icons). Each RETRO_ICONS key's JSDoc describes the picture so
 * the set is searchable by meaning. The "#N" is the original item number from
 * the itch.io "pxl retro computer icons" set.
 *
 * Render with <RetroIcon name="..." />, or <ModernIcon name="..." /> /
 * variant="modern" for the Conflux-style SVG. App registry helpers:
 * retroAppIcon() and modernAppIcon().
 */
import type { ReactNode } from 'react'
import type { RecoveredFileType } from '../../types/game'
import { cn } from '../../utils/cn'

export const RETRO_ICONS = {
  /** #1 Desktop computer with a blue screen */
  'computer-blue': 'computer-blue.png',
  /** #2 Desktop computer with a teal screen and keyboard */
  'computer-teal': 'computer-teal.png',
  /** #3 Tower PC standing next to a monitor */
  'computer-tower': 'computer-tower.png',
  /** #4 Classic PC: monitor on a desktop case with keyboard (My Computer) */
  'computer-pc': 'computer-pc.png',
  /** #5 CRT monitor with a dark blue screen */
  'monitor': 'monitor.png',
  /** #6 Open laptop */
  'laptop': 'laptop.png',
  /** #7 Three computers linked in a tree (network neighborhood) */
  'network-tree': 'network-tree.png',
  /** #8 Two computers connected by a cable */
  'network-cable': 'network-cable.png',
  /** #9 Two computers side by side (workgroup) */
  'network-pair': 'network-pair.png',
  /** #10 Two computers linked through a hub */
  'network-hub': 'network-hub.png',
  /** #11 Monitor showing a game character (display / games) */
  'monitor-game': 'monitor-game.png',
  /** #12 Plain application window */
  'window': 'window.png',
  /** #13 Window with an hourglass (busy / loading) */
  'window-busy': 'window-busy.png',
  /** #14 Window with a shortcut arrow */
  'window-shortcut': 'window-shortcut.png',
  /** #15 Window with a user silhouette (user account) */
  'window-user': 'window-user.png',
  /** #16 Window with colored buttons (display / appearance settings) */
  'window-display': 'window-display.png',
  /** #17 Two cascaded windows (task switcher) */
  'windows-cascade': 'windows-cascade.png',
  /** #18 Folder with cascaded windows (Programs) */
  'folder-programs': 'folder-programs.png',
  /** #19 Window with a red error badge (crashed program) */
  'window-error': 'window-error.png',
  /** #20 Dark terminal / command prompt window */
  'window-terminal': 'window-terminal.png',
  /** #21 Computer with a safe and a red arrow (backup / recovery) */
  'computer-recovery': 'computer-recovery.png',
  /** #22 Rack server connected to a network */
  'server': 'server.png',
  /** #23 Closed yellow folder */
  'folder': 'folder.png',
  /** #24 Open folder with papers inside */
  'folder-open-papers': 'folder-open-papers.png',
  /** #25 Folder with a document in front */
  'folder-document': 'folder-document.png',
  /** #26 Closed folder, flat style */
  'folder-plain': 'folder-plain.png',
  /** #27 Folder with a shortcut arrow */
  'folder-shortcut': 'folder-shortcut.png',
  /** #28 Folder with a hammer and screwdriver (system tools) */
  'folder-tools': 'folder-tools.png',
  /** #29 Folder with a red error badge */
  'folder-error': 'folder-error.png',
  /** #30 Folder with a magnifying glass (find files) */
  'folder-search': 'folder-search.png',
  /** #31 Folder with letters A (fonts) */
  'folder-fonts': 'folder-fonts.png',
  /** #32 Folder connected to a network (shared folder) */
  'folder-network': 'folder-network.png',
  /** #33 Server with a red X (disconnected) */
  'server-offline': 'server-offline.png',
  /** #34 Notepad with a teal cover */
  'notepad-teal': 'notepad-teal.png',
  /** #35 Spiral notepad */
  'notepad': 'notepad.png',
  /** #36 Spiral notepad with a pencil */
  'notepad-pencil': 'notepad-pencil.png',
  /** #37 Spiral notepad with a fountain pen */
  'notepad-pen': 'notepad-pen.png',
  /** #38 Plain text document */
  'document': 'document.png',
  /** #39 Document with a magnifying glass (search / scan) */
  'document-search': 'document-search.png',
  /** #40 Document with a red error badge */
  'document-error': 'document-error.png',
  /** #41 Document with an embedded picture (image file) */
  'document-image': 'document-image.png',
  /** #42 Clipboard with a lined sheet */
  'clipboard': 'clipboard.png',
  /** #43 Lined notes page with a pencil */
  'notes-pencil': 'notes-pencil.png',
  /** #44 Sheet being written on with a pencil */
  'note-write': 'note-write.png',
  /** #45 Compact disc, angled */
  'cd': 'cd.png',
  /** #46 Compact disc, flat */
  'cd-flat': 'cd-flat.png',
  /** #47 Compact disc with a film strip (video) */
  'cd-video': 'cd-video.png',
  /** #48 Compact disc with a media player badge */
  'cd-media': 'cd-media.png',
  /** #49 Compact disc with a music note (audio) */
  'cd-music': 'cd-music.png',
  /** #50 CD drive with a disc */
  'cd-drive': 'cd-drive.png',
  /** #51 Software box with a compact disc */
  'cd-software-box': 'cd-software-box.png',
  /** #52 Compact disc with a yellow warning triangle */
  'cd-warning': 'cd-warning.png',
  /** #53 Compact disc with a red error badge */
  'cd-error': 'cd-error.png',
  /** #54 Compact disc with a magnifying glass */
  'cd-search': 'cd-search.png',
  /** #55 Loudspeaker (volume / sound) */
  'speaker': 'speaker.png',
  /** #56 Old mobile phone */
  'mobile-phone': 'mobile-phone.png',
  /** #57 Purple book with a question mark (help) */
  'help-book': 'help-book.png',
  /** #58 Red alarm clock */
  'clock': 'clock.png',
  /** #59 Document with a user silhouette (profile) */
  'document-user': 'document-user.png',
  /** #60 Speech bubble with an i (information) */
  'info-bubble': 'info-bubble.png',
  /** #61 Document with a video camera */
  'document-video': 'document-video.png',
  /** #62 Document with a red push pin */
  'document-pinned': 'document-pinned.png',
  /** #63 Paint roller and brush (paint / theme) */
  'paint-tools': 'paint-tools.png',
  /** #64 Opened yellow envelope */
  'mail-open': 'mail-open.png',
  /** #65 Books on a shelf (library) */
  'bookshelf': 'bookshelf.png',
  /** #66 Microphone */
  'microphone': 'microphone.png',
  /** #67 Earth globe (internet / web) */
  'globe': 'globe.png',
  /** #68 Globe with a magnifying glass (web search) */
  'globe-search': 'globe-search.png',
  /** #69 Light bulb with an exclamation mark (tip / idea) */
  'lightbulb': 'lightbulb.png',
  /** #70 Sheet with checked boxes (tasks) */
  'checklist': 'checklist.png',
  /** #71 Green tree */
  'tree': 'tree.png',
  /** #72 Grey safe (secure storage) */
  'safe': 'safe.png',
  /** #73 Envelope with sync arrows (send / receive) */
  'mail-sync': 'mail-sync.png',
  /** #74 Joystick (games) */
  'joystick': 'joystick.png',
  /** #75 Closed yellow envelope (mail) */
  'mail': 'mail.png',
  /** #76 Microchip (system / hardware) */
  'chip': 'chip.png',
  /** #77 Open book */
  'book-open': 'book-open.png',
  /** #78 Printer with a page */
  'printer': 'printer.png',
  /** #79 Wall calendar */
  'calendar': 'calendar.png',
  /** #80 Yellow filing cabinet (archive) */
  'filing-cabinet': 'filing-cabinet.png',
  /** #81 Cassette tape */
  'cassette': 'cassette.png',
  /** #82 Calculator with a pencil and paper */
  'calculator-notes': 'calculator-notes.png',
  /** #83 Teal calculator */
  'calculator': 'calculator.png',
  /** #84 Blue floppy disk (save) */
  'floppy': 'floppy.png',
  /** #85 Battery, full */
  'battery-full': 'battery-full.png',
  /** #86 Battery, half */
  'battery-half': 'battery-half.png',
  /** #87 Battery, low with an exclamation mark */
  'battery-low': 'battery-low.png',
  /** #88 Power plug (power / shutdown) */
  'plug': 'plug.png',
  /** #89 Document with a globe (web page / HTML) */
  'document-web': 'document-web.png',
  /** #90 Document with a yellow warning triangle */
  'document-warning': 'document-warning.png',
  /** #91 Document with a red exclamation badge */
  'document-alert': 'document-alert.png',
  /** #92 Document with a padlock (encrypted / read-only) */
  'document-locked': 'document-locked.png',
  /** #93 Document with a blue T (TrueType font) */
  'font-truetype': 'font-truetype.png',
  /** #94 Document with a red A (font file) */
  'font-file': 'font-file.png',
  /** #95 Document with linked colored nodes (data / cluster map) */
  'data-nodes': 'data-nodes.png',
  /** #96 Floppy disk drive with a disk */
  'floppy-drive': 'floppy-drive.png',
  /** #97 Yellow smiley face */
  'smiley': 'smiley.png',
  /** #98 Red circle with a white X (error) */
  'error': 'error.png',
  /** #99 Red no-entry sign (forbidden / blocked) */
  'forbidden': 'forbidden.png',
  /** #100 External hard drive with a cable */
  'hard-drive-external': 'hard-drive-external.png',
  /** #101 Stack of blank documents */
  'documents-stack': 'documents-stack.png',
  /** #102 Keyboard */
  'keyboard': 'keyboard.png',
  /** #103 Computer mouse */
  'mouse': 'mouse.png',
  /** #104 Speech bubble with text lines (chat / messenger) */
  'chat-bubble': 'chat-bubble.png',
  /** #105 Internal hard drive */
  'hard-drive': 'hard-drive.png',
  /** #106 Rolled paper scroll (log / script) */
  'scroll': 'scroll.png',
  /** #107 Pointing hand cursor (link) */
  'hand-pointer': 'hand-pointer.png',
  /** #108 Arrow mouse cursor */
  'cursor-arrow': 'cursor-arrow.png',
  /** #109 Green circuit board (developer / hardware tools) */
  'circuit-board': 'circuit-board.png',
  /** #110 Hourglass (wait / busy) */
  'hourglass': 'hourglass.png',
} as const

export type RetroIconName = keyof typeof RETRO_ICONS

export const RETRO_ICON_BASE = '/Old_Icons'
export const MODERN_ICON_BASE = '/new_icons'

export function retroIconSrc(name: RetroIconName): string {
  return `${RETRO_ICON_BASE}/${RETRO_ICONS[name]}`
}

export function modernIconSrc(name: RetroIconName): string {
  return `${MODERN_ICON_BASE}/${name}.svg`
}

export interface RetroIconProps {
  name: RetroIconName
  /** Rendered size in CSS px. Slots: 20, 32, 40, 56, 64. */
  size?: number
  className?: string
  title?: string
  /** Pixel-art PNGs (default) or Conflux-style SVGs from /new_icons. */
  variant?: 'retro' | 'modern'
}

export function RetroIcon({ name, size = 32, className, title, variant = 'retro' }: RetroIconProps) {
  if (variant === 'modern') {
    return <ModernIcon name={name} size={size} className={className} title={title} />
  }
  return (
    <img
      src={retroIconSrc(name)}
      width={size}
      height={size}
      alt=""
      title={title}
      aria-hidden={title ? undefined : true}
      draggable={false}
      decoding="sync"
      loading="eager"
      className={cn('pixelated block max-w-none shrink-0 select-none', className)}
      style={{ width: size, height: size, maxWidth: size, maxHeight: size }}
    />
  )
}

export function ModernIcon({ name, size = 32, className, title }: RetroIconProps) {
  return (
    <img
      src={modernIconSrc(name)}
      width={size}
      height={size}
      alt=""
      title={title}
      aria-hidden={title ? undefined : true}
      draggable={false}
      decoding="sync"
      loading="eager"
      className={cn('block max-w-none shrink-0 select-none', className)}
      style={{ width: size, height: size, maxWidth: size, maxHeight: size }}
    />
  )
}

/**
 * Builds an `AppDefinition.icon` render function backed by a retro icon.
 * Supports the optional notification `badge` used by taskbar/desktop slots.
 */
export function retroAppIcon(name: RetroIconName) {
  return function RetroAppIcon({ size = 64, badge }: { size?: number; badge?: boolean }): ReactNode {
    if (!badge) return <RetroIcon name={name} size={size} />
    return (
      <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
        <RetroIcon name={name} size={size} />
        <span className="absolute top-0 right-0 h-[11px] w-[11px] rounded-full border-2 border-white bg-[#e23d3d] shadow-[0_0_6px_rgba(226,61,61,0.9)]" />
      </span>
    )
  }
}

/** Builds an `AppDefinition.icon` render function backed by a modern Linux-style SVG. */
export function modernAppIcon(name: RetroIconName) {
  return function ModernAppIcon({ size = 64, badge }: { size?: number; badge?: boolean }): ReactNode {
    if (!badge) return <ModernIcon name={name} size={size} />
    return (
      <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
        <ModernIcon name={name} size={size} />
        <span className="absolute top-0 right-0 h-[11px] w-[11px] rounded-full border-2 border-white bg-[#e23d3d] shadow-[0_0_6px_rgba(226,61,61,0.9)]" />
      </span>
    )
  }
}

/** Shared file-type to icon mapping used by the explorer and SectorRecover. */
export function fileTypeIcon(type: RecoveredFileType): RetroIconName {
  if (type === 'image') return 'document-image'
  if (type === 'audio') return 'cd-music'
  if (type === 'system') return 'chip'
  return 'document'
}
