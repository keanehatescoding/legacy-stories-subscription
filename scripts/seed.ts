import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed");

const pool = new Pool({ connectionString, max: 1 });
try {
  const result = await pool.query("select 1 as ok");
  if (result.rows[0]?.ok !== 1) throw new Error("unexpected database response");
  console.log("Database reachable. No demo seed data is defined yet.");
} finally {
  await pool.end();
}
