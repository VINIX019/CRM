import { Pool } from "pg";

let pool: Pool | undefined;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("Falta DATABASE_URL nas variáveis de ambiente.");
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 1, 
      idleTimeoutMillis: 10000,
    });
  }
  return pool;
}