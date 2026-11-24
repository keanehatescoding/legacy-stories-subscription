import { migrate } from "drizzle-orm/node-postgres/migrator";
import { pgDb } from "@/db";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to migrate");
await migrate(pgDb, { migrationsFolder: "drizzle" });
console.log("Migrations applied.");
process.exit(0);
