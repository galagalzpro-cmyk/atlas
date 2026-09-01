BEGIN;

ALTER TABLE atlas_sessions
  ADD COLUMN IF NOT EXISTS strong_auth_at timestamptz;

ALTER TABLE atlas_tool_connections
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error_code text;

CREATE UNIQUE INDEX IF NOT EXISTS atlas_tool_connections_user_provider_idx
  ON atlas_tool_connections(user_id, provider)
  WHERE user_id IS NOT NULL AND organization_id IS NULL;

CREATE TABLE IF NOT EXISTS atlas_connector_secret_records (
  id uuid PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES atlas_users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google','slack','github','linear')),
  purpose text NOT NULL CHECK (purpose IN ('connection_credential','pkce_verifier')),
  encrypted_payload bytea NOT NULL,
  encryption_nonce bytea NOT NULL,
  authentication_tag bytea NOT NULL,
  key_version text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS atlas_connector_secret_owner_idx
  ON atlas_connector_secret_records(owner_user_id, provider, purpose);
CREATE INDEX IF NOT EXISTS atlas_connector_secret_expiry_idx
  ON atlas_connector_secret_records(expires_at)
  WHERE expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS atlas_oauth_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES atlas_users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google','slack','github','linear')),
  state_hash text NOT NULL UNIQUE CHECK (length(state_hash) = 64),
  browser_binding_hash text NOT NULL CHECK (length(browser_binding_hash) = 64),
  verifier_reference text,
  requested_permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  redirect_uri text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS atlas_oauth_transactions_user_idx
  ON atlas_oauth_transactions(user_id, provider, created_at DESC);
CREATE INDEX IF NOT EXISTS atlas_oauth_transactions_expiry_idx
  ON atlas_oauth_transactions(expires_at)
  WHERE consumed_at IS NULL;

COMMIT;
