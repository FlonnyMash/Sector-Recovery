import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, unwatchFile, watchFile } from 'node:fs'
import { join, normalize, resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'

function fileKey(file: string) {
  return normalize(resolve(file)).toLowerCase()
}

function hashFile(file: string) {
  return createHash('sha1').update(readFileSync(file)).digest('hex')
}

function rememberTree(root: string, hashes: Map<string, string>) {
  let entries
  try {
    entries = readdirSync(root, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue
    const full = join(root, entry.name)
    if (entry.isDirectory()) rememberTree(full, hashes)
    else if (entry.isFile()) {
      try {
        hashes.set(fileKey(full), hashFile(full))
      } catch {
        // The file can disappear between the directory listing and the read.
      }
    }
  }
}

/** Skip hot updates when an editor rewrites a file without changing its bytes. */
function ignoreUnchangedFiles(): Plugin {
  const hashes = new Map<string, string>()
  return {
    name: 'ignore-unchanged-hmr',
    apply: 'serve',
    configureServer(server) {
      rememberTree(resolve(server.config.root, 'src'), hashes)
    },
    handleHotUpdate(ctx) {
      const key = fileKey(ctx.file)
      let next: string
      try {
        next = hashFile(ctx.file)
      } catch {
        return
      }
      const previous = hashes.get(key)
      hashes.set(key, next)
      if (previous === next) return []
    },
  }
}

/**
 * Something on this drive re-touches vite.config.ts every few minutes without
 * changing it, and Vite restarts (and re-optimizes deps) on every touch. Keep
 * the config out of Vite's watcher and restart ourselves only when its bytes
 * actually change.
 */
function restartOnRealConfigChange(): Plugin {
  const POLL_MS = 1000
  return {
    name: 'restart-on-real-config-change',
    apply: 'serve',
    config() {
      return { server: { watch: { ignored: ['**/vite.config.ts'] } } }
    },
    configureServer(server) {
      const configFile = server.config.configFile
      if (!configFile) return
      let previous = hashFile(configFile)
      const onPoll = () => {
        let next: string
        try {
          next = hashFile(configFile)
        } catch {
          return
        }
        if (next === previous) return
        previous = next
        server.config.logger.info('vite.config.ts changed, restarting server...', { timestamp: true })
        void server.restart()
      }
      watchFile(configFile, { interval: POLL_MS }, onPoll)
      server.httpServer?.once('close', () => unwatchFile(configFile, onPoll))
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), ignoreUnchangedFiles(), restartOnRealConfigChange()],
})
