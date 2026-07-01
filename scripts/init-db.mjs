// Apply db/schema.sql to the database in DATABASE_URL.
// Run with:  npm run db:init   (which passes --env-file=.env.local)
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "DATABASE_URL is not set. Add it to .env.local (Neon connection string) and retry.",
  );
  process.exit(1);
}

const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");

// Strip `--` line comments first (a comment may contain a ';', which would
// otherwise split a statement in half), then split on the real statement ';'.
const statements = schema
  .replace(/--[^\n]*/g, "")
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

const sql = neon(url);

try {
  for (const statement of statements) {
    await sql.query(statement);
    const firstLine = statement.split("\n")[0].slice(0, 60);
    console.log(`✓ ${firstLine}…`);
  }
  console.log(`\nDone — applied ${statements.length} statements.`);
} catch (err) {
  console.error("\nMigration failed:", err.message ?? err);
  process.exit(1);
}
