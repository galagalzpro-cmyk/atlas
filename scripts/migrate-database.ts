import { readFile } from "node:fs/promises";
import pg from "pg";

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to run migrations");

const client = new Client({
  connectionString,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

await client.connect();
try {
  const sql = await readFile("database/001_foundation.sql", "utf8");
  await client.query(sql);
  console.log("ATLAS database migration completed.");
} finally {
  await client.end();
}
