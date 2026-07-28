import type {
  Agent, ActivityEntry, Alert, SystemHealth,
  AgentExecution, TokenConsumption, CostPerDay, Workspace,
  User, Policy, MemoryStats, SecurityIncident, BillingInfo, Invoice,
} from "@/types"

export const workspaces: Workspace[] = [
  { id: "ws-1", name: "Production", plan: "Enterprise", region: "us-east-1" },
  { id: "ws-2", name: "Staging", plan: "Team", region: "eu-west-1" },
  { id: "ws-3", name: "Development", plan: "Team", region: "us-west-2" },
]

export const statsCards = [
  { label: "Running Agents", value: "847", change: 12.5, changeLabel: "vs last hour", icon: "Bot" },
  { label: "Failed Executions", value: "23", change: -8.3, changeLabel: "vs last hour", icon: "AlertTriangle" },
  { label: "API Requests", value: "1,337,291", change: 23.1, changeLabel: "vs yesterday", icon: "Activity" },
  { label: "Token Usage", value: "84.2M", change: 15.7, changeLabel: "vs yesterday", icon: "FileText" },
  { label: "Average Latency", value: "247ms", change: -5.2, changeLabel: "vs last hour", icon: "Clock" },
  { label: "Estimated Cost", value: "$12,847", change: 8.4, changeLabel: "vs yesterday", icon: "DollarSign" },
]

export const agents: Agent[] = [
  { id: "ag-1", name: "CodeReviewBot", status: "active", memoryUsed: "2.4 GB", tokens: 847_293, lastRun: new Date(Date.now() - 2 * 60000), model: "gpt-4o", permissions: ["code:read", "pr:write", "issue:read"], policyStatus: "compliant", category: "Development" },
  { id: "ag-2", name: "DataAnalystPro", status: "active", memoryUsed: "4.1 GB", tokens: 1_234_567, lastRun: new Date(Date.now() - 5 * 60000), model: "gpt-4o-mini", permissions: ["db:read", "db:write", "s3:read"], policyStatus: "compliant", category: "Data" },
  { id: "ag-3", name: "SupportAgentX", status: "error", memoryUsed: "1.8 GB", tokens: 567_890, lastRun: new Date(Date.now() - 1 * 60000), model: "gpt-4o", permissions: ["ticket:read", "ticket:write", "user:read"], policyStatus: "violation", category: "Support" },
  { id: "ag-4", name: "DeployBot", status: "active", memoryUsed: "0.9 GB", tokens: 123_456, lastRun: new Date(Date.now() - 10 * 60000), model: "gpt-4o-mini", permissions: ["deploy:write", "k8s:write", "monitor:read"], policyStatus: "compliant", category: "DevOps" },
  { id: "ag-5", name: "SecurityScanner", status: "active", memoryUsed: "3.2 GB", tokens: 2_345_678, lastRun: new Date(Date.now() - 3 * 60000), model: "gpt-4o", permissions: ["security:read", "audit:read", "alert:write"], policyStatus: "compliant", category: "Security" },
  { id: "ag-6", name: "ContentWriter", status: "paused", memoryUsed: "1.2 GB", tokens: 345_678, lastRun: new Date(Date.now() - 30 * 60000), model: "gpt-4o", permissions: ["content:write", "cdn:write", "search:read"], policyStatus: "pending", category: "Content" },
  { id: "ag-7", name: "MonitoringAgent", status: "active", memoryUsed: "5.6 GB", tokens: 4_567_890, lastRun: new Date(Date.now() - 1 * 60000), model: "gpt-4o", permissions: ["monitor:read", "alert:write", "metric:read"], policyStatus: "compliant", category: "Observability" },
  { id: "ag-8", name: "EmailAssistant", status: "idle", memoryUsed: "0.5 GB", tokens: 78_901, lastRun: new Date(Date.now() - 120 * 60000), model: "gpt-4o-mini", permissions: ["email:read", "email:send", "contact:read"], policyStatus: "compliant", category: "Communication" },
  { id: "ag-9", name: "SearchIndexer", status: "active", memoryUsed: "3.8 GB", tokens: 3_456_789, lastRun: new Date(Date.now() - 4 * 60000), model: "gpt-4o", permissions: ["search:write", "index:write", "s3:read"], policyStatus: "compliant", category: "Data" },
  { id: "ag-10", name: "TestRunner", status: "idle", memoryUsed: "0.7 GB", tokens: 234_567, lastRun: new Date(Date.now() - 60 * 60000), model: "gpt-4o-mini", permissions: ["test:read", "test:write", "ci:read"], policyStatus: "compliant", category: "Development" },
  { id: "ag-11", name: "DataLabeler", status: "active", memoryUsed: "1.5 GB", tokens: 678_901, lastRun: new Date(Date.now() - 8 * 60000), model: "gpt-4o", permissions: ["data:read", "data:write", "label:write"], policyStatus: "compliant", category: "Data" },
  { id: "ag-12", name: "ReportGenerator", status: "paused", memoryUsed: "2.1 GB", tokens: 456_789, lastRun: new Date(Date.now() - 45 * 60000), model: "gpt-4o", permissions: ["report:read", "report:write", "email:send"], policyStatus: "pending", category: "Content" },
]

