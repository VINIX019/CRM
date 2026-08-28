import { getPool } from "./db";

export async function getAccounts() {
  const db = getPool();
  const res = await db.query(`
    select a.id, a.name, a.type, a.balance, i.connector_name
    from openfinance.accounts a
    join openfinance.items i on i.id = a.item_id
    order by a.type, a.name
  `);
  return res.rows as {
    id: string;
    name: string;
    type: "BANK" | "CREDIT";
    balance: string;
    connector_name: string;
  }[];
}

export async function getCategorySpending() {
  const db = getPool();
  const res = await db.query(`
    select coalesce(category, 'Sem categoria') as category,
           sum(amount) as total,
           count(*) as qtd
    from openfinance.transactions
    where amount < 0
      and date >= date_trunc('month', current_date)
    group by category
    order by total asc
  `);
  return res.rows as { category: string; total: string; qtd: string }[];
}

export async function getRecentTransactions(limit = 25) {
  const db = getPool();
  const res = await db.query(
    `
    select t.date, t.description, t.amount, a.name as account_name
    from openfinance.transactions t
    join openfinance.accounts a on a.id = t.account_id
    order by t.date desc
    limit $1
  `,
    [limit]
  );
  return res.rows as {
    date: string;
    description: string;
    amount: string;
    account_name: string;
  }[];
}

export async function getLastSync() {
  const db = getPool();
  const res = await db.query(
    `select max(last_synced_at) as last_synced_at from openfinance.items`
  );
  return res.rows[0]?.last_synced_at as string | null;
}
