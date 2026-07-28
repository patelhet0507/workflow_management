import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const SQL = `
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'Enterprise',
  region TEXT DEFAULT 'us-east-1',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT CHECK (role IN ('Admin','Developer','Viewer','Auditor')) DEFAULT 'Developer',
  status TEXT CHECK (status IN ('active','invited','disabled')) DEFAULT 'active',
  agents INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  avatar TEXT,
  workspace_id UUID REFERENCES workspaces(id),
  api_key_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('active','paused','error','idle')) DEFAULT 'idle',
  memory_used TEXT DEFAULT '0 GB',
  tokens INTEGER DEFAULT 0,
  last_run TIMESTAMPTZ DEFAULT NOW(),
  ai_model TEXT DEFAULT 'gpt-4o',
  permissions TEXT[] DEFAULT '{}',
  policy_status TEXT CHECK (policy_status IN ('compliant','violation','pending')) DEFAULT 'compliant',
  category TEXT DEFAULT 'General',
  owner_id UUID REFERENCES users(id),
  workspace_id UUID REFERENCES workspaces(id),
  framework TEXT DEFAULT 'openai',
  version TEXT DEFAULT '1.0.0',
  execution_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  user_id UUID REFERENCES users(id),
  workspace_id UUID REFERENCES workspaces(id),
  status TEXT CHECK (status IN ('success','failed','pending','warning')) DEFAULT 'pending',
  provider TEXT DEFAULT 'openai',
  ai_model TEXT DEFAULT 'gpt-4o',
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  duration INTEGER DEFAULT 0,
  action TEXT DEFAULT 'unknown',
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  execution_id UUID REFERENCES executions(id),
  agent_id UUID REFERENCES agents(id),
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  data JSONB DEFAULT '{}',
  severity TEXT CHECK (severity IN ('info','warning','critical')) DEFAULT 'info',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  effect TEXT CHECK (effect IN ('Allow','Block','Require Approval','Require MFA')) NOT NULL,
  status TEXT CHECK (status IN ('active','inactive')) DEFAULT 'active',
  agents INTEGER DEFAULT 0,
  conditions JSONB DEFAULT '{}',
  workspace_id UUID REFERENCES workspaces(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('critical','warning','info')) NOT NULL,
  message TEXT NOT NULL,
  agent TEXT NOT NULL,
  time TIMESTAMPTZ DEFAULT NOW(),
  workspace_id UUID REFERENCES workspaces(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount REAL NOT NULL,
  status TEXT CHECK (status IN ('paid','pending','overdue')) DEFAULT 'pending',
  description TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  workspace_id UUID REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_type_timestamp ON events(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_executions_started ON executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_time ON alerts(time DESC);

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT false
);
`

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(SQL)
    console.log("Migration complete — all tables created")
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
