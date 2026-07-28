import { useQuery } from "@tanstack/react-query"

async function fetchJSON(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`GET ${url} failed`)
  return res.json()
}

async function postJSON(url: string, body?: any) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) throw new Error(`POST ${url} failed`)
  return res.json()
}

export function useAgents() {
  return useQuery({ queryKey: ["agents"], queryFn: () => fetchJSON("/api/agents"), refetchInterval: 30000 })
}

export function useExecutions(agentId?: string) {
  const params = agentId ? `?agentId=${agentId}` : ""
  return useQuery({ queryKey: ["executions", agentId], queryFn: () => fetchJSON(`/api/executions${params}`), refetchInterval: 15000 })
}

export function useActivity(limit = 50) {
  return useQuery({ queryKey: ["activity", limit], queryFn: () => fetchJSON(`/api/activity?limit=${limit}`), refetchInterval: 10000 })
}

export function useAlerts() {
  return useQuery({ queryKey: ["alerts"], queryFn: () => fetchJSON("/api/alerts"), refetchInterval: 15000 })
}

export function usePolicies() {
  return useQuery({ queryKey: ["policies"], queryFn: () => fetchJSON("/api/policies"), refetchInterval: 30000 })
}

export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: () => fetchJSON("/api/users"), refetchInterval: 30000 })
}

export function useBilling() {
  return useQuery({ queryKey: ["billing"], queryFn: () => fetchJSON("/api/billing"), refetchInterval: 60000 })
}

export function useMemory() {
  return useQuery({ queryKey: ["memory"], queryFn: () => fetchJSON("/api/memory"), refetchInterval: 30000 })
}

export function useSecurity() {
  return useQuery({ queryKey: ["security"], queryFn: () => fetchJSON("/api/security"), refetchInterval: 15000 })
}

export function useObservability() {
  return useQuery({ queryKey: ["observability"], queryFn: () => fetchJSON("/api/observability"), refetchInterval: 15000 })
}

export function useDashboardStats() {
  return useQuery({ queryKey: ["dashboard"], queryFn: () => fetchJSON("/api/analytics/dashboard"), refetchInterval: 15000 })
}

export function useTokenAnalytics() {
  return useQuery({ queryKey: ["token-analytics"], queryFn: () => fetchJSON("/api/analytics/tokens"), refetchInterval: 30000 })
}

export function useCostAnalytics() {
  return useQuery({ queryKey: ["cost-analytics"], queryFn: () => fetchJSON("/api/analytics/cost"), refetchInterval: 30000 })
}

