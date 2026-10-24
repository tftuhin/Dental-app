import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

config({ path: ".env.local" });
config({ path: ".env" });

const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("No DATABASE_URL or DATABASE_URL_UNPOOLED found in environment");
  process.exit(1);
}

const sql = neon(dbUrl);

async function runMigration() {
  console.log("Connecting to Neon PostgreSQL direct endpoint...");
  const sqlFilePath = path.join(__dirname, "migrations", "0000_faulty_spyke.sql");
  const sqlContent = fs.readFileSync(sqlFilePath, "utf-8");

  const statements = sqlContent
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Executing ${statements.length} migration statements...`);

  let executed = 0;
  for (const statement of statements) {
    try {
      await (sql as any).query(statement);
      executed++;
    } catch (err: any) {
      // Ignore if type already exists or table already exists
      if (err.message && (err.message.includes("already exists") || err.message.includes("duplicate key"))) {
        console.log(`Notice (already exists, skipping): ${err.message.split("\n")[0]}`);
      } else {
        console.error("Migration error executing statement:", statement.substring(0, 80));
        console.error(err);
        throw err;
      }
    }
  }

  console.log(`Successfully completed migration! Executed/checked ${executed} statements.`);
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
