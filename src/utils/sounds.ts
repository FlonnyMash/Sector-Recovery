import type { OsEnvironment } from '../types/game'

export type SoundTheme = 'modern' | 'retro'
export type SoundEvent =
  | 'notification'
  | 'message'
  | 'error'
  | 'windowOpen'
  | 'windowClose'
  | 'powerOn'
  | 'startup'
  | 'click'
  | 'typing'

const POST_BEEP_SRC = '/sounds/post-beep.mp3'
const CLICK_SRC = '/sounds/click.wav'
const TYPING_SRC = '/sounds/typing.wav'

export const SOUND_SOURCES: Record<SoundTheme, Record<SoundEvent, string | null>> = {
  modern: {
    notification: null, // modern: soft ping
    message: null, // modern: soft message pop
    error: null, // modern: muted thud
    windowOpen: null, // modern: light whoosh
    windowClose: null, // modern: soft close
    powerOn: POST_BEEP_SRC, // shared: motherboard POST beep
    startup: null, // modern: warm pad chord
    click: CLICK_SRC, // shared UI click
    typing: TYPING_SRC, // login password auto-fill (whole sequence)
  },
  retro: {
    notification: null, // retro: balloon ding
    message: null, // retro: MSN nudge-lite
    error: null, // retro: 2011 critical-stop
    windowOpen: null, // retro: aero open
    windowClose: null, // retro: aero close
    powerOn: POST_BEEP_SRC, // shared: motherboard POST beep
    startup: null, // retro: 2011 logon arpeggio
    click: CLICK_SRC, // shared UI click
    typing: TYPING_SRC, // login password auto-fill (whole sequence)
  },
}

/** Playback gain for file-backed sounds (may exceed 1). Unlisted events play at 1. */
const SOUND_VOLUMES: Partial<Record<SoundEvent, number>> = {
  powerOn: 0.3,
  click: 0.8,
  typing: 2.4, // recording is quiet; final key peaks at 0.36
}

// One-shot sounds that must not fire late: if the context is still locked
// (no user gesture yet) when they are requested, they are skipped rather than
// queued behind the eventual resume().
const ONE_SHOT_GRACE_MS = 400

let audioContext: AudioContext | null = null
let unlockBound = false

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext
  if (!Ctor) return null
  if (!audioContext) audioContext = new Ctor()
  return audioContext
}

export function unlockAudio() {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  decodeFileSounds(ctx)
}

function bindAudioUnlock() {
  if (unlockBound || typeof window === 'undefined') return
  unlockBound = true
  const unlock = () => unlockAudio()
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
}

bindAudioUnlock()

export function soundThemeForOs(os: OsEnvironment): SoundTheme {
  return os === 'host_os' ? 'modern' : 'retro'
}

// File-backed sounds are fetched up front and decoded into AudioBuffers so
// playback is sample-accurate and immediate. Creating a fresh Audio() at
// play time can lag by seconds, and HTMLAudioElement is unreliable with
// very short clips.
const fileBytes = new Map<string, Promise<ArrayBuffer | null>>()
const decodedBuffers = new Map<string, Promise<AudioBuffer | null>>()

function fetchFileBytes(src: string): Promise<ArrayBuffer | null> {
  let pending = fileBytes.get(src)
  if (!pending) {
    pending = fetch(src)
      .then((response) => (response.ok ? response.arrayBuffer() : null))
      .catch(() => null)
    fileBytes.set(src, pending)
  }
  return pending
}

function getDecodedBuffer(audio: AudioContext, src: string): Promise<AudioBuffer | null> {
  let pending = decodedBuffers.get(src)
  if (!pending) {
    pending = fetchFileBytes(src)
      .then((bytes) => (bytes ? audio.decodeAudioData(bytes.slice(0)) : null))
      .catch(() => null)
    decodedBuffers.set(src, pending)
  }
  return pending
}

function allFileSources(): string[] {
  const sources = new Set<string>()
  for (const theme of Object.values(SOUND_SOURCES)) {
    for (const src of Object.values(theme)) {
      if (src) sources.add(src)
    }
  }
  return [...sources]
}

function preloadFileSounds() {
  if (typeof window === 'undefined') return
  for (const src of allFileSources()) void fetchFileBytes(src)
}

/** Decode every file-backed sound once the context exists (first gesture). */
function decodeFileSounds(audio: AudioContext) {
  for (const src of allFileSources()) void getDecodedBuffer(audio, src)
}

preloadFileSounds()

function playBuffer(audio: AudioContext, buffer: AudioBuffer, gain: number) {
  const source = audio.createBufferSource()
  source.buffer = buffer
  const level = audio.createGain()
  level.gain.value = gain
  source.connect(level)
  level.connect(audio.destination)
  source.start()
}

