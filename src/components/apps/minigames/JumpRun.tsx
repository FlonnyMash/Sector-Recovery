import { useEffect, useRef, useState } from 'react'
import { strings } from '../../../i18n'
import { useGameStore } from '../../../store/useGameStore'
import { getHighScore, recordHighScore } from '../../../utils/highScores'

const GAME_KEY = 'jumprun'
const WIDTH = 560
const HEIGHT = 280
const GROUND = 230
const GRAVITY = 2200
const JUMP_V = -720
const PLAYER_W = 28
const PLAYER_H = 36

type Obstacle = { x: number; w: number; h: number }
type Status = 'ready' | 'running' | 'paused' | 'dead'

export function JumpRun() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const minimized = useGameStore((state) =>
    Boolean(state.windows.find((window) => window.type === 'arcade' && window.isMinimized)),
  )
  const [status, setStatus] = useState<Status>('ready')
  const [distance, setDistance] = useState(0)
  const [best, setBest] = useState(() => getHighScore(GAME_KEY))
  const statusRef = useRef<Status>('ready')
  const minimizedRef = useRef(minimized)

  useEffect(() => {
    minimizedRef.current = minimized
  }, [minimized])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = performance.now()
    let lastUi = 0
    let y = GROUND - PLAYER_H
    let vy = 0
    let speed = 220
    let spawn = 1.1
    let elapsed = 0
    let runDistance = 0
    let obstacles: Obstacle[] = []

    const resetWorld = () => {
      y = GROUND - PLAYER_H
      vy = 0
      speed = 220
      spawn = 1.1
      elapsed = 0
      runDistance = 0
      obstacles = [{ x: WIDTH + 40, w: 22, h: 34 }]
    }

    const jump = () => {
      const current = statusRef.current
      if (current === 'ready' || current === 'dead') {
        resetWorld()
        statusRef.current = 'running'
        setStatus('running')
        setDistance(0)
        return
      }
      if (current === 'running' && y >= GROUND - PLAYER_H - 1) {
        vy = JUMP_V
      }
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.code !== 'ArrowUp') return
      const arcade = useGameStore.getState().windows.find((window) => window.type === 'arcade')
      if (!arcade || arcade.isMinimized) return
      event.preventDefault()
      jump()
    }

    const onClick = () => jump()
    window.addEventListener('keydown', onKey)
    canvas.addEventListener('pointerdown', onClick)
    resetWorld()

    const loop = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      if (statusRef.current === 'running' && minimizedRef.current) {
        statusRef.current = 'paused'
        setStatus('paused')
      } else if (statusRef.current === 'paused' && !minimizedRef.current) {
        statusRef.current = 'running'
        setStatus('running')
      }

      if (statusRef.current === 'running') {
        elapsed += dt
        speed = 220 + elapsed * 18
        spawn -= dt
        if (spawn <= 0) {
          obstacles.push({
            x: WIDTH + 10,
            w: 18 + Math.random() * 18,
            h: 28 + Math.random() * 24,
          })
          spawn = 0.85 + Math.random() * 0.7
        }

        vy += GRAVITY * dt
        y = Math.min(GROUND - PLAYER_H, y + vy * dt)
        if (y >= GROUND - PLAYER_H) vy = 0

        for (const obstacle of obstacles) obstacle.x -= speed * dt
        obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.w > -20)
        runDistance += speed * dt * 0.08
        if (now - lastUi > 150) {
          lastUi = now
          setDistance(Math.floor(runDistance))
        }

        const px = 70
        for (const obstacle of obstacles) {
          const hit =
            px < obstacle.x + obstacle.w &&
            px + PLAYER_W > obstacle.x &&
            y < GROUND &&
            y + PLAYER_H > GROUND - obstacle.h
          if (hit) {
            statusRef.current = 'dead'
            setStatus('dead')
            setDistance(Math.floor(runDistance))
            setBest(recordHighScore(GAME_KEY, Math.floor(runDistance)))
          }
        }
      }

      ctx.fillStyle = '#1a1028'
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
      ctx.fillStyle = '#3a2048'
      ctx.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND)
      ctx.fillStyle = '#f0c14a'
      ctx.fillRect(0, GROUND, WIDTH, 3)

      ctx.fillStyle = '#7CFF9A'
      ctx.fillRect(70, y, PLAYER_W, PLAYER_H)
      ctx.fillStyle = '#e56b8c'
      for (const obstacle of obstacles) {
        ctx.fillRect(obstacle.x, GROUND - obstacle.h, obstacle.w, obstacle.h)
      }

      ctx.fillStyle = '#f7e6c8'
      ctx.font = '12px Tahoma, sans-serif'
      ctx.fillText(`${strings.arcade.jumpRun.distance}: ${Math.floor(runDistance)}`, 12, 20)

      if (statusRef.current === 'ready') {
        ctx.fillText(strings.arcade.jumpRun.start, 150, 120)
      } else if (statusRef.current === 'paused') {
        ctx.fillText(strings.arcade.jumpRun.paused, 240, 120)
      } else if (statusRef.current === 'dead') {
        ctx.fillText(
          `${strings.arcade.jumpRun.gameOver}: ${Math.floor(runDistance)}`,
          160,
          120,
        )
        ctx.fillText(strings.arcade.jumpRun.retry, 220, 142)
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      canvas.removeEventListener('pointerdown', onClick)
    }
  }, [])

  return (
    <div className="flex h-full flex-col bg-[#140c1e] p-3 font-[Tahoma,'Segoe_UI',sans-serif] text-[16px] text-[#f7e6c8]">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[18px] font-bold">{strings.arcade.jumpRun.title}</div>
        <div className="font-mono text-[14px]">
          {strings.arcade.highScore}: {best} · {strings.arcade.jumpRun.distance}: {distance}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ width: WIDTH * 1.3, height: HEIGHT * 1.3 }}
        className="rounded-sm border border-[#5a3a70] bg-[#1a1028]"
      />
    </div>
  )
}
