import "server-only";
import { Pool, type QueryResultRow } from "pg";

let pool: Pool | null = null;

export function databaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDatabase(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 5_000,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export async function queryOne<T extends QueryResultRow>(text: string, values: unknown[] = []): Promise<T | null> {
  const result = await getDatabase().query<T>(text, values);
  return result.rows[0] ?? null;
}

export async function queryMany<T extends QueryResultRow>(text: string, values: unknown[] = []): Promise<T[]> {
  const result = await getDatabase().query<T>(text, values);
  return result.rows;
}