export const recentActivity: ActivityEntry[] = Array.from({ length: 25 }, (_, i) => ({
  id: `act-${i}`,
  time: new Date(Date.now() - i * 3 * 60000),
  agent: agents[i % agents.length].name,
  action: ["code_review", "data_query", "ticket_response", "deploy_staging", "vulnerability_scan", "content_generate", "metric_alert", "email_reply"][i % 8],
  status: (["success", "success", "success", "failed", "success", "warning", "success", "success"] as const)[i % 8],
  duration: [234, 456, 123, 890, 345, 567, 234, 167][i % 8],
  cost: [0.0023, 0.0045, 0.0012, 0.0089, 0.0034, 0.0056, 0.0023, 0.0016][i % 8],
}))

export const allActivity: ActivityEntry[] = Array.from({ length: 50 }, (_, i) => ({
  id: `all-act-${i}`,
  time: new Date(Date.now() - i * 7 * 60000),
  agent: agents[i % agents.length].name,
  action: ["code_review", "data_query", "ticket_response", "deploy_staging", "vulnerability_scan", "content_generate", "metric_alert", "email_reply", "memory_retrieval", "policy_check"][i % 10],
  status: (["success", "success", "failed", "success", "warning", "success", "success", "failed", "success", "success"] as const)[i % 10],
  duration: [234, 456, 890, 123, 345, 567, 234, 167, 312, 89][i % 10],
  cost: [0.0023, 0.0045, 0.0089, 0.0012, 0.0034, 0.0056, 0.0023, 0.0016, 0.0031, 0.0008][i % 10],
}))

export const alerts: Alert[] = [
  { id: "al-1", type: "critical", message: "Permission denied: Agent SupportAgentX attempted to access admin API", agent: "SupportAgentX", time: new Date(Date.now() - 2 * 60000) },
  { id: "al-2", type: "critical", message: "Prompt injection detected in user input to CodeReviewBot", agent: "CodeReviewBot", time: new Date(Date.now() - 7 * 60000) },
  { id: "al-3", type: "warning", message: "High token usage: ContentWriter exceeded 300K tokens in last hour", agent: "ContentWriter", time: new Date(Date.now() - 15 * 60000) },
  { id: "al-4", type: "warning", message: "Memory limit reached for DataAnalystPro (4.1 GB / 4 GB)", agent: "DataAnalystPro", time: new Date(Date.now() - 22 * 60000) },
  { id: "al-5", type: "info", message: "Slow response detected: DeployBot took 4.2s to respond", agent: "DeployBot", time: new Date(Date.now() - 35 * 60000) },
  { id: "al-6", type: "info", message: "New model update available for SecurityScanner", agent: "SecurityScanner", time: new Date(Date.now() - 45 * 60000) },
  { id: "al-7", type: "warning", message: "Rate limit approaching for MonitoringAgent", agent: "MonitoringAgent", time: new Date(Date.now() - 55 * 60000) },
  { id: "al-8", type: "info", message: "DataLabeler completed batch processing 10K records", agent: "DataLabeler", time: new Date(Date.now() - 70 * 60000) },
]

export const systemHealth: SystemHealth = {
  cpu: 67,
  ram: 82,
  gpu: 45,
  apiAvailability: 99.97,
  database: 99.89,
  queue: 98.5,
}

export const agentExecutions: AgentExecution[] = [
  { date: "Mon", executions: 1240, failed: 23 },
  { date: "Tue", executions: 1380, failed: 18 },
  { date: "Wed", executions: 1520, failed: 31 },
  { date: "Thu", executions: 1100, failed: 12 },
  { date: "Fri", executions: 1680, failed: 27 },
  { date: "Sat", executions: 890, failed: 8 },
  { date: "Sun", executions: 720, failed: 5 },
  { date: "Mon", executions: 1450, failed: 19 },
  { date: "Tue", executions: 1580, failed: 22 },
  { date: "Wed", executions: 1320, failed: 15 },
  { date: "Thu", executions: 1710, failed: 29 },
  { date: "Fri", executions: 1430, failed: 34 },
  { date: "Sat", executions: 960, failed: 11 },
  { date: "Sun", executions: 810, failed: 7 },
]

