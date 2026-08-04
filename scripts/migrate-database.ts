import { readdir, readFile } from "node:fs/promises";
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
  const files = (await readdir("database"))
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort();
  for (const file of files) {
    const sql = await readFile(`database/${file}`, "utf8");
    await client.query(sql);
    console.log(`Applied ${file}`);
  }
  console.log("ATLAS database migrations completed.");
} finally {
  await client.end();
}
