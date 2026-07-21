# Clean ghost route groups
Get-ChildItem -Recurse "src/app" -Directory | Where-Object { $_.Name -match "^\(.+\)$" } | ForEach-Object { Remove-Item -Recurse -Force $_.FullName -ErrorAction SilentlyContinue }

# Ensure required dirs exist
@("login","dashboard","users","projects","settings","components","lib") | ForEach-Object {
    $p = Join-Path "src" $_ 
    if (!(Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force | Out-Null }
}
# Bookings subdirs (with brackets)
$bk = "src/app/bookings"
if (!(Test-Path $bk)) { New-Item -ItemType Directory -Path $bk -Force | Out-Null }
@("new","[id]") | ForEach-Object {
    $p = Join-Path $bk $_
    if (!(Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force | Out-Null }
}

# Write all files using raw byte copies to avoid ghost interference
$files = @{
    "src/lib/api.ts" = @"
const API = "/api";
async function request(path, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401) { localStorage.removeItem("token"); window.location.href = "/login"; throw new Error("Unauthorized"); }
  if (!res.ok) { const err = await res.json().catch(() => ({ detail: res.statusText })); throw new Error(err.detail || "Request failed"); }
  return res.json();
}
export const api = {
  login: (e, p) => request("/auth/login", { method: "POST", body: JSON.stringify({ email: e, password: p }) }),
  me: () => request("/auth/me"),
  users: { list: () => request("/users"), create: (d) => request("/users", { method: "POST", body: JSON.stringify(d) }), update: (id, d) => request(`/users/${id}`, { method: "PUT", body: JSON.stringify(d) }), delete: (id) => request(`/users/${id}`, { method: "DELETE" }) },
  projects: { list: () => request("/projects"), create: (d) => request("/projects", { method: "POST", body: JSON.stringify(d) }), update: (id, d) => request(`/projects/${id}`, { method: "PUT", body: JSON.stringify(d) }), delete: (id) => request(`/projects/${id}`, { method: "DELETE" }) },
  units: { list: (p) => request(`/units${p ? `?project_id=${p}` : ""}`), available: (p) => request(`/units/available${p ? `?project_id=${p}` : ""}`), create: (d) => request("/units", { method: "POST", body: JSON.stringify(d) }), update: (id, d) => request(`/units/${id}`, { method: "PUT", body: JSON.stringify(d) }), delete: (id) => request(`/units/${id}`, { method: "DELETE" }) },
  bookings: { list: (q) => request(`/bookings${q ? `?${q}` : ""}`), get: (id) => request(`/bookings/${id}`), create: (d) => request("/bookings", { method: "POST", body: JSON.stringify(d) }), update: (id, d) => request(`/bookings/${id}`, { method: "PUT", body: JSON.stringify(d) }), delete: (id) => request(`/bookings/${id}`, { method: "DELETE" }), approve: (id, a, c, s) => request(`/bookings/${id}/approve`, { method: "POST", body: JSON.stringify({ action: a, comment: c, signature: s }) }), timeline: (id) => request(`/bookings/${id}/timeline`), approvals: (id) => request(`/bookings/${id}/approvals`) },
  documents: { list: (b) => request(`/bookings/${b}/documents`), upload: (b, t, f) => { const fd = new FormData(); fd.append("file", f); return request(`/bookings/${b}/documents?type=${t}`, { method: "POST", body: fd }); }, delete: (id) => request(`/documents/${id}`, { method: "DELETE" }) },
  dashboard: () => request("/dashboard"),
  recentActivity: () => request("/dashboard/recent-activity"),
  notifications: { list: () => request("/notifications"), markRead: (id) => request(`/notifications/${id}/read`, { method: "PUT" }), markAllRead: () => request("/notifications/read-all", { method: "PUT" }) },
  signature: { save: (s) => request("/users/signature", { method: "POST", body: JSON.stringify({ signature: s }) }) },
  printRequests: { list: () => request("/print-requests"), create: (b) => request(`/bookings/${b}/print-request`, { method: "POST" }), update: (id, s) => request(`/print-requests/${id}`, { method: "PUT", body: JSON.stringify({ status: s }) }) },
  auditLogs: { list: () => request("/audit-logs") },
};
"@
    "src/lib/auth.tsx" = @"
"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "./api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { const u = await api.me(); setUser(u); } catch { setUser(null); localStorage.removeItem("token"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (localStorage.getItem("token")) refresh(); else setLoading(false); }, [refresh]);
  const login = async (email, password) => { const res = await api.login(email, password); localStorage.setItem("token", res.token); setUser(res.user); };
  const logout = () => { localStorage.removeItem("token"); setUser(null); window.location.href = "/login"; };
  return <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
"@
    "src/components/layout.tsx" = @"
"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, FileText, Building2, Users, LogOut, Menu, ChevronLeft, Settings } from "lucide-react";
const items = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["super_admin","sales_executive","crm","management","finance"] },
  { label: "Bookings", href: "/bookings", icon: FileText, roles: ["super_admin","sales_executive","crm","management"] },
  { label: "Projects", href: "/projects", icon: Building2, roles: ["super_admin"] },
  { label: "Users", href: "/users", icon: Users, roles: ["super_admin"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["super_admin"] },
];
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  return (<div><div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
    <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"><Building2 className="w-4 h-4 text-white" /></div>{!collapsed && <span className="font-bold text-sm">CRM</span>}</div><button className="btn btn-ghost btn-sm hidden md:flex" onClick={() => setCollapsed(!collapsed)}><ChevronLeft className={`w-4 h-4 ${collapsed ? "rotate-180" : ""}`} /></button></div>
    <nav className="space-y-1">{items.filter(i => i.roles.includes(user?.role || "")).map(item => (<button key={item.href} onClick={() => router.push(item.href)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${pathname.startsWith(item.href) ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}><item.icon className="w-4 h-4 shrink-0" />{!collapsed && <span>{item.label}</span>}</button>))}</nav>
    <div className="mt-auto pt-6 border-t border-border"><div className="flex items-center gap-3 px-3 mb-3"><div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold">{user?.name?.charAt(0)}</div>{!collapsed && <div><p className="text-sm font-medium truncate">{user?.name}</p><p className="text-xs text-muted-foreground">{user?.role}</p></div>}</div><button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"><LogOut className="w-4 h-4" />{!collapsed && <span>Logout</span>}</button></div>
  </div><div className={`main ${collapsed ? "expanded" : ""}`}>{children}</div></div>);
}
"@
    "src/app/login/page.tsx" = @"
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Building2 } from "lucide-react";
export default function LoginPage() {
  const [email, setEmail] = useState("admin@crm.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const submit = async (e) => { e.preventDefault(); setError(""); setLoading(true); try { await login(email, password); router.push("/dashboard"); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  return (<div className="min-h-screen flex items-center justify-center p-4" style={{ background: "radial-gradient(ellipse at top, hsl(142, 76%, 36%, 0.15), transparent 60%)" }}>
    <div className="glass w-full max-w-md p-8 rounded-xl"><div className="flex items-center gap-3 mb-8"><div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center"><Building2 className="w-5 h-5 text-white" /></div><div><h1 className="text-lg font-bold">Real Estate CRM</h1><p className="text-xs text-muted-foreground">Booking & Workflow</p></div></div>
    <form onSubmit={submit} className="space-y-4"><div><label className="text-sm font-medium">Email</label><input className="input mt-1" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div><div><label className="text-sm font-medium">Password</label><input className="input mt-1" type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>{error && <p className="text-sm text-red-400">{error}</p>}<button className="btn btn-primary w-full justify-center" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button></form>
    <p className="mt-4 text-xs text-muted-foreground">Demo: admin@crm.com / admin123</p></div></div>);
}
"@
    "src/app/dashboard/page.tsx" = @"
