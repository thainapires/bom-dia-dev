// Script de uso único: copia os dados do arquivo SQLite local
// (backend/data/bomdiadev.sqlite) pro banco Turso configurado em
// TURSO_DATABASE_URL/TURSO_AUTH_TOKEN. Rodar uma vez, depois que o app já
// tiver subido contra o Turso ao menos uma vez (pra criar o schema via
// runMigrations em src/db.ts). Ver script "migrate-to-turso" no package.json.
import { createClient } from "@libsql/client";
import path from "node:path";

const LOCAL_DB_PATH = path.join(__dirname, "..", "data", "bomdiadev.sqlite");
const TABLES = ["notes", "checklist_items", "daily_entries"];

async function main(): Promise<void> {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) {
    throw new Error("TURSO_DATABASE_URL não configurada — ver .env.example");
  }

  const local = createClient({ url: `file:${LOCAL_DB_PATH}` });
  const remote = createClient({ url, authToken });

  for (const table of TABLES) {
    const { rows, columns } = await local.execute(`SELECT * FROM ${table}`);
    console.log(`Migrando ${rows.length} linha(s) de "${table}"...`);

    for (const row of rows) {
      const placeholders = columns.map(() => "?").join(", ");
      const values = columns.map((column) => row[column]);
      await remote.execute({
        sql: `INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
        args: values as never,
      });
    }
  }

  console.log("Migração concluída.");
  local.close();
  remote.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
