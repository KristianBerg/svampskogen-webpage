// Runs this checkout's own dev servers on free ports, so a Claude session in a
// worktree can show its changes while the common `npm run dev` keeps running.
//
//   npm run dev:session [web] [worker] [cms]   start them (default: web)
//   npm run dev:session:stop                   stop them
//
// Servers keep running after this script exits. Their ports and process ids
// are in .dev-session/state.json and their output in .dev-session/<name>.log.
// Claude Code calls the `statusline` and `session-end` commands.

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'

const repoRoot = path.resolve(import.meta.dirname, '..')
const COMMON_WORKER_PORT = 8787
const START_TIMEOUT_MS = 60_000

// Started in this order, so the frontend can be pointed at a session Worker.
const SERVICES = {
  worker: {
    basePort: 8800,
    command: (port) => ['npm', ['--prefix', 'worker', 'run', 'dev', '--', '--port', String(port)]],
  },
  cms: {
    basePort: 4600,
    command: () => ['node', ['scripts/image-uploader/server.mjs']],
    env: (port) => ({ CMS_PORT: String(port) }),
  },
  web: {
    basePort: 5200,
    command: (port) => ['npx', ['vite', '--strictPort', '--port', String(port)]],
    env: (_port, state) => ({
      // Worktrees symlink node_modules, so Vite's default cache would be shared.
      VITE_CACHE_DIR: '.dev-session/vite',
      ...(state.worker && { VITE_CHECKOUT_WORKER_URL: state.worker.url }),
    }),
  },
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function statePath(dir) {
  return path.join(dir, '.dev-session', 'state.json')
}

function readState(dir) {
  try {
    return JSON.parse(fs.readFileSync(statePath(dir), 'utf8'))
  } catch {
    return {}
  }
}

function writeState(dir, state) {
  fs.mkdirSync(path.dirname(statePath(dir)), { recursive: true })
  fs.writeFileSync(statePath(dir), JSON.stringify(state, null, 2))
}

function isUp(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: 'localhost', timeout: 300 })
    const finish = (up) => {
      socket.destroy()
      resolve(up)
    }
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
  })
}

async function liveServices(dir) {
  const live = {}
  for (const [name, service] of Object.entries(readState(dir))) {
    if (await isUp(service.port)) live[name] = service
  }
  return live
}

async function findFreePort(basePort) {
  for (let port = basePort; port < basePort + 100; port++) {
    if (!(await isUp(port))) return port
  }
  throw new Error(`No free port found from ${basePort}`)
}

function killGroup(pid) {
  try {
    process.kill(-pid, 'SIGTERM')
  } catch (error) {
    if (error.code !== 'ESRCH') throw error
  }
}

async function stopService(service) {
  killGroup(service.pid)
  for (let i = 0; i < 50 && (await isUp(service.port)); i++) await wait(100)
}

async function startService(name, state) {
  const service = SERVICES[name]
  const port = await findFreePort(service.basePort)
  const logPath = path.join(repoRoot, '.dev-session', `${name}.log`)
  fs.mkdirSync(path.dirname(logPath), { recursive: true })
  const log = fs.openSync(logPath, 'w')
  const [command, args] = service.command(port)

  // Detached gives each server its own process group, so stopping it also
  // stops whatever it spawned (npm starts wrangler, which starts workerd).
  const child = spawn(command, args, {
    cwd: repoRoot,
    detached: true,
    stdio: ['ignore', log, log],
    env: { ...process.env, ...service.env?.(port, state) },
  })
  child.unref()

  let exited = false
  child.once('exit', () => {
    exited = true
  })

  const deadline = Date.now() + START_TIMEOUT_MS
  while (!exited && Date.now() < deadline) {
    if (await isUp(port)) {
      return { port, pid: child.pid, url: `http://localhost:${port}`, sessionId: process.env.CLAUDE_CODE_SESSION_ID }
    }
    await wait(200)
  }
  if (!exited) killGroup(child.pid)
  throw new Error(`${name} did not start, see ${logPath}`)
}

async function start(names) {
  const state = await liveServices(repoRoot)
  const requested = new Set(names)

  // The frontend reads the Worker URL when it starts, so a new Worker needs a new frontend.
  if (requested.has('worker') && !state.worker && state.web) {
    await stopService(state.web)
    delete state.web
    requested.add('web')
  }

  for (const name of Object.keys(SERVICES)) {
    if (!requested.has(name) || state[name]) continue
    state[name] = await startService(name, state)
    writeState(repoRoot, state)
  }
  writeState(repoRoot, state)

  for (const [name, service] of Object.entries(state)) console.log(`${name}: ${service.url}`)
  if (state.web && !state.worker && !(await isUp(COMMON_WORKER_PORT))) {
    console.warn(`Checkout won't work: no common Worker on port ${COMMON_WORKER_PORT}. Run npm run dev, or start a session worker.`)
  }
}

async function stop(dir) {
  for (const service of Object.values(await liveServices(dir))) await stopService(service)
  fs.rmSync(statePath(dir), { force: true })
}

function readStdinJson() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8'))
  } catch {
    return {}
  }
}

async function statusline() {
  const input = readStdinJson()
  const dir = input.workspace?.current_dir ?? input.cwd ?? process.cwd()
  const parts = Object.entries(await liveServices(dir)).map(([name, service]) => `${name} ${service.url}`)
  if (parts.length > 0) console.log(parts.join('  |  '))
}

function worktreeDirs() {
  const worktrees = path.join(repoRoot, '.claude', 'worktrees')
  try {
    return fs.readdirSync(worktrees).map((name) => path.join(worktrees, name))
  } catch {
    return []
  }
}

async function sessionEnd() {
  const input = readStdinJson()
  fs.mkdirSync(path.join(repoRoot, '.dev-session'), { recursive: true })
  fs.appendFileSync(
    path.join(repoRoot, '.dev-session', 'session-end.log'),
    `${new Date().toISOString()} reason=${input.reason} cwd=${input.cwd} session=${input.session_id}\n`,
  )
  // /clear keeps working in the same checkout, so its servers stay useful.
  if (input.reason === 'clear' || !input.session_id) return

  // Matched by session, not cwd: the session may have left its worktree before ending.
  const dirs = new Set([input.cwd, repoRoot, ...worktreeDirs()].filter(Boolean))
  for (const dir of dirs) {
    const services = Object.values(readState(dir))
    if (services.some((service) => service.sessionId === input.session_id)) await stop(dir)
  }
}

const [first, ...rest] = process.argv.slice(2)
try {
  if (first === 'stop') await stop(repoRoot)
  else if (first === 'statusline') await statusline()
  else if (first === 'session-end') await sessionEnd()
  else {
    const names = first ? [first, ...rest] : ['web']
    const unknown = names.filter((name) => !SERVICES[name])
    if (unknown.length > 0) throw new Error(`Unknown service: ${unknown.join(', ')}. Choose from web, worker, cms.`)
    await start(names)
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
