import { NextRequest } from "next/server"
import { getWorkspaceId } from "@/lib/auth"
import { eventBus } from "@/lib/event-bus"

export async function GET(req: NextRequest) {
  const wsId = await getWorkspaceId(req)
  if (!wsId) return new Response("Unauthorized", { status: 401 })

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const enc = new TextEncoder()

  writer.write(enc.encode("retry: 1000\n\n"))
  writer.write(enc.encode(`data: {"eventType":"SSEConnected","eventId":"init","timestamp":"${new Date().toISOString()}","severity":"info","source":"sse","metadata":{},"duration":0}\n\n`))

  const unsub1 = eventBus.on(`event:${wsId}`, (data) => {
    try { writer.write(enc.encode(`data: ${JSON.stringify(data)}\n\n`)) } catch {}
  })
  const unsub2 = eventBus.on(`metrics:${wsId}`, (data) => {
    try { writer.write(enc.encode(`event: metrics\ndata: ${JSON.stringify(data)}\n\n`)) } catch {}
  })

  const keepAlive = setInterval(() => {
    try { writer.write(enc.encode(": keepalive\n\n")) } catch {}
  }, 15000)

  req.signal.addEventListener("abort", () => {
    unsub1(); unsub2(); clearInterval(keepAlive)
    writer.close().catch(() => {})
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
