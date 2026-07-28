"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Save, Copy, Eye, EyeOff, Key, Palette, Check, Trash2, Plus, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const sections = [
  { id: "general", label: "General", icon: Palette },
  { id: "api-keys", label: "API Keys", icon: Key },
]

export default function SettingsPage() {
  const [tab, setTab] = useState("general")
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [keys, setKeys] = useState<any[]>([])
  const [wsName, setWsName] = useState("Sentinel AI")
  const [wsRegion, setWsRegion] = useState("us-east-1")
  const [saving, setSaving] = useState(false)
  const [compactSidebar, setCompactSidebar] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setCompactSidebar(localStorage.getItem("sidebar-collapsed") === "true")
    setReducedMotion(localStorage.getItem("reduced-motion") === "true")
    const t = new URLSearchParams(window.location.search).get("tab")
    if (t) setTab(t)
  }, [])

  useEffect(() => {
    loadKeys()
    fetch("/api/workspace").then(r => r.ok && r.json()).then(d => {
      if (d?.name) setWsName(d.name)
      if (d?.region) setWsRegion(d.region)
    })
  }, [])

  async function loadKeys() {
    const r = await fetch("/api/api-keys")
    const d = await r.json()
    setKeys(d || [])
  }

  async function saveWorkspace() {
    setSaving(true)
    await fetch("/api/workspace", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: wsName, region: wsRegion }) })
    setSaving(false)
  }

  async function createKey() {
    await fetch("/api/api-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Key " + (keys.length + 1) }) })
    await loadKeys()
  }

  async function revokeKey(id: string) {
    await fetch("/api/api-keys", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    await loadKeys()
  }

  function toggleSidebar(val: boolean) {
    setCompactSidebar(val)
    localStorage.setItem("sidebar-collapsed", String(val))
    window.dispatchEvent(new CustomEvent("sidebar-collapse"))
  }

  function toggleReducedMotion(val: boolean) {
    setReducedMotion(val)
    localStorage.setItem("reduced-motion", String(val))
    document.documentElement.classList.toggle("reduced-motion", val)
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-lg font-semibold text-neutral-50">Settings</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Manage your workspace configuration</p>
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
          {sections.map((s) => (
            <TabsTrigger key={s.id} value={s.id} className="gap-2 data-[state=active]:bg-neutral-800">
              <s.icon className="h-4 w-4" />
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-200">Workspace Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-400">Workspace Name</label>
                  <Input value={wsName} onChange={e => setWsName(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-400">Region</label>
                  <Input value={wsRegion} onChange={e => setWsRegion(e.target.value)} className="h-9" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={saveWorkspace} disabled={saving}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-200">Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-200">Compact Sidebar</p>
                  <p className="text-xs text-neutral-500">Collapse sidebar to icons only</p>
                </div>
                <Switch checked={compactSidebar} onCheckedChange={toggleSidebar} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-200">Reduced Motion</p>
                  <p className="text-xs text-neutral-500">Disable animations</p>
                </div>
                <Switch checked={reducedMotion} onCheckedChange={toggleReducedMotion} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-neutral-200">API Keys</CardTitle>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={createKey}><Plus className="h-3.5 w-3.5" /> Create Key</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {keys.length === 0 && <p className="text-sm text-neutral-500">No API keys yet. Create one to connect your agents.</p>}
              {keys.map((k) => (
                <div key={k.id} className="rounded-lg border border-neutral-800 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-neutral-200">{k.name}</p>
                      <Badge variant="success" className="text-[10px]">Active</Badge>
                    </div>
                    <p className="text-[11px] text-neutral-500">Created {new Date(k.created_at).toLocaleDateString()}{k.last_used_at ? ` · Used ${new Date(k.last_used_at).toLocaleDateString()}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKeys[k.id] ? "text" : "password"}
                        value={k.key}
                        readOnly
                        className="h-9 pr-8 font-mono text-xs"
                      />
                      <button onClick={() => setShowKeys({ ...showKeys, [k.id]: !showKeys[k.id] })} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300">
                        {showKeys[k.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => { navigator.clipboard.writeText(k.key); setCopied(k.id); setTimeout(() => setCopied(null), 2000) }}>
                      {copied === k.id ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 text-red-400 hover:text-red-300" onClick={() => revokeKey(k.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
