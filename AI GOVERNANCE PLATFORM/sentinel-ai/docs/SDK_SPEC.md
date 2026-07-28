# SDK Specification

## Overview

The Sentinel SDK wraps AI frameworks to automatically capture execution data. Developers integrate Sentinel once and get observability, governance, and cost tracking for free — no manual instrumentation required.

## Supported Frameworks

| Framework | Status |
|-----------|--------|
| OpenAI | ⏳ Planned |
| Anthropic | ⏳ Planned |
| Gemini | ⏳ Planned |
| Ollama | ⏳ Planned |
| LangGraph | ⏳ Planned |
| CrewAI | ⏳ Planned |
| OpenAI Agents SDK | ⏳ Planned |
| AutoGen | ⏳ Planned |
| LlamaIndex | ⏳ Planned |
| Semantic Kernel | ⏳ Planned |
| OpenTelemetry | 🔮 Future |

## Installation

```bash
npm install @sentinel-ai/sdk
# or
pip install sentinel-sdk
```

## Usage

### Python (OpenAI)

```python
from sentinel import Sentinel
from openai import OpenAI

sentinel = Sentinel(api_key="sk-...")
client = sentinel.wrap(OpenAI())

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}]
)
# Execution is automatically captured
```

### TypeScript (OpenAI)

```typescript
import { Sentinel } from "@sentinel-ai/sdk";
import OpenAI from "openai";

const sentinel = new Sentinel({ apiKey: "sk-..." });
const client = sentinel.wrap(new OpenAI());

const response = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello" }],
});
```

## Automatic Capture

The SDK automatically captures:

| Metric | Description |
|--------|-------------|
| Execution | Start/end timestamps |
| Latency | Duration in milliseconds |
| Errors | Error type, message, stack trace |
| Retries | Retry count and reason |
| Prompts | Input message content |
| Completions | Output message content |
| Tool Calls | Tool name, input, output |
| Model | Model identifier |
| Provider | API provider name |
| Token Usage | Input, output, total |
| Cost | Estimated cost per call |
| Memory Usage | Agent memory consumption |

## Configuration

```python
sentinel = Sentinel(
    api_key="sk-...",
    workspace_id="ws-...",
    agent_id="ag-...",
    capture_prompts=True,        # Enable prompt logging
    capture_completions=True,    # Enable completion logging
    max_prompt_length=10000,     # Truncate long prompts
    redact_patterns=[            # Auto-redact sensitive data
        r"sk-[a-zA-Z0-9]+",
        r"AKIA[0-9A-Z]{16}",
    ],
)
```

## Policy Enforcement

The SDK checks policies before allowing operations:

```python
# Policy violation raises SentinelPolicyError
# The error includes the policy name, rule, and remediation
```

## Development Rules

- Developers should not manually log anything
- Everything is an event
- All events flow through Sentinel's governance layer
