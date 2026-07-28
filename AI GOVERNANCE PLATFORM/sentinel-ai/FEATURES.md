# Sentinel AI — Features

## What it is

Enterprise Runtime Governance Platform for AI Agents. Sits between AI agents and external services — every LLM call, tool invocation, and data access flows through Sentinel for observability, security, cost control, and policy enforcement.

```
AI Agent → Sentinel SDK → Governance Layer → External World
```

## Architecture

5 layers:

1. **SDK** — wraps AI framework clients (OpenAI, etc.) via monkey-patching; auto-captures executions, tokens, cost, errors
2. **Event Collector** — gRPC/HTTP ingestion endpoints (`/api/events`, `/api/telemetry/ingest`)
3. **Processing Engine** — validation, enrichment, policy evaluation
4. **Database** — PostgreSQL on Supabase (9 tables: workspaces, users, agents, executions, events, policies, alerts, invoices, api_keys)
5. **Dashboard** — Next.js 16 App Router React app with real-time SSE streaming

## Features

### Dashboard & Monitoring
- Stats cards: running agents, failed executions, API requests, tokens, latency, cost
- System health: uptime, success/error rate, response time
- Charts: executions (line), token consumption (area), cost per day (bar), success rate (pie)
- Real-time activity feed + alerts panel (critical/warning/info)

### Agent Management
- Register, list, search, filter agents (status: active/paused/error/idle)
- Per-agent metrics: model, memory, tokens, permissions, policy status
- Actions: Run Now, Pause, Restart
- Execute agent against real OpenAI/Anthropic APIs with cost/token tracking

### Activity Feed
- Live event stream with status (success/failed/warning)
- Search/filter by agent name, action type, status
- Export functionality

### Policy Engine
- CRUD governance policies
- Effects: Allow, Block, Require Approval, Require MFA
- Resource-pattern rules (`db:*`, `deploy:production`)
- Toggle active/inactive, duplicate policies

### Security
- Incident tracking: prompt injection, secrets leak, permission violation, blocked requests, data access
- Severity levels (critical/high/medium/low)
- Status workflow: open → investigating → resolved

### Observability
- Latency (avg/P95/P99), throughput, error rate, retry rate, active connections
- Latency/throughput trend charts
- SLO compliance tracking (Availability, Latency, Error Rate)
- Time range selectors (1H/6H/24H/7D)

### Analytics
- Total executions, tokens, cost
- Model usage breakdown (bar chart): gpt-4o, gpt-4o-mini, claude-3, etc.
- Cost by category, token consumption trends
- Time periods (7D/30D/90D), export

### Memory Analytics
- Retrievals, vector searches, chunks, similarity scores
- Retrieval latency (P50/P95/P99)
- Methods: semantic, keyword, hybrid
- Per-agent memory usage

### Billing
- Current plan, monthly spend, projected cost, spend progress
- Invoice history (paid/pending/overdue), download

### User Management
- User list with roles (Admin/User), status (active/invited/disabled)
- Promote/demote, invite, admin-only access

### Settings
- Workspace name/region
- Appearance: compact sidebar, reduced motion
- API key management: create, reveal, copy, revoke

### Runtime Monitoring
- Real-time telemetry via Server-Sent Events
- Live event timeline (type, agent, severity, duration)
- System metrics: CPU%, RAM, uptime
- Session info: git branch, OS, Node version
- File watcher + process detection (Claude Code, OpenCode)
- Events/second rate display

### AI Proxy
- HTTP proxy forwarding to OpenAI / Anthropic
- Auto telemetry extraction + forwarding
- Model routing, provider-agnostic format

### CLI (`sentinel`)
- `sentinel run "prompt"` — execute prompt against registered agent
- `sentinel proxy` — start AI proxy server
- `sentinel monitor` — proxy + collector simultaneously

### Auth & Security
- Supabase Auth (email/password + OAuth)
- API key auth for SDK/collector
- Route protection middleware
- Admin role guard for user management
- Rate limiting (100 req/min per IP)

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 16.2, TypeScript, Tailwind CSS v4, shadcn/ui, Recharts, Framer Motion |
| State | TanStack React Query, SSE live stream |
| Backend | Next.js API routes, Supabase (PostgreSQL) |
| Auth | Supabase Auth (SSR + browser) |
| CLI | Node.js via tsx |

## Getting Started

```bash
npm install
npm run dev        # Start Next.js dev server
npm run sentinel   # CLI entry (or: npx tsx bin/sentinel.mjs)
npm run db:seed    # Seed database
```
