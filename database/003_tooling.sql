BEGIN;

CREATE TABLE IF NOT EXISTS atlas_tool_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES atlas_users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES atlas_organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  connection_type text NOT NULL CHECK (connection_type IN ('internal','api','oauth','mcp')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired','revoked','error')),
  external_account_hint text,
  granted_scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  secret_reference text,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR organization_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS atlas_tool_connections_user_idx
  ON atlas_tool_connections(user_id, status, provider);
CREATE INDEX IF NOT EXISTS atlas_tool_connections_org_idx
  ON atlas_tool_connections(organization_id, status, provider);

CREATE TABLE IF NOT EXISTS atlas_tool_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES atlas_users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES atlas_organizations(id) ON DELETE SET NULL,
  connection_id uuid REFERENCES atlas_tool_connections(id) ON DELETE SET NULL,
  tool_id text NOT NULL,
  domain text NOT NULL,
  risk text NOT NULL CHECK (risk IN ('read','write','sensitive')),
  approval_policy text NOT NULL CHECK (approval_policy IN ('automatic','confirm','strong_auth')),
  approval_state text NOT NULL DEFAULT 'not_required' CHECK (approval_state IN ('not_required','pending','approved','denied','expired')),
  status text NOT NULL CHECK (status IN ('planned','blocked','running','completed','failed','cancelled')),
  input_hash text,
  output_hash text,
  provider_request_id text,
  error_code text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS atlas_tool_runs_actor_idx
  ON atlas_tool_runs(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS atlas_tool_runs_tool_idx
  ON atlas_tool_runs(tool_id, created_at DESC);
CREATE INDEX IF NOT EXISTS atlas_tool_runs_status_idx
  ON atlas_tool_runs(status, created_at DESC);

CREATE TABLE IF NOT EXISTS atlas_tool_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_run_id uuid NOT NULL REFERENCES atlas_tool_runs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES atlas_users(id) ON DELETE CASCADE,
  method text NOT NULL CHECK (method IN ('explicit_confirmation','strong_auth')),
  decision text NOT NULL CHECK (decision IN ('approved','denied')),
  decision_context_hash text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS atlas_tool_approvals_run_idx
  ON atlas_tool_approvals(tool_run_id, created_at DESC);

COMMIT;