export const tokenConsumption: TokenConsumption[] = [
  { date: "Mon", input: 45_000_000, output: 22_000_000 },
  { date: "Tue", input: 52_000_000, output: 28_000_000 },
  { date: "Wed", input: 48_000_000, output: 25_000_000 },
  { date: "Thu", input: 38_000_000, output: 19_000_000 },
  { date: "Fri", input: 62_000_000, output: 34_000_000 },
  { date: "Sat", input: 28_000_000, output: 14_000_000 },
  { date: "Sun", input: 22_000_000, output: 11_000_000 },
  { date: "Mon", input: 51_000_000, output: 27_000_000 },
  { date: "Tue", input: 58_000_000, output: 31_000_000 },
  { date: "Wed", input: 44_000_000, output: 23_000_000 },
  { date: "Thu", input: 55_000_000, output: 29_000_000 },
  { date: "Fri", input: 67_000_000, output: 36_000_000 },
  { date: "Sat", input: 32_000_000, output: 16_000_000 },
  { date: "Sun", input: 26_000_000, output: 13_000_000 },
]

export const costPerDay: CostPerDay[] = [
  { date: "Mon", cost: 847 },
  { date: "Tue", cost: 1024 },
  { date: "Wed", cost: 912 },
  { date: "Thu", cost: 756 },
  { date: "Fri", cost: 1189 },
  { date: "Sat", cost: 534 },
  { date: "Sun", cost: 423 },
  { date: "Mon", cost: 967 },
  { date: "Tue", cost: 1102 },
  { date: "Wed", cost: 878 },
  { date: "Thu", cost: 1045 },
  { date: "Fri", cost: 1278 },
  { date: "Sat", cost: 612 },
  { date: "Sun", cost: 498 },
]

export const agentSuccessRate = [
  { name: "Successful", value: 94.2 },
  { name: "Failed", value: 3.8 },
  { name: "Warning", value: 2.0 },
]

export const systemOverallStatus = {
  status: "healthy" as const,
  successRate: 97.8,
  errorRate: 2.2,
  responseTime: 247,
  uptime: 99.97,
}

export const users: User[] = [
  { id: "u-1", name: "Alice Chen", email: "alice@sentinel.ai", role: "Admin", status: "active", agents: 12, lastActive: new Date(Date.now() - 5 * 60000), avatar: "AC" },
  { id: "u-2", name: "Bob Martinez", email: "bob@sentinel.ai", role: "Developer", status: "active", agents: 8, lastActive: new Date(Date.now() - 15 * 60000), avatar: "BM" },
  { id: "u-3", name: "Carol Smith", email: "carol@sentinel.ai", role: "Developer", status: "active", agents: 5, lastActive: new Date(Date.now() - 2 * 60000), avatar: "CS" },
  { id: "u-4", name: "David Kim", email: "david@sentinel.ai", role: "Viewer", status: "active", agents: 0, lastActive: new Date(Date.now() - 60 * 60000), avatar: "DK" },
  { id: "u-5", name: "Eva Johansson", email: "eva@sentinel.ai", role: "Auditor", status: "active", agents: 0, lastActive: new Date(Date.now() - 120 * 60000), avatar: "EJ" },
  { id: "u-6", name: "Frank Wilson", email: "frank@sentinel.ai", role: "Developer", status: "invited", agents: 0, lastActive: new Date(Date.now() - 7 * 86400000), avatar: "FW" },
  { id: "u-7", name: "Grace Lee", email: "grace@sentinel.ai", role: "Admin", status: "active", agents: 15, lastActive: new Date(Date.now() - 3 * 60000), avatar: "GL" },
  { id: "u-8", name: "Henry Davis", email: "henry@sentinel.ai", role: "Developer", status: "disabled", agents: 2, lastActive: new Date(Date.now() - 30 * 86400000), avatar: "HD" },
]

