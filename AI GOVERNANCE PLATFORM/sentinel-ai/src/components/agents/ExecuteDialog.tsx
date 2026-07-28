"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Play, Loader2, XCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface Props {
  agent: { id: string; name: string; ai_model: string }
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function ExecuteDialog({ agent, open, onOpenChange }: Props) {
  const qc = useQueryClient()
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ status: string; content: string } | null>(null)

  async function execute() {
    setLoading(true); setResult(null)
    const res = await fetch(`/api/agents/${agent.id}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt || undefined }),
    })
    const data = await res.json()
    setResult({ status: data.status, content: data.result })
    setLoading(false)
    qc.invalidateQueries({ queryKey: ["agents"] })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setResult(null); setPrompt("") } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Run Agent: {agent.name}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-xs text-neutral-500">Model: {agent.ai_model}</p>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="What do you want this agent to do? (leave blank for a default task)"
            className="flex min-h-[100px] w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 resize-y"
          />
          {loading && (
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Running agent...
            </div>
          )}
          {result && (
            <div className={`rounded-lg border p-3 text-sm ${result.status === "success" ? "border-emerald-800/30 bg-emerald-900/10 text-emerald-300" : "border-red-800/30 bg-red-900/10 text-red-300"}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {result.status === "success" ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                <span className="font-medium capitalize">{result.status}</span>
              </div>
              <p className="text-xs whitespace-pre-wrap text-neutral-300">{result.content}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8">Close</Button>
          <Button size="sm" onClick={execute} disabled={loading} className="h-8 gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {loading ? "Running..." : "Execute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
