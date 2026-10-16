import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '../public/new_icons')
mkdirSync(outDir, { recursive: true })

const lg = (id, a, b, x2 = '0', y2 = '1') =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`

const rg = (id, a, b, cx = '.35', cy = '.3', r = '.75') =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`

const DEF_MAP = {
  sh: `<filter id="sh" x="-32%" y="-32%" width="164%" height="174%"><feDropShadow dx="0" dy="2" stdDeviation="1.7" flood-color="#071018" flood-opacity=".32"/></filter>`,
  foldB: lg('foldB', '#3d94ee', '#1557c8'),
  foldF: lg('foldF', '#9ed8ff', '#2d86f8'),
  foldT: lg('foldT', '#7ec8ff', '#3d94ee'),
  gloss: `<linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
  bez: lg('bez', '#414b5e', '#161c28'),
  stand: lg('stand', '#d5deea', '#8e9aab'),
  scrB: lg('scrB', '#7ee0ff', '#1a6dff'),
  scrT: lg('scrT', '#7ff6e4', '#0f9a8c'),
  scrD: lg('scrD', '#1d2a44', '#0b1220'),
  scrG: lg('scrG', '#8dffb8', '#1a8a4a'),
  paper: lg('paper', '#ffffff', '#e4ecf5'),
  paperF: lg('paperF', '#d5deea', '#b7c4d4'),
  wbg: lg('wbg', '#f7f9fc', '#e3ebf4'),
  whd: lg('whd', '#5aa2f0', '#2b78d4'),
  wterm: lg('wterm', '#1c2230', '#0c1018'),
  cd: rg('cd', '#e8fbff', '#6a4dff', '.32', '.28', '.8'),
  cdH: lg('cdH', '#f4f8ff', '#9aa7b8'),
  metal: lg('metal', '#eef3f9', '#9aa7b8'),
  metalD: lg('metalD', '#6b7688', '#2a3142'),
  err: lg('err', '#ff6b73', '#c81e28'),
  warn: lg('warn', '#ffe066', '#e09a00'),
  ok: lg('ok', '#5ee0a0', '#168a48'),
  gold: lg('gold', '#ffe08a', '#e09b18'),
  orange: lg('orange', '#ffb060', '#e05a10'),
  purple: lg('purple', '#c9a6ff', '#6b2fc4'),
  mail: lg('mail', '#7ec8ff', '#1a73e8'),
  ocean: rg('ocean', '#8fd4ff', '#1360c4', '.38', '.32', '.72'),
  land: lg('land', '#8be08a', '#2f9a48'),
  calR: lg('calR', '#ff5a62', '#c81e28'),
  calc: lg('calc', '#2a4d8f', '#132850'),
  pcb: lg('pcb', '#46d07a', '#157a40'),
  chip: lg('chip', '#3a4456', '#171d28'),
  batG: lg('batG', '#6ee7a0', '#1aa85c'),
  batY: lg('batY', '#ffe066', '#d4a000'),
  batR: lg('batR', '#ff6b73', '#c81e28'),
  floppy: lg('floppy', '#5aa2f0', '#1a62d4'),
  hdd: lg('hdd', '#4a5568', '#1c2433'),
  clockR: lg('clockR', '#3a4456', '#141a24'),
  wood: lg('wood', '#d4a574', '#8a5a32'),
  sand: lg('sand', '#7ee0ff', '#2b78d4'),
  bookP: lg('bookP', '#c9a6ff', '#6b2fc4'),
  teal: lg('teal', '#5ad4c8', '#1f8a82'),
  pink: lg('pink', '#ff9ec8', '#e23d7a'),
  cab: lg('cab', '#ffd166', '#d4a018'),
  leaf: lg('leaf', '#6ee08a', '#1e8a3c'),
  safe: lg('safe', '#d5deea', '#6b7688'),
  sky: lg('sky', '#9ed8ff', '#3d94ee'),
  game: lg('game', '#7dff9a', '#1aa85c'),
  smile: rg('smile', '#ffe566', '#f0a800', '.4', '.32', '.7'),
  keyb: lg('keyb', '#eceff4', '#b7c4d4'),
  phone: lg('phone', '#2a3142', '#11151e'),
}

function svg(body) {
  const defs = Object.entries(DEF_MAP)
    .filter(([id]) => id === 'sh' || body.includes(`url(#${id})`))
    .map(([, xml]) => xml)
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>${defs}</defs>
  <g filter="url(#sh)">${body}</g>
</svg>
`
}

const hi = (d) => `<path d="${d}" fill="url(#gloss)" opacity=".38"/>`

function folder({ overlay = '', papers = false } = {}) {
  const paper = papers
    ? `<rect x="18" y="16" width="26" height="20" rx="2.2" fill="#fff"/><rect x="20" y="13.5" width="24" height="20" rx="2.2" fill="#f4f8ff"/>`
    : ''
  return `
  <rect x="10" y="19" width="44" height="31.5" rx="6.5" fill="url(#foldB)"/>
  <path d="M14 15.5h16.8c1.2 0 2.28.66 2.84 1.72L36 21.5H14V15.5z" fill="url(#foldT)"/>
  ${paper}
  <path d="M9 25.2c0-2.7 2.2-4.9 4.9-4.9h14.8l3.5 3.9H50.1c2.7 0 4.9 2.2 4.9 4.9v18c0 2.7-2.2 4.9-4.9 4.9H13.9c-2.7 0-4.9-2.2-4.9-4.9v-18z" fill="url(#foldF)"/>
  ${hi('M9 25.2c0-2.7 2.2-4.9 4.9-4.9h14.8l3.5 3.9H50.1c2.7 0 4.9 2.2 4.9 4.9v6.4H9V25.2z')}
  <path d="M9 25.2c0-2.7 2.2-4.9 4.9-4.9h14.8l3.5 3.9H50.1c2.7 0 4.9 2.2 4.9 4.9" stroke="#fff" stroke-opacity=".28" stroke-width="1"/>
  ${overlay}`
}

function doc({ overlay = '', lines = true } = {}) {
  return `
  <rect x="14" y="8" width="36" height="46" rx="5.5" fill="url(#paper)"/>
  <path d="M38 8h7.5c2.5 0 4.5 2 4.5 4.5V20L38 8z" fill="url(#paperF)"/>
  <path d="M38 8v9.5c0 1.4 1.1 2.5 2.5 2.5H50" stroke="#c5cedb" stroke-width=".9"/>
  <rect x="14" y="8" width="36" height="14" rx="5.5" fill="url(#gloss)" opacity=".35"/>
  ${
    lines
      ? `<g stroke="#9aa7b8" stroke-width="1.7" stroke-linecap="round" opacity=".5">
           <path d="M20 27h20"/><path d="M20 33h20"/><path d="M20 39h14"/>
         </g>`
      : ''
  }
  ${overlay}`
}

function win({ extra = '', dark = false } = {}) {
  const fill = dark ? 'url(#wterm)' : 'url(#wbg)'
  const head = dark ? '#121826' : 'url(#whd)'
  return `
  <rect x="9" y="9" width="46" height="44" rx="9" fill="${fill}"/>
  <path d="M9 18V18c0-5 4-9 9-9h28c5 0 9 4 9 9H9z" fill="${head}"/>
  <circle cx="16.6" cy="16" r="2.05" fill="#ff6b6b"/>
  <circle cx="23" cy="16" r="2.05" fill="#ffd166"/>
  <circle cx="29.4" cy="16" r="2.05" fill="#6bcf7a"/>
  ${extra}`
}

function monitor({ screen = 'scrB', extra = '', kb = false, y = 8 } = {}) {
  return `
  <rect x="11" y="${y}" width="42" height="30" rx="5.5" fill="url(#bez)"/>
  <rect x="14.6" y="${y + 3.6}" width="34.8" height="20.6" rx="2.4" fill="url(#${screen})"/>
  <rect x="14.6" y="${y + 3.6}" width="34.8" height="8" rx="2.4" fill="url(#gloss)" opacity=".28"/>
  ${extra}
  <rect x="29" y="${y + 30}" width="6" height="5.4" rx="1" fill="url(#stand)"/>
  <rect x="21" y="${y + 35}" width="22" height="3.5" rx="1.7" fill="url(#stand)"/>
  ${
    kb
      ? `<rect x="16" y="50" width="32" height="6.2" rx="1.7" fill="url(#metalD)"/>
         <g fill="#c5cedb">${[0, 1, 2, 3, 4, 5, 6]
           .map((i) => `<rect x="${19 + i * 3.6}" y="51.5" width="2.8" height="2.4" rx=".45"/>`)
           .join('')}</g>`
      : ''
  }`
}

function miniPC(x, y, s = 1, screen = 'scrB') {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="0" y="0" width="22" height="16" rx="3.2" fill="url(#bez)"/>
    <rect x="2.2" y="2" width="17.6" height="10" rx="1.5" fill="url(#${screen})"/>
    <rect x="9" y="16" width="4" height="2.6" fill="url(#stand)"/>
    <rect x="5.5" y="18.4" width="11" height="2" rx="1" fill="url(#stand)"/>
  </g>`
}

function disc({ extra = '', cx = 32, cy = 32, r = 22 } = {}) {
  return `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#cd)"/>
  <circle cx="${cx}" cy="${cy}" r="${+(r * 0.72).toFixed(2)}" fill="none" stroke="#7ee8c8" stroke-opacity=".35" stroke-width="3.2"/>
  <circle cx="${cx}" cy="${cy}" r="${+(r * 0.5).toFixed(2)}" fill="none" stroke="#c9a6ff" stroke-opacity=".28" stroke-width="2.2"/>
  <path d="M${cx - 12} ${cy - 11}a18 18 0 0 1 24 6" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>
  <circle cx="${cx}" cy="${cy}" r="${+(r * 0.26).toFixed(2)}" fill="url(#cdH)"/>
  <circle cx="${cx}" cy="${cy}" r="${+(r * 0.1).toFixed(2)}" fill="#eef4fb"/>
  ${extra}`
}

const badge = {
  err: `<g transform="translate(36 36)"><circle cx="12" cy="12" r="11" fill="url(#err)" stroke="#fff" stroke-width="1.7"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></g>`,
  warn: `<g transform="translate(34 33)"><path d="M13 3.2 23.6 22.2H2.4L13 3.2z" fill="url(#warn)" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/><path d="M13 10v6.2" stroke="#7a4a00" stroke-width="2.3" stroke-linecap="round"/><circle cx="13" cy="19.3" r="1.25" fill="#7a4a00"/></g>`,
  search: `<g transform="translate(34 34)"><circle cx="10" cy="10" r="7.3" fill="#f4f8ff" fill-opacity=".55" stroke="#243044" stroke-width="2.7"/><path d="M15.6 15.6 22.2 22.2" stroke="#243044" stroke-width="3.2" stroke-linecap="round"/></g>`,
  lock: `<g transform="translate(38 32)"><rect x="3" y="10" width="16" height="13" rx="3" fill="url(#gold)" stroke="#fff" stroke-width="1.2"/><path d="M7 10V7.2a4 4 0 0 1 8 0V10" fill="none" stroke="#243044" stroke-width="2.3" stroke-linecap="round"/><circle cx="11" cy="16.2" r="1.7" fill="#7a4a00"/></g>`,
  user: `<g transform="translate(38 34)"><circle cx="11" cy="11" r="11" fill="#5aa2f0" stroke="#fff" stroke-width="1.5"/><circle cx="11" cy="8.4" r="3.5" fill="#fff"/><path d="M4.4 18.2c1.6-3.4 3.8-4.6 6.6-4.6s5 1.2 6.6 4.6" fill="#fff"/></g>`,
  pin: `<g transform="translate(42 10) rotate(28)"><rect x="4" y="0" width="5.2" height="10" rx="1.4" fill="url(#err)"/><circle cx="6.6" cy="12.4" r="4.2" fill="url(#err)"/><path d="M6.6 16.4v8" stroke="#9a1820" stroke-width="1.8" stroke-linecap="round"/></g>`,
}

const shortcut = `<g transform="translate(8 38)"><circle cx="12" cy="12" r="11" fill="#1a73e8" stroke="#fff" stroke-width="1.6"/><path d="M7.2 13.2h8.2M15.4 13.2l-3.2-3.2M15.4 13.2l-3.2 3.2" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></g>`

function pencil(tx = 40, ty = 18, rot = -38) {
  return `<g transform="translate(${tx} ${ty}) rotate(${rot})">
    <rect x="0" y="0" width="7" height="26" rx="1.4" fill="url(#orange)"/>
    <rect x="0" y="0" width="7" height="5" rx="1.4" fill="#e24b4b"/>
    <rect x="0" y="4.4" width="7" height="2.2" fill="#d5deea"/>
    <path d="M0 26h7l-3.5 8z" fill="#f3c7a0"/>
    <path d="M2.1 31.4h2.8L3.5 34z" fill="#2a3142"/>
  </g>`
}

function pen(tx = 42, ty = 16, rot = -40) {
  return `<g transform="translate(${tx} ${ty}) rotate(${rot})">
    <rect x="1.4" y="0" width="4.4" height="28" rx="2" fill="url(#gold)"/>
    <rect x="0" y="6" width="7.2" height="8" rx="1.6" fill="#2a3142"/>
    <path d="M1.4 28h4.4L3.6 36z" fill="#c5cedb"/>
    <path d="M2.6 33.2h2L3.6 36z" fill="#2a3142"/>
  </g>`
}

const icons = {
  'computer-blue': monitor({ screen: 'scrB' }),

  'computer-teal': monitor({ screen: 'scrT', kb: true }),

  'computer-tower': `
    <rect x="7" y="16" width="15" height="34" rx="3.2" fill="url(#metalD)"/>
    <rect x="9.2" y="19" width="10.6" height="6.2" rx="1.3" fill="url(#scrB)"/>
    <rect x="9.4" y="28" width="10.2" height="2" rx=".6" fill="#2a3142"/>
    <rect x="9.4" y="32" width="10.2" height="2" rx=".6" fill="#2a3142"/>
    <circle cx="14.5" cy="44.5" r="1.8" fill="#6bcf7a"/>
    <rect x="25" y="10" width="32" height="24" rx="4.6" fill="url(#bez)"/>
    <rect x="27.8" y="13" width="26.4" height="16" rx="2" fill="url(#scrB)"/>
    <rect x="27.8" y="13" width="26.4" height="6" rx="2" fill="url(#gloss)" opacity=".28"/>
    <rect x="38" y="34" width="6" height="5" rx="1" fill="url(#stand)"/>
    <rect x="32" y="39" width="18" height="3.2" rx="1.5" fill="url(#stand)"/>`,

  'computer-pc': `
    <rect x="12" y="7" width="40" height="26" rx="5" fill="url(#bez)"/>
    <rect x="15.4" y="10.2" width="33.2" height="17.6" rx="2.2" fill="url(#scrB)"/>
    <rect x="15.4" y="10.2" width="33.2" height="7" rx="2.2" fill="url(#gloss)" opacity=".28"/>
    <rect x="10" y="33.5" width="44" height="10.5" rx="2.6" fill="url(#metalD)"/>
    <circle cx="16.4" cy="38.8" r="1.6" fill="#6bcf7a"/>
    <rect x="22" y="36.8" width="20" height="3.4" rx="1" fill="#1c2230"/>
    <rect x="14" y="46.5" width="36" height="7" rx="1.7" fill="url(#keyb)"/>
    <g fill="#6b7688">${[0, 1, 2, 3, 4, 5, 6, 7]
      .map((i) => `<rect x="${16.4 + i * 3.7}" y="48.2" width="2.9" height="2.4" rx=".4"/>`)
      .join('')}</g>`,

  monitor: monitor({ screen: 'scrD' }),

  laptop: `
    <rect x="12" y="10" width="40" height="26" rx="3.4" fill="url(#bez)"/>
    <rect x="14.8" y="12.6" width="34.4" height="20.4" rx="2" fill="url(#scrB)"/>
    <rect x="14.8" y="12.6" width="34.4" height="8" rx="2" fill="url(#gloss)" opacity=".28"/>
    <path d="M8 36.4h48l2.6 11.2c.3 1.3-.7 2.5-2 2.5H7.4c-1.3 0-2.3-1.2-2-2.5L8 36.4z" fill="url(#metal)"/>
    <rect x="22" y="40.4" width="20" height="3.2" rx="1.4" fill="#c5cedb"/>`,

  'network-tree': `
    ${miniPC(21, 5, 1)}
    <path d="M32 25v6M32 31H18.5v5M32 31H45.5v5" stroke="#3d9ee8" stroke-width="2.2" stroke-linecap="round"/>
    ${miniPC(7.5, 36, 1)}
    ${miniPC(34.5, 36, 1)}`,

  'network-cable': `
    ${miniPC(6, 16, 1.15)}
    <path d="M32 28c6 0 6 10 0 10" stroke="#3d9ee8" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    ${miniPC(33, 16, 1.15)}`,

  'network-pair': `
    ${miniPC(7, 14, 1.15)}
    ${miniPC(32, 14, 1.15)}
    <path d="M18 42h28" stroke="#3d9ee8" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="18" cy="42" r="2.2" fill="#3d9ee8"/>
    <circle cx="46" cy="42" r="2.2" fill="#3d9ee8"/>`,

  'network-hub': `
    ${miniPC(8, 8, 1)}
    ${miniPC(34, 8, 1)}
    <path d="M19 28v6M45 28v6M32 40V34" stroke="#3d9ee8" stroke-width="2.1" stroke-linecap="round"/>
    <rect x="16" y="38" width="32" height="12" rx="3" fill="url(#metalD)"/>
    <g fill="#6bcf7a">${[0, 1, 2, 3, 4]
      .map((i) => `<circle cx="${22 + i * 5.2}" cy="44" r="1.5"/>`)
      .join('')}</g>`,

  'monitor-game': monitor({
    screen: 'scrD',
    extra: `<circle cx="27" cy="22" r="4.2" fill="url(#game)"/><rect x="33" y="19" width="10" height="3" rx="1" fill="#7eb6e0"/><rect x="33" y="24" width="7" height="3" rx="1" fill="#ff6b81"/>`,
  }),

  window: win({
    extra: `<g stroke="#9aa7b8" stroke-width="1.7" stroke-linecap="round" opacity=".5">
      <path d="M18 28h28"/><path d="M18 34h22"/><path d="M18 40h16"/>
    </g>`,
  }),

  'window-busy': win({
    extra: `<g transform="translate(22 24)">
      <path d="M10 0c4 0 8 3.2 8 8H2C2 3.2 6 0 10 0z" fill="url(#sand)"/>
      <path d="M10 20c4 0 8-3.2 8-8H2c0 4.8 4 8 8 8z" fill="url(#sand)"/>
      <rect x="1.2" y="7.2" width="17.6" height="2.4" rx="1" fill="url(#wood)"/>
    </g>`,
  }),

  'window-shortcut': win({ extra: shortcut }),

  'window-user': win({
    extra: `<circle cx="32" cy="32" r="8" fill="#5aa2f0"/><circle cx="32" cy="29.2" r="3.6" fill="#fff"/><path d="M24.6 42c1.8-5 4.6-7 7.4-7s5.6 2 7.4 7" fill="#5aa2f0"/>`,
  }),

  'window-display': win({
    extra: `<g>
      <rect x="18" y="28" width="10" height="10" rx="2.2" fill="#5aa2f0"/>
      <rect x="31" y="28" width="10" height="10" rx="2.2" fill="#ffd166"/>
      <rect x="18" y="40" width="10" height="7" rx="2.2" fill="#ff6b81"/>
      <rect x="31" y="40" width="10" height="7" rx="2.2" fill="#6bcf7a"/>
    </g>`,
  }),

  'windows-cascade': `
    <rect x="16" y="8" width="36" height="34" rx="8" fill="url(#wbg)"/>
    <path d="M16 16V16c0-4.4 3.6-8 8-8h20c4.4 0 8 3.6 8 8H16z" fill="url(#whd)"/>
    <circle cx="23" cy="14.4" r="1.7" fill="#ff6b6b"/>
    <rect x="10" y="18" width="36" height="34" rx="8" fill="url(#wbg)"/>
    <path d="M10 26V26c0-4.4 3.6-8 8-8h20c4.4 0 8 3.6 8 8H10z" fill="#7b1fa2"/>
    <circle cx="17" cy="24.4" r="1.7" fill="#ffd166"/>
    <circle cx="22.2" cy="24.4" r="1.7" fill="#6bcf7a"/>`,

  'folder-programs': folder({
    overlay: `<g transform="translate(22 30)">
      <rect x="0" y="0" width="14" height="12" rx="2.4" fill="url(#wbg)" stroke="#5aa2f0" stroke-width="1.2"/>
      <rect x="6" y="4" width="14" height="12" rx="2.4" fill="url(#whd)"/>
    </g>`,
  }),

  'window-error': win({ extra: badge.err.replace('translate(36 36)', 'translate(22 24)') }),

  'window-terminal': `
    <rect x="8" y="8" width="48" height="48" rx="14" fill="url(#wterm)"/>
    <rect x="8" y="8" width="48" height="18" rx="14" fill="url(#gloss)" opacity=".12"/>
    <text x="18" y="40" fill="#7ee0ff" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="18" font-weight="700">&gt;_</text>`,

  'computer-recovery': `
    <rect x="8" y="8" width="36" height="26" rx="5" fill="url(#bez)"/>
    <rect x="11.4" y="11.2" width="29.2" height="17.4" rx="2.2" fill="url(#scrB)"/>
    <rect x="11.4" y="11.2" width="29.2" height="7" rx="2.2" fill="url(#gloss)" opacity=".28"/>
    <rect x="22" y="34" width="6" height="5" rx="1" fill="url(#stand)"/>
    <rect x="15" y="39" width="20" height="3.2" rx="1.5" fill="url(#stand)"/>
    <rect x="30" y="28" width="24" height="24" rx="4" fill="url(#safe)"/>
    <circle cx="42" cy="40" r="7" fill="url(#metalD)"/>
    <circle cx="42" cy="40" r="2.5" fill="url(#gold)"/>
    <path d="M18 48c10 8 24 6 32-2" stroke="#e23d3d" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <path d="M46 42l8 4-3-8" fill="#e23d3d"/>`,

  server: `
    <rect x="10" y="12" width="44" height="40" rx="6" fill="url(#metalD)"/>
    <rect x="14" y="17" width="36" height="9" rx="2.2" fill="#2a3142"/>
    <rect x="14" y="29" width="36" height="9" rx="2.2" fill="#2a3142"/>
    <rect x="14" y="41" width="36" height="6" rx="2.2" fill="#2a3142"/>
    <g fill="#6bcf7a"><circle cx="18.5" cy="21.5" r="1.6"/><circle cx="18.5" cy="33.5" r="1.6"/></g>
    <g fill="#5aa2f0">${[0, 1, 2, 3, 4]
      .map((i) => `<rect x="${24 + i * 4.6}" y="20" width="3.2" height="3.2" rx=".6"/>`)
      .join('')}</g>
    <path d="M32 8v4" stroke="#3d9ee8" stroke-width="2.2" stroke-linecap="round"/>`,

  folder: folder(),

  'folder-open-papers': folder({ papers: true }),

  'folder-document': folder({
    overlay: `<rect x="24" y="28" width="16" height="20" rx="2.4" fill="url(#paper)" stroke="#c5cedb" stroke-width="1"/>
      <g stroke="#9aa7b8" stroke-width="1.2" stroke-linecap="round" opacity=".6">
        <path d="M27.5 34h9"/><path d="M27.5 38h9"/><path d="M27.5 42h6"/>
      </g>`,
  }),

  'folder-plain': `
    <rect x="10" y="18" width="44" height="32" rx="7" fill="url(#foldF)"/>
    ${hi('M10 18h44c0 0 0 10 0 10H10z')}
    <path d="M10 18h18c1.4 0 2.6.8 3.2 2L34 26" stroke="#fff" stroke-opacity=".3" stroke-width="1.2"/>`,

  'folder-shortcut': folder({ overlay: shortcut }),

  'folder-tools': folder({
    overlay: `<g transform="translate(20 30)">
      <rect x="2" y="4" width="6" height="16" rx="1.4" fill="url(#metal)"/>
      <rect x="0" y="0" width="10" height="7" rx="2" fill="url(#metalD)"/>
      <path d="M16 4l10 10M16 14L26 4" stroke="url(#gold)" stroke-width="3.2" stroke-linecap="round"/>
    </g>`,
  }),

  'folder-error': folder({ overlay: badge.err }),

  'folder-search': folder({ overlay: badge.search }),

  'folder-fonts': folder({
    overlay: `<text x="32" y="44" text-anchor="middle" fill="#fff" font-family="Georgia, serif" font-size="16" font-weight="700">Aa</text>`,
  }),

  'folder-network': `
    ${folder()}
    <path d="M18 54h28" stroke="#3d9ee8" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="18" cy="54" r="2.2" fill="#3d9ee8"/>
    <circle cx="46" cy="54" r="2.2" fill="#3d9ee8"/>
    <path d="M32 50v4" stroke="#3d9ee8" stroke-width="2.2"/>`,

  'server-offline': `
    <rect x="10" y="12" width="44" height="40" rx="6" fill="url(#metalD)"/>
    <rect x="14" y="17" width="36" height="9" rx="2.2" fill="#2a3142"/>
    <rect x="14" y="29" width="36" height="9" rx="2.2" fill="#2a3142"/>
    <rect x="14" y="41" width="36" height="6" rx="2.2" fill="#2a3142"/>
    <g fill="#ff6b73"><circle cx="18.5" cy="21.5" r="1.6"/><circle cx="18.5" cy="33.5" r="1.6"/></g>
    ${badge.err}`,

  'notepad-teal': `
    <rect x="14" y="8" width="36" height="48" rx="6" fill="url(#paper)"/>
    <rect x="14" y="8" width="36" height="14" rx="6" fill="url(#teal)"/>
    <rect x="14" y="16" width="36" height="6" fill="url(#teal)"/>
    <g fill="#e24b4b">${[0, 1, 2, 3]
      .map((i) => `<circle cx="${22 + i * 7}" cy="15" r="1.7"/>`)
      .join('')}</g>
    <g stroke="#9aa7b8" stroke-width="1.6" stroke-linecap="round" opacity=".5">
      <path d="M20 30h24"/><path d="M20 36h24"/><path d="M20 42h16"/>
    </g>`,

  notepad: `
    <rect x="15" y="8" width="36" height="48" rx="5.5" fill="url(#paper)"/>
    <g fill="#5aa2f0">${[0, 1, 2, 3, 4, 5]
      .map((i) => `<circle cx="15" cy="${16 + i * 6.4}" r="2.3"/>`)
      .join('')}</g>
    <g stroke="#9aa7b8" stroke-width="1.6" stroke-linecap="round" opacity=".5">
      <path d="M22 22h22"/><path d="M22 30h22"/><path d="M22 38h16"/>
    </g>`,

  'notepad-pencil': `
    <rect x="12" y="10" width="34" height="44" rx="5.5" fill="url(#paper)"/>
    <g fill="#5aa2f0">${[0, 1, 2, 3, 4]
      .map((i) => `<circle cx="12" cy="${18 + i * 6.6}" r="2.2"/>`)
      .join('')}</g>
    <g stroke="#9aa7b8" stroke-width="1.5" stroke-linecap="round" opacity=".5">
      <path d="M20 24h18"/><path d="M20 31h18"/><path d="M20 38h12"/>
    </g>
    ${pencil(42, 16)}`,

  'notepad-pen': `
    <rect x="12" y="10" width="34" height="44" rx="5.5" fill="url(#paper)"/>
    <g fill="#5aa2f0">${[0, 1, 2, 3, 4]
      .map((i) => `<circle cx="12" cy="${18 + i * 6.6}" r="2.2"/>`)
      .join('')}</g>
    <g stroke="#9aa7b8" stroke-width="1.5" stroke-linecap="round" opacity=".5">
      <path d="M20 24h18"/><path d="M20 31h18"/><path d="M20 38h12"/>
    </g>
    ${pen(44, 14)}`,

  document: doc(),

  'document-search': doc({ overlay: badge.search }),

  'document-error': doc({ overlay: badge.err }),

  'document-image': doc({
    lines: false,
    overlay: `<rect x="20" y="26" width="24" height="18" rx="3" fill="url(#sky)"/>
      <path d="M20 40l7-7 5 5 4-6 8 8v4H20z" fill="url(#land)"/>
      <circle cx="26.5" cy="32" r="2.4" fill="#ffe566"/>`,
  }),

  clipboard: `
    <rect x="16" y="12" width="32" height="44" rx="5" fill="url(#metal)"/>
    <rect x="19" y="18" width="26" height="34" rx="3" fill="url(#paper)"/>
    <rect x="23" y="7" width="18" height="10" rx="3" fill="url(#gold)"/>
    <rect x="27" y="10" width="10" height="4" rx="1.4" fill="#fff" opacity=".7"/>
    <g stroke="#9aa7b8" stroke-width="1.5" stroke-linecap="round" opacity=".5">
      <path d="M24 28h16"/><path d="M24 34h16"/><path d="M24 40h10"/>
    </g>`,

  'notes-pencil': `
    <rect x="10" y="12" width="36" height="42" rx="4" fill="url(#paper)"/>
    <g stroke="#9aa7b8" stroke-width="1.5" stroke-linecap="round" opacity=".5">
      <path d="M16 24h24"/><path d="M16 32h24"/><path d="M16 40h16"/>
    </g>
    ${pencil(40, 14, -32)}`,

  'note-write': `
    <g transform="rotate(-12 32 32)">
      <rect x="14" y="12" width="32" height="40" rx="4" fill="url(#paper)"/>
      <g stroke="#9aa7b8" stroke-width="1.4" stroke-linecap="round" opacity=".5">
        <path d="M20 24h20"/><path d="M20 31h16"/>
      </g>
    </g>
    ${pencil(38, 18, -28)}`,

  cd: disc(),

  'cd-flat': disc({ cy: 33, r: 23 }),

  'cd-video': disc({
    extra: `<g transform="translate(38 8)">
      <rect x="0" y="4" width="18" height="14" rx="2" fill="#2a3142"/>
      <rect x="2" y="0" width="4" height="20" rx="1" fill="#2a3142"/>
      <rect x="8" y="0" width="4" height="20" rx="1" fill="#2a3142"/>
      <rect x="14" y="0" width="4" height="20" rx="1" fill="#2a3142"/>
    </g>`,
  }),

  'cd-media': disc({
    extra: `<g transform="translate(40 38)"><circle cx="10" cy="10" r="11" fill="#1a73e8" stroke="#fff" stroke-width="1.5"/><path d="M7.4 5.8v8.4l7.2-4.2z" fill="#fff"/></g>`,
  }),

  'cd-music': disc({
    extra: `<g transform="translate(38 36)">
      <circle cx="12" cy="12" r="12" fill="url(#orange)"/>
      <path d="M10 7.2v10.2c0 2.2-1.6 3.4-3.4 3.4S3.2 19.6 3.2 17.6 4.8 14 6.6 14c.6 0 1.1.1 1.6.4V9.6L18 7.4v8.6c0 2.2-1.6 3.4-3.4 3.4s-3.4-1.4-3.4-3.4 1.6-3.6 3.4-3.6c.6 0 1.1.1 1.6.4V7.2L10 7.2z" fill="#fff"/>
    </g>`,
  }),

  'cd-drive': `
    <circle cx="32" cy="20" r="16" fill="url(#cd)"/>
    <circle cx="32" cy="20" r="11.5" fill="none" stroke="#7ee8c8" stroke-opacity=".35" stroke-width="2.4"/>
    <circle cx="32" cy="20" r="4.2" fill="url(#cdH)"/>
    <circle cx="32" cy="20" r="1.6" fill="#eef4fb"/>
    <rect x="8" y="24" width="48" height="28" rx="6" fill="url(#metalD)"/>
    <rect x="14" y="32" width="26" height="6" rx="1.6" fill="#1c2230"/>
    <circle cx="48" cy="35" r="2.3" fill="#6bcf7a"/>`,

  'cd-software-box': `
    <rect x="14" y="10" width="30" height="38" rx="4" fill="url(#purple)"/>
    <rect x="14" y="10" width="30" height="12" rx="4" fill="url(#gloss)" opacity=".25"/>
    <rect x="18" y="16" width="22" height="8" rx="2" fill="#fff" opacity=".25"/>
    ${disc({ cx: 40, cy: 42, r: 14 })}`,

  'cd-warning': disc({ extra: badge.warn }),

  'cd-error': disc({ extra: badge.err }),

  'cd-search': disc({ extra: badge.search }),

  speaker: `
    <rect x="10" y="22" width="16" height="20" rx="3" fill="url(#orange)"/>
    <path d="M26 22l16-10v40L26 42V22z" fill="url(#orange)"/>
    <path d="M46 24c4 4 4 12 0 16" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M50 20c7 6 7 18 0 24" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`,

  'mobile-phone': `
    <rect x="20" y="6" width="24" height="52" rx="6" fill="url(#phone)"/>
    <rect x="23" y="12" width="18" height="34" rx="2" fill="url(#scrB)"/>
    <rect x="23" y="12" width="18" height="10" rx="2" fill="url(#gloss)" opacity=".28"/>
    <circle cx="32" cy="51.5" r="2.4" fill="#c5cedb"/>`,

  'help-book': `
    <rect x="12" y="10" width="40" height="44" rx="5" fill="url(#bookP)"/>
    <rect x="16" y="10" width="6" height="44" fill="#4a1e8a" opacity=".35"/>
    <circle cx="36" cy="32" r="12" fill="#ffe566"/>
    <text x="36" y="38" text-anchor="middle" fill="#7a4a00" font-family="Georgia, serif" font-size="18" font-weight="700">?</text>`,

  clock: `
    <circle cx="32" cy="32" r="22" fill="url(#clockR)"/>
    <circle cx="32" cy="32" r="17.6" fill="#f7f9fc"/>
    <g stroke="#2a3142" stroke-width="1.6" stroke-linecap="round">
      <path d="M32 16.6v3.2"/><path d="M32 44.2v3.2"/><path d="M16.6 32h3.2"/><path d="M44.2 32h3.2"/>
    </g>
    <path d="M32 32v-10" stroke="#2a3142" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M32 32h8" stroke="#2a3142" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M32 32l6 9" stroke="#e23d3d" stroke-width="1.7" stroke-linecap="round"/>
    <circle cx="32" cy="32" r="2.2" fill="#2a3142"/>`,

  'document-user': doc({ overlay: badge.user }),

  'info-bubble': `
    <rect x="8" y="10" width="48" height="36" rx="14" fill="#3d9ee8"/>
    <path d="M22 46l-6 10 16-8" fill="#3d9ee8"/>
    <circle cx="32" cy="22" r="2.4" fill="#fff"/>
    <rect x="30" y="27" width="4.2" height="12" rx="2" fill="#fff"/>`,

  'document-video': doc({
    lines: false,
    overlay: `<g transform="translate(20 28)">
      <rect x="0" y="2" width="18" height="14" rx="3" fill="url(#metalD)"/>
      <path d="M18 6l8-3v12l-8-3z" fill="url(#metalD)"/>
      <circle cx="8" cy="9" r="2.4" fill="#ff6b73"/>
    </g>`,
  }),

  'document-pinned': doc({ overlay: badge.pin }),

  'paint-tools': `
    <circle cx="32" cy="32" r="22" fill="url(#orange)"/>
    <rect x="28" y="14" width="8" height="22" rx="2" fill="#fff" opacity=".92"/>
    <path d="M26 34h12l2 10H24z" fill="#fff" opacity=".92"/>
    <g transform="rotate(-40 44 40)">
      <rect x="38" y="18" width="6" height="24" rx="2" fill="#5aa2f0"/>
      <circle cx="41" cy="16" r="5" fill="#5aa2f0"/>
    </g>`,

  'mail-open': `
    <rect x="8" y="20" width="48" height="30" rx="6" fill="url(#mail)"/>
    <path d="M8 20l24 16 24-16" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" opacity=".7"/>
    <path d="M14 14h36l-18 14z" fill="#f4f8ff"/>
    <rect x="18" y="10" width="28" height="16" rx="2" fill="#fff"/>`,

  bookshelf: `
    <rect x="10" y="12" width="44" height="40" rx="4" fill="url(#wood)"/>
    <rect x="13" y="16" width="8" height="28" rx="1.4" fill="#5aa2f0"/>
    <rect x="22" y="16" width="7" height="28" rx="1.4" fill="#e23d3d"/>
    <rect x="30" y="16" width="9" height="28" rx="1.4" fill="#ffd166"/>
    <rect x="40" y="16" width="7" height="28" rx="1.4" fill="#6bcf7a"/>
    <rect x="48" y="16" width="4" height="28" rx="1.2" fill="#c9a6ff"/>
    <rect x="10" y="44" width="44" height="8" rx="2" fill="#8a5a32"/>`,

  microphone: `
    <rect x="24" y="8" width="16" height="28" rx="8" fill="url(#metal)"/>
    <rect x="27" y="12" width="10" height="20" rx="5" fill="#c5cedb"/>
    <path d="M20 28c0 6.6 5.4 12 12 12s12-5.4 12-12" fill="none" stroke="#2a3142" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M32 40v8" stroke="#2a3142" stroke-width="2.6" stroke-linecap="round"/>
    <rect x="22" y="48" width="20" height="5" rx="2.4" fill="url(#metalD)"/>`,

  globe: `
    <circle cx="32" cy="32" r="22" fill="url(#ocean)"/>
    <path d="M18 24c4-6 10-8 16-6 3 1 4 4 2 7-3 4 2 6 6 5 4-1 8 3 6 8-2 4-8 6-14 5-8-1-14-6-16-13z" fill="url(#land)"/>
    <path d="M22 42c4 2 10 3 16 1 3-1 6 1 5 4-4 3-12 4-20 1z" fill="url(#land)" opacity=".9"/>
    <ellipse cx="24" cy="22" rx="8" ry="5" fill="#fff" opacity=".22"/>
    <circle cx="32" cy="32" r="22" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="1.5"/>`,

  'globe-search': `
    <circle cx="28" cy="28" r="18" fill="url(#ocean)"/>
    <path d="M16 22c3-5 8-7 13-5 2 .8 3 3 1.6 5.6-2.4 3.2 1.6 5 5 4.2 3-.8 6.4 2.4 4.8 6.4-1.6 3.2-6.4 4.8-11.2 4-6.4-.8-11.2-4.8-13.2-10.4z" fill="url(#land)"/>
    <ellipse cx="22" cy="20" rx="6" ry="4" fill="#fff" opacity=".22"/>
    ${badge.search}`,

  lightbulb: `
    <path d="M32 8c-9 0-16 7.2-16 16 0 5.4 2.8 10.2 7.2 13.2V42h17.6v-4.8C45.2 34.2 48 29.4 48 24c0-8.8-7-16-16-16z" fill="url(#gold)"/>
    <rect x="24.4" y="41" width="15.2" height="6" rx="1.6" fill="url(#metal)"/>
    <rect x="26.4" y="47" width="11.2" height="4.4" rx="1.4" fill="url(#metalD)"/>
    <path d="M32 14v8" stroke="#7a4a00" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="32" cy="26" r="2.2" fill="#7a4a00"/>`,

  checklist: `
    <rect x="12" y="8" width="40" height="48" rx="6" fill="url(#paper)"/>
    <g>
      <rect x="18" y="18" width="8" height="8" rx="2" fill="url(#ok)"/>
      <path d="M19.6 22.2l2.2 2.2 4.4-4.6" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M30 22h16" stroke="#9aa7b8" stroke-width="2" stroke-linecap="round"/>
      <rect x="18" y="30" width="8" height="8" rx="2" fill="url(#ok)"/>
      <path d="M19.6 34.2l2.2 2.2 4.4-4.6" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M30 34h16" stroke="#9aa7b8" stroke-width="2" stroke-linecap="round"/>
      <rect x="18" y="42" width="8" height="8" rx="2" fill="#e4ecf5" stroke="#9aa7b8"/>
      <path d="M30 46h12" stroke="#9aa7b8" stroke-width="2" stroke-linecap="round"/>
    </g>`,

  tree: `
    <rect x="28" y="40" width="8" height="14" rx="2" fill="url(#wood)"/>
    <circle cx="32" cy="22" r="14" fill="url(#leaf)"/>
    <circle cx="22" cy="28" r="10" fill="url(#leaf)"/>
    <circle cx="42" cy="28" r="10" fill="url(#leaf)"/>
    <ellipse cx="26" cy="18" rx="5" ry="3" fill="#fff" opacity=".25"/>`,

  safe: `
    <rect x="12" y="12" width="40" height="40" rx="6" fill="url(#safe)"/>
    <rect x="16" y="16" width="32" height="32" rx="4" fill="url(#metalD)"/>
    <circle cx="32" cy="32" r="10" fill="url(#metal)"/>
    <circle cx="32" cy="32" r="4" fill="url(#gold)"/>
    <path d="M32 22v4M32 38v4M22 32h4M38 32h4" stroke="#6b7688" stroke-width="2" stroke-linecap="round"/>`,

  'mail-sync': `
    <rect x="8" y="18" width="48" height="30" rx="6" fill="url(#mail)"/>
    <path d="M8 18l24 16 24-16" fill="none" stroke="#fff" stroke-width="2.4" opacity=".75"/>
    <path d="M18 12c-6 4-6 14 0 16" fill="none" stroke="#e23d3d" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M14 14l4-4 3 5" fill="#e23d3d"/>
    <path d="M46 44c6-4 6-14 0-16" fill="none" stroke="#e23d3d" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M50 42l-4 4-3-5" fill="#e23d3d"/>`,

  joystick: `
    <rect x="14" y="34" width="36" height="18" rx="6" fill="url(#metalD)"/>
    <circle cx="24" cy="43" r="4.4" fill="#ff6b81"/>
    <circle cx="34" cy="43" r="3.2" fill="#7eb6e0"/>
    <circle cx="42" cy="43" r="3.2" fill="#ffd166"/>
    <rect x="28" y="14" width="8" height="22" rx="3" fill="url(#metal)"/>
    <circle cx="32" cy="14" r="7" fill="#3d9ee8"/>
    <circle cx="32" cy="14" r="3.2" fill="#fff" opacity=".4"/>`,

  mail: `
    <rect x="8" y="16" width="48" height="32" rx="6" fill="url(#mail)"/>
    <path d="M8 16l24 18 24-18" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M8 48l16-14M56 48L40 34" stroke="#fff" stroke-width="2" opacity=".45" stroke-linecap="round"/>`,

  chip: `
    <rect x="16" y="16" width="32" height="32" rx="6" fill="url(#chip)"/>
    <rect x="21" y="21" width="22" height="22" rx="3" fill="#1c2230"/>
    <rect x="24" y="24" width="16" height="16" rx="2" fill="url(#gold)"/>
    ${[0, 1, 2, 3]
      .map(
        (i) =>
          `<rect x="${22 + i * 6}" y="10" width="3" height="7" rx=".6" fill="url(#gold)"/><rect x="${22 + i * 6}" y="47" width="3" height="7" rx=".6" fill="url(#gold)"/><rect x="10" y="${22 + i * 6}" width="7" height="3" rx=".6" fill="url(#gold)"/><rect x="47" y="${22 + i * 6}" width="7" height="3" rx=".6" fill="url(#gold)"/>`,
      )
      .join('')}`,

  'book-open': `
    <path d="M8 16c8 0 12 2 24 2v34c-12 0-16-2-24-2V16z" fill="url(#paper)"/>
    <path d="M56 16c-8 0-12 2-24 2v34c12 0 16-2 24-2V16z" fill="url(#paper)"/>
    <path d="M32 18v34" stroke="#c5cedb" stroke-width="1.6"/>
    <path d="M8 16c8 0 12 2 24 2 12 0 16-2 24-2" stroke="url(#bookP)" stroke-width="4" fill="none"/>
    <g stroke="#9aa7b8" stroke-width="1.3" opacity=".45">
      <path d="M14 26h12"/><path d="M14 32h12"/><path d="M38 26h12"/><path d="M38 32h12"/>
    </g>`,

  printer: `
    <rect x="18" y="8" width="28" height="14" rx="3" fill="url(#metal)"/>
    <rect x="10" y="20" width="44" height="22" rx="5" fill="url(#metalD)"/>
    <rect x="18" y="34" width="28" height="18" rx="2.4" fill="url(#paper)"/>
    <g stroke="#9aa7b8" stroke-width="1.4" opacity=".5">
      <path d="M22 40h20"/><path d="M22 45h16"/>
    </g>
    <circle cx="16" cy="28" r="2" fill="#6bcf7a"/>
    <rect x="40" y="25" width="8" height="4" rx="1" fill="#5aa2f0"/>`,

  calendar: `
    <rect x="10" y="10" width="44" height="44" rx="10" fill="url(#paper)"/>
    <path d="M10 24V20c0-5.5 4.5-10 10-10h24c5.5 0 10 4.5 10 10v4H10z" fill="url(#calR)"/>
    <rect x="18" y="8" width="5" height="8" rx="2.4" fill="#c5cedb"/>
    <rect x="41" y="8" width="5" height="8" rx="2.4" fill="#c5cedb"/>
    <text x="32" y="46" text-anchor="middle" fill="#c81e28" font-family="ui-sans-serif, system-ui, sans-serif" font-size="20" font-weight="800">16</text>`,

  'filing-cabinet': `
    <rect x="14" y="8" width="36" height="48" rx="5" fill="url(#cab)"/>
    <rect x="18" y="14" width="28" height="16" rx="3" fill="#fff" opacity=".35"/>
    <rect x="18" y="34" width="28" height="16" rx="3" fill="#fff" opacity=".35"/>
    <rect x="28" y="19" width="8" height="4" rx="1.4" fill="#8a5a32"/>
    <rect x="28" y="39" width="8" height="4" rx="1.4" fill="#8a5a32"/>`,

  cassette: `
    <rect x="8" y="18" width="48" height="28" rx="6" fill="url(#metalD)"/>
    <rect x="12" y="22" width="40" height="20" rx="3" fill="#1c2230"/>
    <circle cx="22" cy="32" r="6" fill="url(#metal)"/>
    <circle cx="42" cy="32" r="6" fill="url(#metal)"/>
    <circle cx="22" cy="32" r="2.2" fill="#2a3142"/>
    <circle cx="42" cy="32" r="2.2" fill="#2a3142"/>
    <rect x="24" y="30" width="16" height="4" rx="1" fill="#6b7688"/>`,

  'calculator-notes': `
    <rect x="10" y="10" width="28" height="42" rx="6" fill="url(#calc)"/>
    <rect x="14" y="14" width="20" height="10" rx="2" fill="#9ed8ff" opacity=".35"/>
    <g fill="#fff" opacity=".8">
      <rect x="14" y="28" width="8" height="6" rx="1.2"/>
      <rect x="26" y="28" width="8" height="6" rx="1.2"/>
      <rect x="14" y="38" width="8" height="6" rx="1.2"/>
      <rect x="26" y="38" width="8" height="6" rx="1.2"/>
    </g>
    ${pencil(42, 14, -30)}
    <rect x="36" y="36" width="18" height="16" rx="2" fill="url(#paper)"/>`,

  calculator: `
    <rect x="12" y="8" width="40" height="48" rx="10" fill="url(#calc)"/>
    <rect x="12" y="8" width="40" height="16" rx="10" fill="url(#gloss)" opacity=".12"/>
    <g fill="#fff" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">
      <rect x="16" y="16" width="14" height="14" rx="3" fill="#1a73e8"/>
      <text x="23" y="26" fill="#fff">+</text>
      <rect x="34" y="16" width="14" height="14" rx="3" fill="#5aa2f0"/>
      <text x="41" y="26" fill="#fff">−</text>
      <rect x="16" y="34" width="14" height="14" rx="3" fill="#7ec8ff"/>
      <text x="23" y="44" fill="#1a3a6e">×</text>
      <rect x="34" y="34" width="14" height="14" rx="3" fill="#c5cedb"/>
      <text x="41" y="44" fill="#1a3a6e">=</text>
    </g>`,

  floppy: `
    <rect x="12" y="10" width="40" height="44" rx="6" fill="url(#floppy)"/>
    <rect x="18" y="10" width="20" height="14" rx="2" fill="#c5cedb"/>
    <rect x="22" y="13" width="8" height="8" rx="1.2" fill="#2a3142"/>
    <rect x="18" y="30" width="28" height="18" rx="3" fill="#f4f8ff"/>
    <path d="M44 10l8 8v4h-8V10z" fill="#2b78d4"/>`,

  'battery-full': `
    <rect x="10" y="20" width="40" height="24" rx="5" fill="url(#metal)"/>
    <rect x="50" y="26" width="5" height="12" rx="2" fill="url(#metalD)"/>
    <rect x="14" y="24" width="32" height="16" rx="3" fill="url(#batG)"/>`,

  'battery-half': `
    <rect x="10" y="20" width="40" height="24" rx="5" fill="url(#metal)"/>
    <rect x="50" y="26" width="5" height="12" rx="2" fill="url(#metalD)"/>
    <rect x="14" y="24" width="16" height="16" rx="3" fill="url(#batY)"/>`,

  'battery-low': `
    <rect x="10" y="20" width="40" height="24" rx="5" fill="url(#metal)"/>
    <rect x="50" y="26" width="5" height="12" rx="2" fill="url(#metalD)"/>
    <rect x="14" y="24" width="8" height="16" rx="3" fill="url(#batR)"/>
    <path d="M32 24v8" stroke="#c81e28" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="32" cy="36.4" r="1.5" fill="#c81e28"/>`,

  plug: `
    <rect x="22" y="8" width="8" height="14" rx="2" fill="url(#metal)"/>
    <rect x="34" y="8" width="8" height="14" rx="2" fill="url(#metal)"/>
    <path d="M16 20h32c0 12-6 18-16 22v10H32V42C22 38 16 32 16 20z" fill="url(#metalD)"/>
    <circle cx="26" cy="28" r="2" fill="#c5cedb"/>
    <circle cx="38" cy="28" r="2" fill="#c5cedb"/>`,

  'document-web': doc({
    overlay: `<g transform="translate(34 32)"><circle cx="12" cy="12" r="11" fill="url(#ocean)" stroke="#fff" stroke-width="1.4"/><path d="M6 12h12M12 6c3 2 4 8 0 12  -4-4-3-10 0-12z" stroke="#fff" stroke-width="1.4" fill="none"/></g>`,
  }),

  'document-warning': doc({ overlay: badge.warn }),

  'document-alert': doc({
    overlay: `<g transform="translate(36 34)"><circle cx="12" cy="12" r="11" fill="url(#err)" stroke="#fff" stroke-width="1.6"/><path d="M12 6.4v8" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="17.6" r="1.4" fill="#fff"/></g>`,
  }),

  'document-locked': doc({ overlay: badge.lock }),

  'font-truetype': doc({
    lines: false,
    overlay: `<text x="32" y="42" text-anchor="middle" fill="#1a73e8" font-family="Georgia, serif" font-size="26" font-weight="700">T</text>`,
  }),

  'font-file': doc({
    lines: false,
    overlay: `<text x="32" y="42" text-anchor="middle" fill="#c81e28" font-family="Georgia, serif" font-size="26" font-weight="700">A</text>`,
  }),

  'data-nodes': `
    <circle cx="18" cy="20" r="8" fill="#5aa2f0"/>
    <circle cx="46" cy="18" r="7" fill="#6bcf7a"/>
    <circle cx="32" cy="40" r="10" fill="#c9a6ff"/>
    <circle cx="16" cy="46" r="6" fill="#ffd166"/>
    <path d="M24 24l6 10M40 22l-6 12M22 44h4" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
    <circle cx="18" cy="20" r="3" fill="#fff" opacity=".5"/>
    <circle cx="46" cy="18" r="2.6" fill="#fff" opacity=".5"/>
    <circle cx="32" cy="40" r="3.4" fill="#fff" opacity=".45"/>`,

  'floppy-drive': `
    <rect x="8" y="16" width="48" height="32" rx="6" fill="url(#metalD)"/>
    <rect x="12" y="22" width="28" height="8" rx="2" fill="#1c2230"/>
    <g transform="translate(34 10) scale(.55)">
      <rect x="12" y="10" width="40" height="44" rx="6" fill="url(#floppy)"/>
      <rect x="18" y="10" width="20" height="14" rx="2" fill="#c5cedb"/>
      <rect x="18" y="30" width="28" height="18" rx="3" fill="#f4f8ff"/>
    </g>
    <circle cx="48" cy="40" r="2.2" fill="#6bcf7a"/>`,

  smiley: `
    <circle cx="32" cy="32" r="22" fill="url(#smile)"/>
    <circle cx="24" cy="26" r="3.2" fill="#2a3142"/>
    <circle cx="40" cy="26" r="3.2" fill="#2a3142"/>
    <path d="M22 38c3.4 6 16.6 6 20 0" fill="none" stroke="#2a3142" stroke-width="2.8" stroke-linecap="round"/>`,

  error: `
    <circle cx="32" cy="32" r="22" fill="url(#err)"/>
    <path d="M23 23l18 18M41 23L23 41" stroke="#fff" stroke-width="4.4" stroke-linecap="round"/>`,

  forbidden: `
    <circle cx="32" cy="32" r="22" fill="url(#err)"/>
    <circle cx="32" cy="32" r="16" fill="none" stroke="#fff" stroke-width="4"/>
    <path d="M21 43L43 21" stroke="#fff" stroke-width="4.2" stroke-linecap="round"/>`,

  'hard-drive-external': `
    <rect x="10" y="18" width="36" height="28" rx="6" fill="url(#hdd)"/>
    <rect x="14" y="22" width="28" height="8" rx="2" fill="#2a3142"/>
    <circle cx="18" cy="38" r="2.2" fill="#6bcf7a"/>
    <path d="M46 32h8" stroke="url(#metal)" stroke-width="3" stroke-linecap="round"/>
    <rect x="52" y="28" width="6" height="8" rx="2" fill="url(#metal)"/>`,

  'documents-stack': `
    <rect x="18" y="10" width="30" height="38" rx="4" fill="#d5deea" transform="rotate(8 33 29)"/>
    <rect x="16" y="12" width="30" height="38" rx="4" fill="#e8eef6" transform="rotate(3 31 31)"/>
    <rect x="12" y="14" width="32" height="40" rx="4.5" fill="url(#paper)"/>
    <g stroke="#9aa7b8" stroke-width="1.5" opacity=".5" stroke-linecap="round">
      <path d="M18 28h20"/><path d="M18 34h20"/><path d="M18 40h12"/>
    </g>`,

  keyboard: `
    <rect x="6" y="18" width="52" height="28" rx="6" fill="url(#keyb)"/>
    <g fill="#6b7688">${Array.from({ length: 4 }, (_, r) =>
      Array.from({ length: 11 }, (_, c) => `<rect x="${10 + c * 4.2}" y="${23 + r * 5.2}" width="3.4" height="3.6" rx=".7"/>`).join(''),
    ).join('')}</g>`,

  mouse: `
    <rect x="20" y="10" width="24" height="44" rx="12" fill="url(#metal)"/>
    <path d="M32 10v16" stroke="#6b7688" stroke-width="1.8"/>
    <path d="M20 26h24" stroke="#6b7688" stroke-width="1.6"/>
    <rect x="20" y="10" width="24" height="12" rx="12" fill="url(#gloss)" opacity=".35"/>`,

  'chat-bubble': `
    <rect x="8" y="10" width="48" height="32" rx="12" fill="#5ad4c8"/>
    <path d="M20 42l-6 12 16-10" fill="#5ad4c8"/>
    <g stroke="#0b3d3a" stroke-width="2.4" stroke-linecap="round">
      <path d="M18 22h28"/><path d="M18 30h20"/>
    </g>`,

  'hard-drive': `
    <rect x="10" y="16" width="44" height="32" rx="7" fill="url(#hdd)"/>
    <rect x="14" y="21" width="36" height="10" rx="2.4" fill="#2a3142"/>
    <circle cx="18" cy="40" r="2.4" fill="#6bcf7a"/>
    <rect x="24" y="38" width="22" height="4" rx="1.4" fill="#3a4456"/>`,

  scroll: `
    <rect x="18" y="10" width="28" height="44" rx="4" fill="url(#paper)"/>
    <rect x="14" y="8" width="36" height="10" rx="5" fill="url(#wood)"/>
    <rect x="14" y="46" width="36" height="10" rx="5" fill="url(#wood)"/>
    <g stroke="#9aa7b8" stroke-width="1.5" opacity=".5" stroke-linecap="round">
      <path d="M24 24h16"/><path d="M24 30h16"/><path d="M24 36h12"/>
    </g>`,

  'hand-pointer': `
    <path d="M26 8c2.4 0 4 1.8 4 4.4V24l8-6c2-1.6 5-.4 5.2 2.2L42 36c2.2-.4 4.4.8 4.6 3.2l.4 6.4c.2 3.4-2.2 6.4-5.6 6.4H24c-6 0-10-4.2-11.4-10L10 30c-.6-2.2 1-4.4 3.4-4.4 1.4 0 2.6.8 3.2 2l3.4 6.4V12.4C20 9.8 22 8 24.4 8H26z" fill="#f4f8ff" stroke="#2a3142" stroke-width="2" stroke-linejoin="round"/>`,

  'cursor-arrow': `
    <path d="M16 10l28 18-12 2 8 16-8 4-8-16-10 8z" fill="#f4f8ff" stroke="#2a3142" stroke-width="2.2" stroke-linejoin="round"/>`,

  'circuit-board': `
    <rect x="8" y="12" width="48" height="40" rx="6" fill="url(#pcb)"/>
    <rect x="8" y="12" width="48" height="12" rx="6" fill="url(#gold)" opacity=".85"/>
    <g fill="#0b3d24" opacity=".55">
      <rect x="14" y="30" width="12" height="8" rx="1.5"/>
      <rect x="30" y="30" width="8" height="8" rx="1.5"/>
      <rect x="42" y="30" width="10" height="14" rx="1.5"/>
    </g>
    <g stroke="#0b3d24" stroke-width="1.8" opacity=".45">
      <path d="M20 38v8"/><path d="M34 38v8"/><path d="M20 46h14"/>
    </g>
    <g fill="#ffe08a">${[0, 1, 2, 3, 4, 5]
      .map((i) => `<rect x="${12 + i * 7}" y="14" width="4" height="8" rx=".6"/>`)
      .join('')}</g>`,

  hourglass: `
    <rect x="18" y="8" width="28" height="6" rx="2" fill="url(#wood)"/>
    <rect x="18" y="50" width="28" height="6" rx="2" fill="url(#wood)"/>
    <path d="M22 14c0 8 10 12 10 18S22 42 22 50h20c0-8-10-12-10-18s10-10 10-18H22z" fill="#c5e8ff" opacity=".55" stroke="#7eb6e0" stroke-width="1.6"/>
    <path d="M24 16c2.4 6 8 8 8 14" fill="none"/>
    <path d="M24 16h16c-2 6-7 9-8 14-1-5-6-8-8-14z" fill="url(#sand)"/>
    <path d="M28 48h8c-1-4-3-6-4-10-1 4-3 6-4 10z" fill="url(#sand)"/>`,
}

const names = Object.keys(icons)
if (names.length !== 110) {
  console.error(`Expected 110 icons, got ${names.length}`)
  process.exit(1)
}

for (const [name, body] of Object.entries(icons)) {
  writeFileSync(join(outDir, `${name}.svg`), svg(body))
}

console.log(`Wrote ${names.length} icons to ${outDir}`)