/** Last-resort path when Web Audio decoding fails: a plain media element. */
function playFileFallback(src: string, volume: number) {
  const audio = new Audio(src)
  audio.volume = Math.min(1, volume)
  void audio.play().catch(() => {})
}

function playFileSound(src: string, gain: number) {
  runWhenReady((audio) => {
    void getDecodedBuffer(audio, src).then((buffer) => {
      if (buffer) playBuffer(audio, buffer, gain)
      else playFileFallback(src, gain)
    })
  })
}

export function playSound(theme: SoundTheme, event: SoundEvent) {
  unlockAudio()
  const src = SOUND_SOURCES[theme][event]
  if (src) {
    playFileSound(src, SOUND_VOLUMES[event] ?? 1)
    return
  }

  switch (event) {
    case 'notification':
    case 'message':
      playGeneratedAlert(theme, event)
      return
    case 'powerOn':
      runWhenReady(playPowerOnBeep)
      return
    case 'startup':
      runWhenReady((audio) =>
        theme === 'modern' ? playModernStartup(audio) : playRetroStartup(audio),
      )
      return
    case 'click':
      runWhenReady(playClick)
      return
    case 'typing':
      runWhenReady(playKeyTap)
      return
    default:
      return
  }
}

function runWhenReady(fn: (audio: AudioContext) => void) {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'running') {
    fn(ctx)
    return
  }
  const requested = performance.now()
  void ctx
    .resume()
    .then(() => {
      if (performance.now() - requested <= ONE_SHOT_GRACE_MS) fn(ctx)
    })
    .catch(() => {})
}

function makeMaster(audio: AudioContext, level: number, at: number) {
  const master = audio.createGain()
  master.gain.setValueAtTime(level, at)
  master.connect(audio.destination)
  return master
}

interface ToneOptions {
  type?: OscillatorType
  attack?: number
  peak?: number
  glideTo?: number
}

function playTone(
  audio: AudioContext,
  out: AudioNode,
  frequency: number,
  at: number,
  duration: number,
  { type = 'sine', attack = 0.01, peak = 1, glideTo }: ToneOptions = {},
) {
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, at)
  if (glideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(glideTo, at + duration)
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.linearRampToValueAtTime(peak, at + Math.min(attack, duration * 0.5))
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
  osc.connect(gain)
  gain.connect(out)
  osc.start(at)
  osc.stop(at + duration + 0.03)
}

let noiseBuffer: AudioBuffer | null = null

