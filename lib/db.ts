import { neon, Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Basic HTTP driver for tagged-template queries (existing API)
export const sql = neon(process.env.DATABASE_URL);

// Pooled connection for lower latency via connection reuse
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
