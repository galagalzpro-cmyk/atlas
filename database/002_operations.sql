BEGIN;

ALTER TABLE atlas_organizations
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE atlas_subscriptions
  ADD COLUMN IF NOT EXISTS provider_checkout_id text,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS atlas_subscriptions_checkout_idx
  ON atlas_subscriptions(provider, provider_checkout_id)
  WHERE provider_checkout_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS atlas_organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES atlas_organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('professional','organization_admin')),
  token_hash text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES atlas_users(id) ON DELETE RESTRICT,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS atlas_invitation_org_idx
  ON atlas_organization_invitations(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS atlas_invitation_email_idx
  ON atlas_organization_invitations(lower(email));

CREATE TABLE IF NOT EXISTS atlas_password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES atlas_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS atlas_password_reset_user_idx
  ON atlas_password_reset_tokens(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS atlas_consent_events (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES atlas_users(id) ON DELETE SET NULL,
  anonymous_id_hash text,
  category text NOT NULL CHECK (category IN ('preferences','analytics','marketing','external_ai')),
  granted boolean NOT NULL,
  policy_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR anonymous_id_hash IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS atlas_consent_user_idx
  ON atlas_consent_events(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS atlas_rate_limit_windows (
  key_hash text NOT NULL,
  bucket text NOT NULL,
  window_start timestamptz NOT NULL,
  hit_count integer NOT NULL DEFAULT 1 CHECK (hit_count > 0),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (key_hash, bucket, window_start)
);
CREATE INDEX IF NOT EXISTS atlas_rate_limit_expiry_idx
  ON atlas_rate_limit_windows(expires_at);

CREATE TABLE IF NOT EXISTS atlas_webhook_events (
  id bigserial PRIMARY KEY,
  provider text NOT NULL CHECK (provider IN ('stripe','paypal')),
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  payload_hash text NOT NULL,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','processing','processed','ignored','failed')),
  attempt_count integer NOT NULL DEFAULT 1,
  error_code text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE (provider, provider_event_id)
);
CREATE INDEX IF NOT EXISTS atlas_webhook_status_idx
  ON atlas_webhook_events(status, received_at DESC);

CREATE TABLE IF NOT EXISTS atlas_ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES atlas_users(id) ON DELETE SET NULL,
  audience text NOT NULL CHECK (audience IN ('adolescent','adult','senior')),
  local_safety_level text NOT NULL CHECK (local_safety_level IN ('standard','attention','urgent')),
  provider text NOT NULL,
  model text NOT NULL,
  status text NOT NULL CHECK (status IN ('local_fallback','completed','blocked','failed')),
  provider_request_id text,
  input_characters integer NOT NULL CHECK (input_characters >= 0),
  output_characters integer NOT NULL CHECK (output_characters >= 0),
  latency_ms integer NOT NULL CHECK (latency_ms >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS atlas_ai_runs_created_idx
  ON atlas_ai_runs(created_at DESC);

COMMIT;
