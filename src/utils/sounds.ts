import type { OsEnvironment } from '../types/game'

export type SoundTheme = 'modern' | 'retro'
export type SoundEvent = 'notification' | 'message' | 'error' | 'windowOpen' | 'windowClose'

export const SOUND_SOURCES: Record<SoundTheme, Record<SoundEvent, string | null>> = {
  modern: {
    notification: null, // modern: soft ping
    message: null, // modern: soft message pop
    error: null, // modern: muted thud
    windowOpen: null, // modern: light whoosh
    windowClose: null, // modern: soft close
  },
  retro: {
    notification: null, // retro: balloon ding
    message: null, // retro: MSN nudge-lite
    error: null, // retro: 2011 critical-stop
    windowOpen: null, // retro: aero open
    windowClose: null, // retro: aero close
  },
}

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

export function playSound(theme: SoundTheme, event: SoundEvent) {
  const src = SOUND_SOURCES[theme][event]
  if (src) {
    const audio = new Audio(src)
    void audio.play().catch(() => {})
    return
  }

  if (event === 'notification' || event === 'message') {
    playGeneratedAlert(theme)
  }
}

function playGeneratedAlert(theme: SoundTheme) {
  const ctx = getAudioContext()
  if (!ctx) return

  const start = () => {
    const now = ctx.currentTime
    const master = ctx.createGain()
    master.gain.setValueAtTime(theme === 'modern' ? 0.22 : 0.28, now)
    master.connect(ctx.destination)

    function tone(frequency: number, at: number, duration: number, type: OscillatorType) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(frequency, at)
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(1, at + 0.018)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
      osc.connect(gain)
      gain.connect(master)
      osc.start(at)
      osc.stop(at + duration + 0.02)
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

export function playErrorSound(os: OsEnvironment) {
  playSound(soundThemeForOs(os), 'error')
}