"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import Layout from "@/components/layout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FileText, DollarSign, CheckCircle, XCircle, Clock, Activity, Users } from "lucide-react";
const stageLabels = { booking_created: "Created", sales_confirmation: "Sales", management_approval: "Mgmt", kyc_verification: "KYC", crm_approval: "CRM", ats_approval: "ATS", sale_deed_approval: "Sale Deed", print_request: "Print", completed: "Done" };
const COLORS = ["#3b82f6","#eab308","#ef4444","#22c55e","#a855f7","#f97316","#06b6d4","#ec4899","#84cc16"];
export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { try { const [d, a] = await Promise.all([api.dashboard(), api.recentActivity()]); setData(d); setActivity(a); } catch {} finally { setLoading(false); } }, []);
  useEffect(() => { if (!authLoading && !user) router.push("/login"); else if (user) load(); }, [user, authLoading, router, load]);
  if (loading) return <Layout><div className="p-6">Loading...</div></Layout>;
  if (!data) return null;
  const stageData = Object.entries(data.stage_counts || {}).map(([k, v]) => ({ name: stageLabels[k] || k, value: v }));
  return (<Layout><div className="p-6 space-y-6">
    <h1 className="text-2xl font-bold">Dashboard</h1>
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      {[{l:"Total",v:data.total_bookings,icon:FileThread,v:"text-blue-400",b:"bg-blue-500/10"},{l:"Pending",v:data.pending_approvals,icon:Users,v:"text-yellow-400",b:"bg-yellow-500/10"},{l:"Revenue",v:`₹${(data.revenue/1e5).toFixed(1)}L`,icon:DollarSign,v:"text-purple-400",b:"bg-purple-500/10"},{l:"Done",v:data.completed,icon:CheckCircle,v:"text-green-400",b:"bg-green-500/10"},{l:"Rejected",v:data.rejected,icon:XCircle,v:"text-red-400",b:"bg-red-500/10"}].map(s => (<div key={s.l} className="card flex items-center gap-4"><div className={`w-10 h-10 rounded-lg ${s.b} flex items-center justify-center`}><s.icon className={`w-5 h-5 ${s.c}`} /></div><div><p className="text-xs text-muted-foreground">{s.l}</p><p className="text-xl font-bold">{s.v}</p></div></div>))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card"><h3 className="font-semibold mb-4">Monthly Sales</h3><ResponsiveContainer width="100%" height={300}><BarChart data={data.monthly_sales || []}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} /><Tooltip /><Bar dataKey="count" fill="hsl(var(--primary))" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div>
      <div className="card"><h3 className="font-semibold mb-4">By Stage</h3><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={stageData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name,value}) => `${name}: ${value}`}>{stageData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
    </div>
    <div className="card"><h3 className="font-semibold mb-4"><Activity className="w-4 h-4 inline" /> Recent</h3><div className="space-y-2">{activity.map((a,i) => (<div key={i} className="flex items-start gap-3 text-sm"><div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" /><div><p>{a.event}</p><p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p></div></div>))}</div></div>
  </div></Layout>);
}
"@
    "src/app/bookings/page.tsx" = @"
"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import Layout from "@/components/layout";
import { Plus, Search, Eye, Building2 } from "lucide-react";
const stageLabels = { booking_created: "Created", sales_confirmation: "Sales", management_approval: "Mgmt", kyc_verification: "KYC", crm_approval: "CRM", ats_approval: "ATS", sale_deed_approval: "Sale Deed", print_request: "Print", completed: "Done" };
export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const load = useCallback(async () => { setLoading(true); try { setBookings(await api.bookings.list(search ? `search=${search}` : "")); } catch {} finally { setLoading(false); } }, [search]);
  useEffect(() => { if (!authLoading && !user) router.push("/login"); else if (user) load(); }, [user, authLoading, router, load]);
  return (<Layout><div className="p-6 space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Bookings</h1></div>{(user?.role === "super_admin" || user?.role === "sales_executive") && <button className="btn btn-primary" onClick={() => router.push("/bookings/new")}><Plus className="w-4 h-4" /> New</button>}</div>
    <div className="relative max-w-md"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input className="input pl-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
    {loading ? <div>Loading...</div> : bookings.length === 0 ? <div className="empty-state card"><Building2 className="w-12 h-12" /><p>No bookings</p></div> : <div className="card p-0 overflow-x-auto"><table className="table"><thead><tr><th>Client</th><th>Unit</th><th>Amount</th><th>Stage</th><th></th></tr></thead><tbody>{bookings.map(b => (<tr key={b.id} className="cursor-pointer" onClick={() => router.push(`/bookings/${b.id}`)}><td>{b.client?.name}<br /><span className="text-xs text-muted-foreground">{b.client?.phone}</span></td><td>{b.project?.name} / {b.unit?.unit_number}</td><td>₹{b.booking_amount?.toLocaleString()}</td><td><span className="chip chip-blue">{stageLabels[b.current_stage] || b.current_stage}</span></td><td><button className="btn btn-ghost btn-xs" onClick={e => { e.stopPropagation(); router.push(`/bookings/${b.id}`); }}><Eye className="w-3.5 h-3.5" /></button></td></tr>)))}</tbody></table></div>}
  </div></Layout>);
}
"@
}

# Write all files
foreach ($f in $files.Keys) {
    Set-Content -Path $f -Value $files[$f] -NoNewline
    Write-Host "Wrote $f"
}

Write-Host "All files written. Running build..."

# Run build
npm run build 2>&1
