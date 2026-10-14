import { useEffect } from 'react'
import { Desktop } from './components/os/Desktop'
import { useGameStore } from './store/useGameStore'

function App() {
  useEffect(() => {
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      const delta = (now - last) / 1000
      last = now
      const { fragmentsPerSecond, tick } = useGameStore.getState()
      if (fragmentsPerSecond > 0) {
        tick(delta)
      }
    }, 100)

    return () => window.clearInterval(id)
  }, [])

  return <Desktop />
}

export default App
