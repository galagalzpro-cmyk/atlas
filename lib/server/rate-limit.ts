import "server-only";
import { createHash } from "node:crypto";
import { getDatabase, databaseConfigured } from "./database";

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface LocalWindow {
  count: number;
  expiresAt: number;
}

const localWindows = new Map<string, LocalWindow>();

function hashKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function consumeLocalRateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): RateLimitDecision {
  const now = Date.now();
  const key = `${bucket}:${hashKey(identifier)}`;
  const current = localWindows.get(key);

  if (!current || current.expiresAt <= now) {
    localWindows.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: Math.max(0, limit - 1), retryAfterSeconds: windowSeconds };
  }

  current.count += 1;
  localWindows.set(key, current);
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds: Math.max(1, Math.ceil((current.expiresAt - now) / 1000)),
  };
}

export async function consumeRateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitDecision> {
  if (!databaseConfigured()) {
    return consumeLocalRateLimit(bucket, identifier, limit, windowSeconds);
  }

  const keyHash = hashKey(identifier);
  const result = await getDatabase().query<{ hit_count: number; retry_after: number }>(
    `WITH current_window AS (
       SELECT to_timestamp(floor(extract(epoch FROM now()) / $4) * $4) AS window_start
     ), upserted AS (
       INSERT INTO atlas_rate_limit_windows (key_hash, bucket, window_start, hit_count, expires_at)
       SELECT $1, $2, window_start, 1, window_start + make_interval(secs => $4)
       FROM current_window
       ON CONFLICT (key_hash, bucket, window_start)
       DO UPDATE SET hit_count = atlas_rate_limit_windows.hit_count + 1
       RETURNING hit_count, greatest(1, ceil(extract(epoch FROM (expires_at - now()))))::int AS retry_after
     ) SELECT hit_count, retry_after FROM upserted`,
    [keyHash, bucket, limit, windowSeconds],
  );
  const hitCount = result.rows[0]?.hit_count ?? limit + 1;
  const retryAfterSeconds = result.rows[0]?.retry_after ?? windowSeconds;
  return {
    allowed: hitCount <= limit,
    remaining: Math.max(0, limit - hitCount),
    retryAfterSeconds,
  };
}
