# API Specification

Base URL: `https://api.sentinel.ai/v1`

Authentication: Bearer token via `Authorization` header.

## Endpoints

### Agents

#### List Agents

```
GET /agents
```

Query Parameters:
- `workspace_id` (string, required)
- `status` (string, optional): Filter by status
- `page` (integer, default: 1)
- `per_page` (integer, default: 20, max: 100)

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "CodeReviewBot",
      "status": "active",
      "owner": "uuid",
      "framework": "openai",
      "model": "gpt-4o",
      "version": "1.2.0",
      "memory_used": "2.4 GB",
      "token_usage": 847293,
      "execution_count": 1234,
      "last_seen": "2026-07-17T10:00:00Z",
      "permissions": ["code:read", "pr:write"],
      "policy_status": "compliant",
      "created_at": "2026-01-15T08:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 42,
    "total_pages": 3
  }
}
```

#### Get Agent

```
GET /agents/:id
```

#### Register Agent

```
POST /agents
```

#### Update Agent

```
PATCH /agents/:id
```

#### Delete Agent

```
DELETE /agents/:id
```

### Executions

#### List Executions

```
GET /executions
```

Query Parameters:
- `agent_id` (string, optional)
- `workspace_id` (string, required)
- `status` (string, optional)
- `from` (ISO timestamp, optional)
- `to` (ISO timestamp, optional)
- `page`, `per_page`

#### Get Execution

```
GET /executions/:id
```

#### Get Execution Events

```
GET /executions/:id/events
```

### Events

#### Ingest Event

```
POST /events
```

Used by the SDK to push execution events.

#### Query Events

```
GET /events
```

Query Parameters:
- `workspace_id` (required)
- `event_type` (optional)
- `agent_id` (optional)
- `from`, `to` (optional timestamps)

### Analytics

#### Dashboard Stats

```
GET /analytics/dashboard
```

Returns aggregated stats for the dashboard overview.

#### Token Usage

```
GET /analytics/tokens
```

#### Cost Analysis

```
GET /analytics/cost
```

### Policies

#### List Policies

```
GET /policies
```

#### Create Policy

```
POST /policies
```

#### Evaluate Policy

```
POST /policies/evaluate
```

### Workspaces

#### Get Workspace

```
GET /workspaces/:id
```

#### List Members

```
GET /workspaces/:id/members
```

### Errors

Standard error response:
```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests. Try again in 30 seconds.",
    "status": 429
  }
}
```

## Rate Limiting

- Free tier: 1,000 req/min
- Team tier: 10,000 req/min
- Enterprise tier: 100,000 req/min

Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
