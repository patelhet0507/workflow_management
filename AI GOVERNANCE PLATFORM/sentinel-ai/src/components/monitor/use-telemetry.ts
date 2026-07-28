"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export interface TelemetryEvent {
  eventId: string
  sessionId: string
  timestamp: string
  eventType: string
  metadata: Record<string, any>
  duration: number
  severity: string
  source: string
}

export interface MetricsData {
  cpuPercent: number
  ramUsed: number
  ramTotal: number
  ramPercent: number
  uptime: number
}

export function useTelemetry() {
  const [events, setEvents] = useState<TelemetryEvent[]>([])
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [connected, setConnected] = useState(false)
  const [session, setSession] = useState<any>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource("/api/telemetry/live")
    esRef.current = es

    es.onopen = () => setConnected(true)

    es.addEventListener("metrics", (e) => {
      try { setMetrics(JSON.parse(e.data).metrics) } catch {}
    })

    es.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data)
        setEvents(prev => [ev, ...prev].slice(0, 500))
        if (ev.eventType === "SessionStarted") setSession(ev.metadata)
      } catch {}
    }

    es.onerror = () => { setConnected(false) }

    return () => { es.close(); esRef.current = null }
  }, [])

  const timeline = events.slice(0, 100)
  const totalEvents = events.length

  return { events, timeline, metrics, connected, session, totalEvents }
}
