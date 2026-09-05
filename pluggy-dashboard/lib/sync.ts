import { getPool } from "./db";
import {
  authenticate,
  getItemIds,
  getItem,
  getAccounts,
  getTransactions,
} from "./pluggy";

async function upsertItem(item: any) {
  const db = getPool();
  await db.query(
    `insert into openfinance.items (id, connector_name, status, last_synced_at)
     values ($1, $2, $3, now())
     on conflict (id) do update set
       connector_name = excluded.connector_name,
       status = excluded.status,
       last_synced_at = now()`,
    [item.id, item.connector?.name || null, item.status]
  );
}

async function upsertAccount(account: any, itemId: string) {
  const db = getPool();
  await db.query(
    `insert into openfinance.accounts (id, item_id, name, type, balance, currency_code, updated_at)
     values ($1, $2, $3, $4, $5, $6, now())
     on conflict (id) do update set
       name = excluded.name,
       type = excluded.type,
       balance = excluded.balance,
       currency_code = excluded.currency_code,
       updated_at = now()`,
    [account.id, itemId, account.name, account.type, account.balance, account.currencyCode]
  );
}

async function upsertTransaction(t: any) {
  const db = getPool();
  await db.query(
    `insert into openfinance.transactions (id, account_id, date, description, amount, currency_code, category, status)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (id) do update set
       description = excluded.description,
       amount = excluded.amount,
       category = excluded.category,
       status = excluded.status`,
    [
      t.id,
      t.accountId,
      t.date?.slice(0, 10),
      t.description,
      t.amount,
      t.currencyCode,
      t.category,
      t.status,
    ]
  );
}

export async function runSync() {
  const apiKey = await authenticate();
  const itemIds = getItemIds();

  let accountCount = 0;
  let transactionCount = 0;

  // Roda os items em paralelo (não sequencial) pra caber no timeout do Vercel
  await Promise.all(
    itemIds.map(async (itemId) => {
      const item = await getItem(apiKey, itemId);
      await upsertItem(item);

      const accounts = await getAccounts(apiKey, item.id);

      await Promise.all(
        accounts.map(async (account: any) => {
          await upsertAccount(account, item.id);
          accountCount++;

          const transactions = await getTransactions(apiKey, account.id);
          await Promise.all(transactions.map((t: any) => upsertTransaction(t)));
          transactionCount += transactions.length;
        })
      );
    })
  );

  return { items: itemIds.length, accounts: accountCount, transactions: transactionCount };
}