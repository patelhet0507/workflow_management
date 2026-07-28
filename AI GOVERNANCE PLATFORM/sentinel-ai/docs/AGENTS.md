# Agents

## Agent Lifecycle

```
Register → Idle → Execution Started → Policy Check → Model Call → Tool Calls → Memory Retrieval → Response Generated → Execution Finished → Store Events → Dashboard Updates
```

## Agent States

| State | Description |
|-------|-------------|
| `idle` | Registered but not currently executing |
| `active` | Currently processing a task |
| `paused` | Execution suspended by policy or user |
| `error` | Execution terminated with an error |

## Agent Registration

Every agent must be registered with Sentinel before it can execute. Registration captures:
- Name and description
- Owner and workspace
- Framework type (OpenAI, Anthropic, LangGraph, etc.)
- Model configuration
- Permission set
- Policy bindings

## Agent Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `name` | string | Human-readable name |
| `status` | enum | Current lifecycle state |
| `owner` | UUID | User who owns the agent |
| `workspace` | UUID | Workspace membership |
| `framework` | string | AI framework used |
| `model` | string | Default model |
| `version` | string | Agent version |
| `memory_used` | string | Current memory consumption |
| `token_usage` | integer | Lifetime token count |
| `execution_count` | integer | Total executions |
| `last_seen` | timestamp | Last activity timestamp |
| `permissions` | string[] | Granted permission list |
| `policy_status` | enum | Policy compliance state |

## Dashboard Display

Each agent card displays:
- Name, status indicator, owner
- Framework and model
- Version and memory usage
- Token usage and execution count
- Last seen timestamp
- Quick actions (run, pause, restart, view logs)
