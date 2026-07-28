# Architecture

## System Overview

```
Developer Code
       ↓
  Sentinel SDK
       ↓
Event Collector
       ↓
Processing Engine
       ↓
   Database
       ↓
  Dashboard
```

## Layers

### 1. SDK Layer
Wraps AI frameworks (OpenAI, Anthropic, Gemini, Ollama, LangGraph, CrewAI, AutoGen, LlamaIndex, Semantic Kernel) and automatically captures execution, latency, errors, retries, prompts, completions, tool calls, model, provider, token usage, cost, and memory usage.

### 2. Event Collector
Receives events from the SDK over a secure gRPC/HTTP connection. Validates, enriches, and queues events for processing. Provides backpressure handling and retry logic.

### 3. Processing Engine
Processes events from the queue. Handles:
- Event enrichment (user context, workspace, policy lookups)
- Token and cost calculation
- Policy evaluation
- Alert generation
- Aggregation for dashboard widgets

### 4. Database
Stores all events, agent registrations, workspace config, policies, and aggregated metrics. Designed for high-ingestion, time-series query patterns.

### 5. Dashboard
Real-time React application consuming the Sentinel API. Displays live metrics, charts, activity streams, and management controls.

## Frontend Architecture

```
src/
├── app/           # Next.js App Router pages and layouts
├── components/
│   ├── ui/        # Reusable shadcn-style primitives
│   ├── layout/    # Sidebar, TopNav, Footer
│   └── dashboard/ # Dashboard-specific widgets
├── lib/           # Utilities, helpers, mock data
└── types/         # TypeScript type definitions
```

## Data Flow

1. Agent SDK captures execution event
2. Event sent to collector API
3. Processing engine validates and enriches
4. Event stored in database
5. Dashboard queries API for real-time display
6. Alerts generated when thresholds are breached