function getNoiseBuffer(audio: AudioContext) {
  if (noiseBuffer && noiseBuffer.sampleRate === audio.sampleRate) return noiseBuffer
  const length = Math.floor(audio.sampleRate * 0.5)
  const buffer = audio.createBuffer(1, length, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
  noiseBuffer = buffer
  return buffer
}

function playNoise(
  audio: AudioContext,
  out: AudioNode,
  at: number,
  duration: number,
  filter: { type: BiquadFilterType; frequency: number; q?: number; sweepTo?: number },
  peak = 1,
) {
  const source = audio.createBufferSource()
  source.buffer = getNoiseBuffer(audio)
  const biquad = audio.createBiquadFilter()
  biquad.type = filter.type
  biquad.frequency.setValueAtTime(filter.frequency, at)
  if (filter.sweepTo !== undefined) {
    biquad.frequency.exponentialRampToValueAtTime(filter.sweepTo, at + duration)
  }
  biquad.Q.value = filter.q ?? 1
  const gain = audio.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.linearRampToValueAtTime(peak, at + Math.min(0.004, duration * 0.3))
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
  source.connect(biquad)
  biquad.connect(gain)
  gain.connect(out)
  source.start(at)
  source.stop(at + duration + 0.03)
}

// --- Boot sequence -----------------------------------------------------------

/** Single PC-speaker POST beep as the motherboard splash appears. */
function playPowerOnBeep(audio: AudioContext) {
  const now = audio.currentTime
  const master = makeMaster(audio, 0.07, now)
  playTone(audio, master, 1000, now, 0.22, { type: 'square', attack: 0.003 })
}

/** Modern host OS: warm, slow-attack pad chord (C-E-G with an octave shimmer). */
function playModernStartup(audio: AudioContext) {
  const now = audio.currentTime
  const master = makeMaster(audio, 0.2, now)
  const notes: Array<[number, number]> = [
    [523.25, 0],
    [659.25, 0.14],
    [783.99, 0.28],
    [1046.5, 0.46],
  ]
  for (const [frequency, offset] of notes) {
    playTone(audio, master, frequency, now + offset, 1.7, { type: 'sine', attack: 0.12, peak: 0.8 })
    playTone(audio, master, frequency * 2, now + offset + 0.05, 1.2, {
      type: 'sine',
      attack: 0.2,
      peak: 0.12,
    })
  }
  playTone(audio, master, 130.81, now, 2.1, { type: 'triangle', attack: 0.3, peak: 0.45 })
}

/** Retro target OS: bright 2011-style logon arpeggio with a sustained fifth. */
function playRetroStartup(audio: AudioContext) {
  const now = audio.currentTime
  const master = makeMaster(audio, 0.19, now)
  const notes: Array<[number, number, number]> = [
    [392.0, 0, 0.55],
    [523.25, 0.17, 0.55],
    [659.25, 0.34, 0.6],
    [783.99, 0.51, 1.3],
  ]
  for (const [frequency, offset, duration] of notes) {
    playTone(audio, master, frequency, now + offset, duration, {
      type: 'triangle',
      attack: 0.015,
      peak: 0.9,
    })
    playTone(audio, master, frequency, now + offset, duration * 0.6, {
      type: 'square',
      attack: 0.01,
      peak: 0.12,
    })
  }
  playTone(audio, master, 587.33, now + 0.68, 1.3, { type: 'sine', attack: 0.08, peak: 0.5 })
  playTone(audio, master, 196.0, now + 0.51, 1.5, { type: 'sine', attack: 0.1, peak: 0.55 })
}

// --- UI clicks ---------------------------------------------------------------

/** Soft rounded "tock" – a quick pitch drop plus a muffled transient. Shared by both OSes. */
function playClick(audio: AudioContext) {
  const now = audio.currentTime
  const master = makeMaster(audio, 0.22, now)
  playTone(audio, master, 1500, now, 0.045, { type: 'sine', attack: 0.002, glideTo: 520 })
  playNoise(audio, master, now, 0.03, { type: 'lowpass', frequency: 2400, q: 0.7 }, 0.45)
}

/** Fallback for `typing` when no file is configured: a single soft keyboard tap. */
function playKeyTap(audio: AudioContext) {
  const now = audio.currentTime
  const variance = 0.85 + Math.random() * 0.3
  const master = makeMaster(audio, 0.16, now)
  playNoise(
    audio,
    master,
    now,
    0.022,
    { type: 'bandpass', frequency: 2200 * variance, q: 1.1 },
    0.8,
  )
  playTone(audio, master, 760 * variance, now + 0.002, 0.03, {
    type: 'sine',
    attack: 0.001,
    peak: 0.5,
    glideTo: 320,
  })
}

function playGeneratedAlert(theme: SoundTheme, kind: 'notification' | 'message') {
  const ctx = getAudioContext()
  if (!ctx) return
  const audio: AudioContext = ctx

  const start = () => {
    const now = audio.currentTime
    const master = audio.createGain()
    const inChat = kind === 'message'
    master.gain.setValueAtTime(
      theme === 'modern' ? (inChat ? 0.32 : 0.22) : inChat ? 0.3 : 0.28,
      now,
    )
    master.connect(audio.destination)

    function tone(frequency: number, at: number, duration: number, type: OscillatorType) {
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(frequency, at)
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.linearRampToValueAtTime(1, at + Math.min(0.012, duration * 0.25))
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
      osc.connect(gain)
      gain.connect(master)
      osc.start(at)
      osc.stop(at + duration + 0.02)
    }

    if (inChat) {
      tone(theme === 'modern' ? 1180 : 1320, now, 0.055, theme === 'modern' ? 'sine' : 'triangle')
      return
    }

    if (theme === 'modern') {
      tone(880, now, 0.16, 'sine')
      tone(1318.5, now + 0.11, 0.32, 'sine')
    } else {
      tone(1046.5, now, 0.12, 'square')
      tone(1318.5, now + 0.1, 0.22, 'square')
    }
  }

  if (ctx.state === 'suspended') {
    void ctx.resume().then(start).catch(() => {})
    return
  }
  start()
}

export function playNotificationSound(os: OsEnvironment) {
  playSound(soundThemeForOs(os), 'notification')
}

export function playMessageSound(os: OsEnvironment) {
  playSound(soundThemeForOs(os), 'message')
}

export function playErrorSound(os: OsEnvironment) {
  playSound(soundThemeForOs(os), 'error')
}

export function playPowerOnSound() {
  playSound('retro', 'powerOn')
}

export function playStartupSound(os: OsEnvironment) {
  playSound(soundThemeForOs(os), 'startup')
}

export function playClickSound() {
  playSound('modern', 'click')
}

export function playTypingSound() {
  playSound('modern', 'typing')
}

const CLICKABLE_SELECTOR = [
  'button',
  'a[href]',
  'summary',
  'select',
  '[role="button"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[role="option"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  'input[type="submit"]',
  'input[type="button"]',
].join(',')

/** True when a pointer event landed on something that should give click feedback. */
export function isClickFeedbackTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  const hit = target.closest<HTMLElement>(CLICKABLE_SELECTOR)
  if (!hit) return false
  if (hit.hasAttribute('disabled') || hit.getAttribute('aria-disabled') === 'true') return false
  return true
}
