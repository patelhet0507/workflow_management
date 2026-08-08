"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { api, type FieldSpec, type ProjectType } from "@/lib/api"
import AppLayout from "@/components/app-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, X, Trash2, Folder } from "lucide-react"

export default function ProjectsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectType[]>([])
  const [error, setError] = useState("")

  const [editing, setEditing] = useState<ProjectType | "new" | null>(null)
  const [draftName, setDraftName] = useState("")
  const [draftFields, setDraftFields] = useState<FieldSpec[]>([])

  const isAdmin = user?.role === "admin" || user?.role === "super_admin"

  const load = () => api.getProjects().then(setProjects).catch(console.error)

  useEffect(() => {
    if (!isLoading && !user) return void router.push("/login")
    if (user) load()
  }, [user, isLoading, router])

  const openEdit = (p: ProjectType) => {
    setEditing(p)
    setDraftName(p.name)
    setDraftFields(p.fields.map((f) => ({ ...f })))
    setError("")
  }

  const openNew = () => {
    setEditing("new")
    setDraftName("")
    setDraftFields([{ name: "", required: false }])
    setError("")
  }

  const updateField = (idx: number, patch: Partial<FieldSpec>) => {
    setDraftFields(draftFields.map((f, i) => (i === idx ? { ...f, ...patch } : f)))
  }

  const save = async () => {
    setError("")
    if (!draftName.trim()) return setError("Project name is required")
    const fields = draftFields.filter((f) => f.name.trim())
    if (!fields.length) return setError("Add at least one detail field")
    try {
      if (editing === "new") await api.createProject({ name: draftName.trim(), fields })
      else if (editing) await api.updateProject(editing.id, { name: draftName.trim(), fields })
      setEditing(null)
      load()
    } catch (err: any) { setError(err.message || "Save failed") }
  }

  const del = async (p: ProjectType) => {
    if (!confirm(`Delete project "${p.name}"?`)) return
    try { await api.deleteProject(p.id); load() } catch (err: any) { setError(err.message) }
  }

  if (isLoading || !user) return null

  return (
    <AppLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-600 rounded-full inline-block" />
            Projects
          </h1>
          {isAdmin && (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={openNew}><Plus className="w-4 h-4 mr-1.5" /> New Project</Button>
          )}
        </div>

        {editing && (
          <Card className="shadow-md border-0 ring-1 ring-gray-200 dark:ring-gray-800 mb-8">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-t-lg">
              <CardTitle className="text-lg">{editing === "new" ? "New Project" : "Edit Project"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 max-w-xl">
                <div className="space-y-1"><Label>Project Name</Label>
                  <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="e.g. Emerald Towers" className="focus:ring-2 focus:ring-blue-500" /></div>
                <div className="space-y-2">
                  <Label>Detail Fields</Label>
                  {draftFields.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input value={f.name} onChange={(e) => updateField(i, { name: e.target.value })}
                        placeholder="Field name (e.g. Floor, Car Park, Tower)" className="flex-1 focus:ring-2 focus:ring-blue-500" />
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        <input type="checkbox" checked={!!f.required} onChange={(e) => updateField(i, { required: e.target.checked })} />
                        Required
                      </label>
                      <Button size="icon" variant="ghost" onClick={() => setDraftFields(draftFields.filter((_, j) => j !== i))}><X className="w-4 h-4 text-gray-400" /></Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => setDraftFields([...draftFields, { name: "", required: false }])}><Plus className="w-3.5 h-3.5 mr-1" /> Add Field</Button>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <Button onClick={save} className="bg-blue-600 hover:bg-blue-700">Save Project</Button>
                  <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {projects.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-10 text-center ring-1 ring-gray-200 dark:ring-gray-800">
            <Folder className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No projects yet{isAdmin ? " — create one to get started" : ""}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <Card key={p.id} className="ring-1 ring-gray-100 dark:ring-gray-800 shadow-sm">
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{p.name}</CardTitle>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => del(p)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Detail Fields</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.fields.length === 0 ? <span className="text-xs text-gray-400">None</span> : p.fields.map((f) => (
                      <Badge key={f.name} variant={f.required ? "secondary" : "outline"}>{f.required ? `${f.name} *` : f.name}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}