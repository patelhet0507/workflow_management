# Event Model

## Core Principle

Everything in Sentinel is an event. Every dashboard page, every metric, every alert — all built from events.

## Event Types

### Lifecycle Events
- `AgentStarted`
- `AgentFinished`
- `ExecutionStarted`
- `ExecutionFinished`
- `ExecutionFailed`
- `ExecutionSucceeded`

### Interaction Events
- `PromptSent`
- `CompletionReceived`
- `ToolCalled`
- `ToolFinished`
- `MemoryRetrieved`

### Governance Events
- `PolicyEvaluated`
- `PermissionDenied`
- `PermissionGranted`
- `RetryAttempt`

## Event Schema

Every event contains:

| Field | Type | Description |
|-------|------|-------------|
| `event_id` | UUID | Unique event identifier |
| `timestamp` | ISO8601 | Event occurrence time |
| `workspace_id` | UUID | Workspace context |
| `user_id` | UUID | User context |
| `agent_id` | UUID | Agent context |
| `execution_id` | UUID | Execution context |
| `provider` | string | LLM provider name |
| `model` | string | Model identifier |
| `latency_ms` | integer | Execution duration |
| `input_tokens` | integer | Prompt token count |
| `output_tokens` | integer | Completion token count |
| `total_tokens` | integer | Sum of tokens |
| `estimated_cost` | decimal | Calculated cost |
| `status` | enum | Event status |
| `metadata` | object | Extensible payload |

## Event Flow

```
Agent SDK → Event Collector → Validation → Enrichment → Storage → Dashboard
                               ↓
                          Alert Engine (if thresholds breached)
```

## Event Delivery

Events are delivered via:
1. **Real-time streaming** — WebSocket for live dashboard updates
2. **Batch ingestion** — HTTP POST for high-volume scenarios
3. **Guaranteed delivery** — At-least-once semantics with idempotency keys

## Retention

| Tier | Retention Period |
|------|-----------------|
| Free | 7 days |
| Team | 30 days |
| Enterprise | 90 days (configurable up to 1 year) |

Aggregated metrics are retained indefinitely.
