import { createClient, type Client, type InArgs } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

const MIGRATIONS_DIR = path.join(__dirname, "db", "migrations");

let client: Client | null = null;

function getClient(): Client {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL não configurada — crie um banco no Turso e preencha o .env (ver .env.example)",
    );
  }
  client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return client;
}

export async function dbGet<T>(sql: string, args: InArgs = []): Promise<T | undefined> {
  const result = await getClient().execute({ sql, args });
  return result.rows[0] as unknown as T | undefined;
}

export async function dbAll<T>(sql: string, args: InArgs = []): Promise<T[]> {
  const result = await getClient().execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function dbRun(sql: string, args: InArgs = []): Promise<void> {
  await getClient().execute({ sql, args });
}

async function runMigrations(): Promise<void> {
  const db = getClient();
  await db.execute(
    "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
  );
  const applied = new Set(
    (await dbAll<{ name: string }>("SELECT name FROM _migrations")).map((row) => row.name),
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    await db.executeMultiple(sql);
    await dbRun("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)", [
      file,
      new Date().toISOString(),
    ]);
  }
}

let migrationsPromise: Promise<void> | null = null;

export function migrationsReady(): Promise<void> {
  if (!migrationsPromise) migrationsPromise = runMigrations();
  return migrationsPromise;
}
