import "dotenv/config";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const useSsl = process.env.DATABASE_SSL === "true";

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSsl
    ? {
        rejectUnauthorized: true,
      }
    : false,
});

export default pool;