import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("Adding fine_paid column to payments table...");
  try {
    await sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS fine_paid NUMERIC NOT NULL DEFAULT 0`;
    console.log("Column added successfully!");
    console.log("Backfilling: existing paid rows keep fine_paid = 0 (fine was zeroed at mark-paid time).");
  } catch (error) {
    console.error("Error adding column:", error);
    process.exit(1);
  }
}

run();
