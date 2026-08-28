import { Pool } from "pg";

// Este arquivo só é importado por Server Components e Route Handlers,
// então DATABASE_URL nunca é enviado ao navegador.

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
    });
  }
  return pool;
}

export function formatBRL(value: number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