export const policies: Policy[] = [
  { id: "p-1", name: "Database Read Access", description: "Allow agents to read from databases", resource: "db:*", action: "read", effect: "Allow", status: "active", agents: 6, createdAt: new Date(Date.now() - 90 * 86400000) },
  { id: "p-2", name: "Database Write Restriction", description: "Block unauthorized database writes", resource: "db:*", action: "write", effect: "Block", status: "active", agents: 8, createdAt: new Date(Date.now() - 85 * 86400000) },
  { id: "p-3", name: "Production Deploy Approval", description: "Require approval for production deployments", resource: "deploy:production", action: "write", effect: "Require Approval", status: "active", agents: 3, createdAt: new Date(Date.now() - 60 * 86400000) },
  { id: "p-4", name: "Financial Transfer MFA", description: "Require MFA for financial transactions", resource: "payment:transfer", action: "write", effect: "Require MFA", status: "active", agents: 2, createdAt: new Date(Date.now() - 45 * 86400000) },
  { id: "p-5", name: "Code Repository Read", description: "Allow reading code repositories", resource: "code:*", action: "read", effect: "Allow", status: "active", agents: 10, createdAt: new Date(Date.now() - 120 * 86400000) },
  { id: "p-6", name: "CRM Write Access", description: "Allow writing to CRM system", resource: "crm:*", action: "write", effect: "Allow", status: "active", agents: 4, createdAt: new Date(Date.now() - 30 * 86400000) },
  { id: "p-7", name: "Production Access MFA", description: "Require MFA for production environment access", resource: "env:production", action: "read", effect: "Require MFA", status: "active", agents: 5, createdAt: new Date(Date.now() - 20 * 86400000) },
  { id: "p-8", name: "Legacy API Restriction", description: "Block access to deprecated APIs", resource: "api:v1/*", action: "*", effect: "Block", status: "inactive", agents: 0, createdAt: new Date(Date.now() - 200 * 86400000) },
]

export const memoryStats: MemoryStats = {
  totalRetrievals: 1_847_293,
  vectorSearches: 892_341,
  chunksRetrieved: 5_678_901,
  avgSimilarity: 0.87,
  avgLatency: 34,
  contextSize: "128K",
}

export const securityIncidents: SecurityIncident[] = [
  { id: "si-1", type: "prompt_injection", severity: "critical", agent: "CodeReviewBot", description: "Malicious prompt detected in PR comment #4231", time: new Date(Date.now() - 7 * 60000), status: "open" },
  { id: "si-2", type: "permission_violation", severity: "critical", agent: "SupportAgentX", description: "Attempted admin API access without permission", time: new Date(Date.now() - 2 * 60000), status: "open" },
  { id: "si-3", type: "secrets_leak", severity: "high", agent: "DataAnalystPro", description: "API key pattern detected in output completion", time: new Date(Date.now() - 60 * 60000), status: "investigating" },
  { id: "si-4", type: "blocked_request", severity: "medium", agent: "ContentWriter", description: "Request to delete production database blocked", time: new Date(Date.now() - 120 * 60000), status: "resolved" },
  { id: "si-5", type: "data_access", severity: "medium", agent: "SearchIndexer", description: "Access to PII data without explicit consent", time: new Date(Date.now() - 180 * 60000), status: "investigating" },
  { id: "si-6", type: "prompt_injection", severity: "high", agent: "SupportAgentX", description: "Jailbreak attempt detected in support ticket", time: new Date(Date.now() - 240 * 60000), status: "resolved" },
  { id: "si-7", type: "blocked_request", severity: "low", agent: "DeployBot", description: "Deployment to unauthorized region blocked", time: new Date(Date.now() - 300 * 60000), status: "resolved" },
  { id: "si-8", type: "secrets_leak", severity: "medium", agent: "CodeReviewBot", description: "AWS credential pattern detected in code review", time: new Date(Date.now() - 360 * 60000), status: "resolved" },
]

export const billingInfo: BillingInfo = {
  plan: "Enterprise",
  status: "active",
  monthlySpend: 12847.32,
  projectedCost: 15230.00,
  billingEmail: "billing@sentinel.ai",
  nextBill: new Date(Date.now() + 14 * 86400000),
}

export const invoices: Invoice[] = [
  { id: "inv-001", date: new Date(Date.now() - 5 * 86400000), amount: 12847.32, status: "paid", description: "Sentinel AI Enterprise - June 2026" },
  { id: "inv-002", date: new Date(Date.now() - 35 * 86400000), amount: 11982.45, status: "paid", description: "Sentinel AI Enterprise - May 2026" },
  { id: "inv-003", date: new Date(Date.now() - 65 * 86400000), amount: 10567.89, status: "paid", description: "Sentinel AI Enterprise - April 2026" },
  { id: "inv-004", date: new Date(Date.now() - 95 * 86400000), amount: 9876.54, status: "paid", description: "Sentinel AI Enterprise - March 2026" },
  { id: "inv-005", date: new Date(Date.now() - 125 * 86400000), amount: 8934.21, status: "paid", description: "Sentinel AI Enterprise - February 2026" },
]

export const observabilityMetrics = {
  avgLatency: 247,
  p95Latency: 612,
  p99Latency: 1240,
  throughput: 42.3,
  errorRate: 2.2,
  retryRate: 1.8,
  activeConnections: 128,
}
