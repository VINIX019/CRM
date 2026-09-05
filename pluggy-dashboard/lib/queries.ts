import { getPool } from "./db";

const SELF_TRANSFER_NAME = "Vinicius Gabriel Almeida Xavier";

export async function getAccounts() {
  const db = getPool();
  const res = await db.query(`
    select a.id, a.name, a.type, a.balance, a.credit_limit, a.available_credit_limit,
           i.connector_name
    from openfinance.accounts a
    join openfinance.items i on i.id = a.item_id
    order by a.type, a.name
  `);
  return res.rows as {
    id: string;
    name: string;
    type: "BANK" | "CREDIT";
    balance: string;
    credit_limit: string | null;
    available_credit_limit: string | null;
    connector_name: string;
  }[];
}

export async function getInvestments() {
  const db = getPool();
  const res = await db.query(`
    select id, name, type, subtype, balance, currency_code
    from openfinance.investments
    where status is distinct from 'TOTAL_WITHDRAWAL'
    order by balance desc
  `);
  return res.rows as {
    id: string;
    name: string;
    type: string;
    subtype: string | null;
    balance: string;
    currency_code: string;
  }[];
}

// month no formato 'YYYY-MM'. Exclui transferências entre as próprias contas
// (identificadas pelo nome do titular aparecendo na descrição), e trata
// corretamente o sinal invertido de cartão de crédito (compra = positivo,
// pagamento de fatura = negativo — o oposto de conta corrente).
export async function getCategorySpending(month: string) {
  const db = getPool();
  const res = await db.query(
    `
    select coalesce(t.category, 'Sem categoria') as category,
           sum(case when a.type = 'CREDIT' then t.amount else -t.amount end) as total,
           count(*) as qtd
    from openfinance.transactions t
    join openfinance.accounts a on a.id = t.account_id
    where (
      (a.type = 'BANK' and t.amount < 0) or
      (a.type = 'CREDIT' and t.amount > 0)
    )
      and to_char(t.date, 'YYYY-MM') = $1
      and t.description not ilike $2
    group by t.category
    order by total desc
  `,
    [month, `%${SELF_TRANSFER_NAME}%`]
  );
  return res.rows as { category: string; total: string; qtd: string }[];
}

export async function getAvailableMonths() {
  const db = getPool();
  const res = await db.query(`
    select distinct to_char(date, 'YYYY-MM') as month
    from openfinance.transactions
    order by month desc
    limit 12
  `);
  return res.rows.map((r) => r.month as string);
}

export async function getRecentTransactions(limit = 25) {
  const db = getPool();
  const res = await db.query(
    `
    select t.date, t.description, t.amount, a.name as account_name, a.type as account_type
    from openfinance.transactions t
    join openfinance.accounts a on a.id = t.account_id
    where t.description not ilike $1
    order by t.date desc
    limit $2
  `,
    [`%${SELF_TRANSFER_NAME}%`, limit]
  );
  return res.rows as {
    date: string;
    description: string;
    amount: string;
    account_name: string;
    account_type: "BANK" | "CREDIT";
  }[];
}

export async function getLastSync() {
  const db = getPool();
  const res = await db.query(
    `select max(last_synced_at) as last_synced_at from openfinance.items`
  );
  return res.rows[0]?.last_synced_at as string | null;
}