# Database

## Overview

Sentinel uses a PostgreSQL database with time-series extensions for event storage and analytics. The schema is designed for high-ingestion workloads typical of agent execution tracing.

## Core Tables

### agents

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique identifier |
| name | VARCHAR(255) | Agent name |
| owner_id | UUID FK → users | Owner |
| workspace_id | UUID FK → workspaces | Workspace |
| framework | VARCHAR(100) | AI framework |
| model | VARCHAR(255) | Default model |
| version | VARCHAR(50) | Agent version |
| status | ENUM | Current state |
| permissions | TEXT[] | Granted permissions |
| created_at | TIMESTAMPTZ | Creation time |
| updated_at | TIMESTAMPTZ | Last update |

### executions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Execution ID |
| agent_id | UUID FK → agents | Agent reference |
| user_id | UUID FK → users | Triggering user |
| workspace_id | UUID FK → workspaces | Workspace |
| status | ENUM | Execution outcome |
| provider | VARCHAR(100) | LLM provider |
| model | VARCHAR(255) | Model used |
| prompt_tokens | INTEGER | Input tokens |
| completion_tokens | INTEGER | Output tokens |
| total_tokens | INTEGER | Sum |
| cost | DECIMAL(12,8) | Estimated cost |
| duration_ms | INTEGER | Latency |
| started_at | TIMESTAMPTZ | Start time |
| finished_at | TIMESTAMPTZ | End time |
| metadata | JSONB | Extensible metadata |

### events

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Event ID |
| event_type | VARCHAR(100) | Event type name |
| execution_id | UUID FK → executions | Execution reference |
| agent_id | UUID FK → agents | Agent reference |
| workspace_id | UUID FK → workspaces | Workspace |
| user_id | UUID FK → users | User reference |
| timestamp | TIMESTAMPTZ | Event time |
| data | JSONB | Event payload |
| severity | ENUM | Severity level |

### policies

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Policy ID |
| name | VARCHAR(255) | Policy name |
| workspace_id | UUID FK → workspaces | Workspace |
| action | VARCHAR(100) | Action pattern |
| resource | VARCHAR(255) | Resource pattern |
| effect | ENUM(allow,block,require_approval) | Policy effect |
| conditions | JSONB | Condition expressions |
| enabled | BOOLEAN | Active state |
| created_at | TIMESTAMPTZ | Creation time |

### users

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | User ID |
| email | VARCHAR(255) UNIQUE | Email |
| name | VARCHAR(255) | Display name |
| role | ENUM | Workspace role |
| workspace_id | UUID FK → workspaces | Default workspace |
| api_key_hash | VARCHAR(255) | Hashed API key |
| created_at | TIMESTAMPTZ | Creation time |

### workspaces

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Workspace ID |
| name | VARCHAR(255) | Workspace name |
| plan | ENUM | Subscription plan |
| region | VARCHAR(50) | Deployment region |
| settings | JSONB | Workspace settings |
| created_at | TIMESTAMPTZ | Creation time |

## Indexes

- `executions_agent_id_idx` ON executions(agent_id)
- `executions_workspace_id_idx` ON executions(workspace_id)
- `executions_started_at_idx` ON executions(started_at DESC)
- `events_execution_id_idx` ON events(execution_id)
- `events_timestamp_idx` ON events(timestamp DESC)
- `events_type_idx` ON events(event_type)
- `agents_workspace_id_idx` ON agents(workspace_id)

## Partitioning

The `events` table is partitioned by month on `timestamp` to maintain query performance as data grows.
