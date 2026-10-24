import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://placeholder:placeholder@ep-empty-build-placeholder.us-east-2.aws.neon.tech/neondb?sslmode=require";

if (!process.env.DATABASE_URL) {
  console.warn(
    "⚠️ [DentalOS1 Database] DATABASE_URL environment variable is not defined. Using build-time placeholder connection string."
  );
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });

export type Database = typeof db;
