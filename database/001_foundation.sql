BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS atlas_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  platform_role text NOT NULL DEFAULT 'member' CHECK (platform_role IN ('visitor','member','professional','organization_admin','atlas_admin')),
  email_verified_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS atlas_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES atlas_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  user_agent_hash text,
  ip_prefix_hash text
);
CREATE INDEX IF NOT EXISTS atlas_sessions_user_idx ON atlas_sessions(user_id);
CREATE INDEX IF NOT EXISTS atlas_sessions_expiry_idx ON atlas_sessions(expires_at) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS atlas_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial','active','suspended','closed')),
  created_by uuid NOT NULL REFERENCES atlas_users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS atlas_organization_memberships (
  organization_id uuid NOT NULL REFERENCES atlas_organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES atlas_users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('professional','organization_admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('invited','active','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);
CREATE INDEX IF NOT EXISTS atlas_membership_user_idx ON atlas_organization_memberships(user_id);

CREATE TABLE IF NOT EXISTS atlas_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES atlas_organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES atlas_users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('stripe','paypal')),
  provider_customer_id text,
  provider_subscription_id text UNIQUE,
  plan_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('incomplete','trialing','active','past_due','canceled','unpaid')),
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((organization_id IS NOT NULL) <> (user_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS atlas_audit_events (
  id bigserial PRIMARY KEY,
  actor_user_id uuid REFERENCES atlas_users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES atlas_organizations(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  outcome text NOT NULL CHECK (outcome IN ('success','denied','failure')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS atlas_audit_created_idx ON atlas_audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS atlas_audit_actor_idx ON atlas_audit_events(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS atlas_audit_org_idx ON atlas_audit_events(organization_id, created_at DESC);

COMMIT;
