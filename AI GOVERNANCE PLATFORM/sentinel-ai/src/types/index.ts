export interface Agent {
  id: string
  name: string
  status: "active" | "paused" | "error" | "idle"
  memoryUsed: string
  tokens: number
  lastRun: Date
  model: string
  permissions: string[]
  policyStatus: "compliant" | "violation" | "pending"
  category: string
}

export interface ActivityEntry {
  id: string
  time: Date
  agent: string
  action: string
  status: "success" | "failed" | "pending" | "warning"
  duration: number
  cost: number
}

export interface Alert {
  id: string
  type: "critical" | "warning" | "info"
  message: string
  agent: string
  time: Date
}

export interface SystemHealth {
  cpu: number
  ram: number
  gpu: number
  apiAvailability: number
  database: number
  queue: number
}

export interface StatCard {
  label: string
  value: string
  change: number
  changeLabel: string
  icon: string
}

export interface ChartDataPoint {
  name: string
  value: number
  secondary?: number
}

export interface AgentExecution {
  date: string
  executions: number
  failed: number
}

export interface TokenConsumption {
  date: string
  input: number
  output: number
}

export interface CostPerDay {
  date: string
  cost: number
}

export interface Workspace {
  id: string
  name: string
  plan: string
  region: string
}

export interface User {
  id: string
  name: string
  email: string
  role: "Admin" | "Developer" | "Viewer" | "Auditor"
  status: "active" | "invited" | "disabled"
  agents: number
  lastActive: Date
  avatar: string
}

export interface Policy {
  id: string
  name: string
  description: string
  resource: string
  action: string
  effect: "Allow" | "Block" | "Require Approval" | "Require MFA"
  status: "active" | "inactive"
  agents: number
  createdAt: Date
}

export interface MemoryStats {
  totalRetrievals: number
  vectorSearches: number
  chunksRetrieved: number
  avgSimilarity: number
  avgLatency: number
  contextSize: string
}

export interface SecurityIncident {
  id: string
  type: "prompt_injection" | "secrets_leak" | "permission_violation" | "blocked_request" | "data_access"
  severity: "critical" | "high" | "medium" | "low"
  agent: string
  description: string
  time: Date
  status: "open" | "investigating" | "resolved"
}

export interface BillingInfo {
  plan: string
  status: "active" | "past_due" | "canceled"
  monthlySpend: number
  projectedCost: number
  billingEmail: string
  nextBill: Date
}

export interface Invoice {
  id: string
  date: Date
  amount: number
  status: "paid" | "pending" | "overdue"
  description: string
}
