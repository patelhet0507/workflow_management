import { watch } from "fs"
import { homedir, hostname, platform, release, totalmem, freemem, cpus, userInfo, uptime } from "os"
import { cwd } from "process"
import { execSync } from "child_process"
import http from "http"
import https from "https"

const BASE = process.env.SENTINEL_URL || "http://localhost:3000"
const API_KEY = process.env.SENTINEL_API_KEY || ""
const SESSION_INTERVAL = 1000
const POLL_INTERVAL = 2000
const WATCH_DIR = process.env.WATCH_DIR || cwd()

let sessionId = ""
let eventCount = 0
let metricsCount = 0
let currentActivity = "Starting..."
let activityStart = Date.now()
let activityHistory: string[] = []
let activityDuration: number[] = []
const recentEvents: any[] = []
let maxRecentEvents = 1000

interface SessionData {
  id: string
  startTime: string
  workspace: string
  cwd: string
  gitBranch: string
  os: string
  osRelease: string
  nodeVersion: string
  cpu: string
  totalMemory: string
  pid: number
  hostname: string
  user: string
}

interface Metrics {
  cpuPercent: number
  ramUsed: number
  ramTotal: number
  ramPercent: number
  uptime: number
}

function post(path: string, body: any) {
  const url = new URL(path, BASE)
  const client = url.protocol === "https:" ? https : http
  return new Promise<void>((resolve, reject) => {
    const data = JSON.stringify(body)
    const opts = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname,
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "Content-Length": Buffer.byteLength(data) },
    }
    const r = client.request(opts, (res) => { res.resume(); resolve() })
    r.on("error", reject)
    r.write(data)
    r.end()
  })
}

function emit(eventType: string, data: Record<string, any> = {}) {
  const event = { eventId: `${sessionId}-${++eventCount}`, sessionId, timestamp: new Date().toISOString(), eventType, severity: data.severity || "info", source: "collector", metadata: {}, duration: 0, ...data }
  recentEvents.push(event)
  if (recentEvents.length > maxRecentEvents) recentEvents.shift()
  delete event.severity
  post("/api/telemetry/ingest", { type: "event", ...event }).catch(() => {})
  return event
}

function trackActivity(activity: string) {
  const now = Date.now()
  if (currentActivity !== activity) {
    const elapsed = now - activityStart
    activityDuration.push(elapsed)
    activityHistory.push(currentActivity)
    currentActivity = activity
    activityStart = now
  }
}

function getGitBranch(): string {
  try { return execSync("git rev-parse --abbrev-ref HEAD", { cwd: WATCH_DIR, encoding: "utf8", timeout: 3000 }).trim() } catch { return "unknown" }
}

function getCpuUsage(): number {
  try {
    const c = cpus()
    const total = c.reduce((s, cpu) => s + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq, 0)
    const idle = c.reduce((s, cpu) => s + cpu.times.idle, 0)
    return Math.round((1 - idle / total) * 100)
  } catch { return 0 }
}

function collectMetrics(): Metrics {
  return {
    cpuPercent: getCpuUsage(),
    ramUsed: Math.round((totalmem() - freemem()) / 1024 / 1024),
    ramTotal: Math.round(totalmem() / 1024 / 1024),
    ramPercent: Math.round((1 - freemem() / totalmem()) * 100),
    uptime: Math.round(uptime()),
  }
}

async function sendMetrics() {
  const m = collectMetrics()
  await post("/api/telemetry/ingest", { type: "metrics", sessionId, metrics: m, timestamp: new Date().toISOString() }).catch(() => {})
}

function startFileWatcher(dir: string) {
  const watchers: ReturnType<typeof watch>[] = []

  function watchDir(d: string) {
    try {
      const w = watch(d, { recursive: false }, (eventType, filename) => {
        if (!filename) return
        const name = filename.toString()
        const ext = name.split(".").pop()?.toLowerCase()
        if (["git", "node_modules", ".next", "dist", "build"].some(d => name.includes(d))) return

        if (eventType === "change") {
          trackActivity(`Editing ${name}`)
          emit("FileModified", { metadata: { file: name, extension: ext } })
        } else if (eventType === "rename") {
          // ponytail: can't distinguish create/delete from rename without stat
          emit("FileChanged", { metadata: { file: name, event: "rename" } })
        }
      })
      watchers.push(w)
    } catch {}
  }

  watchDir(dir)
  // ponytail: single-level watch only, add recursive + subdirectory scanning if depth needed
  return () => watchers.forEach(w => w.close())
}

function detectRuntime(): string {
  const env = process.env
  if (env.CLAUDE_CODE) return "claude-code"
  if (env.OPENCODE_AGENT) return "opencode"
  return "unknown"
}

function detectOpenCode() {
  let found = false
  const check = setInterval(() => {
    try {
      const procs = execSync('powershell "Get-Process -Name node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id"', { encoding: "utf8", timeout: 2000 })
        .split("\n").map(s => s.trim()).filter(Boolean)
      const openCodeRunning = procs.length > 0
      if (openCodeRunning && !found) {
        found = true
        emit("SessionConnected", { metadata: { runtime: detectRuntime(), pid: process.pid } })
      } else if (!openCodeRunning && found) {
        found = false
        emit("SessionDisconnected", { metadata: { runtime: detectRuntime() } })
      }
    } catch {}
  }, 5000)
  return () => clearInterval(check)
}

async function main() {
  if (!API_KEY) { console.error("SENTINEL_API_KEY required"); process.exit(1) }

  const session: SessionData = {
    id: crypto.randomUUID(),
    startTime: new Date().toISOString(),
    workspace: cwd().split("\\").pop() || cwd().split("/").pop() || "",
    cwd: cwd(),
    gitBranch: getGitBranch(),
    os: `${platform()} ${release()}`,
    osRelease: release(),
    nodeVersion: process.version,
    cpu: `${cpus().length} cores`,
    totalMemory: `${Math.round(totalmem() / 1024 / 1024 / 1024)} GB`,
    pid: process.pid,
    hostname: hostname(),
    user: userInfo().username,
  }
  sessionId = session.id

  console.log(`\n  Sentinel Runtime Monitor\n${"=".repeat(40)}`)
  console.log(`  Session:    ${session.id.slice(0, 8)}...`)
  console.log(`  Directory:  ${session.cwd}`)
  console.log(`  Branch:     ${session.gitBranch}`)
  console.log(`  Platform:   ${session.os}`)
  console.log(`  Node:       ${session.nodeVersion}`)
  console.log(`  PID:        ${session.pid}`)
  console.log(`\n  Streaming telemetry to ${BASE}\n`)

  emit("SessionStarted", { metadata: session, severity: "info" })

  const stopFsWatch = startFileWatcher(WATCH_DIR)
  const stopOpenCodeCheck = detectOpenCode()

  const metricsTimer = setInterval(() => sendMetrics(), SESSION_INTERVAL)

  process.on("SIGINT", () => {
    clearInterval(metricsTimer)
    stopFsWatch()
    stopOpenCodeCheck()
    emit("SessionFinished", { metadata: { duration: Date.now() - new Date(session.startTime).getTime(), events: eventCount, metrics: metricsCount }, severity: "info" })
    console.log("\n  Monitor stopped.")
    process.exit(0)
  })

  process.on("SIGTERM", () => process.emit("SIGINT"))
}

main().catch(console.error)
