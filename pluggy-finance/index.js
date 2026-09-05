
import pg from "pg";

const BASE_URL = "https://api.pluggy.ai";

const { Pool } = pg;
let pool;

function getPool() {
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

async function authenticate() {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Faltam PLUGGY_CLIENT_ID e/ou PLUGGY_CLIENT_SECRET nas variáveis de ambiente."
    );
  }

  const res = await fetch(`${BASE_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha na autenticação (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.apiKey;
}

function getItemIds() {
  const raw = process.env.PLUGGY_ITEM_IDS;
  if (!raw) {
    throw new Error(
      "Falta PLUGGY_ITEM_IDS nas variáveis de ambiente. Copie os itemIds do dashboard.pluggy.ai (separados por vírgula, sem espaço)."
    );
  }
  return raw.split(",").map((id) => id.trim()).filter(Boolean);
}

async function getItem(apiKey, itemId) {
  const res = await fetch(`${BASE_URL}/items/${itemId}`, {
    headers: { "X-API-KEY": apiKey },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao buscar item ${itemId} (${res.status}): ${text}`);
  }

  return res.json();
}

async function getAccounts(apiKey, itemId) {
  const res = await fetch(`${BASE_URL}/accounts?itemId=${itemId}`, {
    headers: { "X-API-KEY": apiKey },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao buscar contas (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.results || [];
}

async function getTransactions(apiKey, accountId) {
  const res = await fetch(
    `${BASE_URL}/v2/transactions?accountId=${accountId}`,
    { headers: { "X-API-KEY": apiKey } }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao buscar transações (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.results || [];
}

async function getInvestments(apiKey, itemId) {
  const res = await fetch(`${BASE_URL}/investments?itemId=${itemId}`, {
    headers: { "X-API-KEY": apiKey },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao buscar investimentos (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.results || [];
}

async function upsertItem(item) {
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

async function upsertAccount(account, itemId) {
  const db = getPool();
  const creditLimit = account.creditData?.creditLimit ?? null;
  const availableCreditLimit = account.creditData?.availableCreditLimit ?? null;
  await db.query(
    `insert into openfinance.accounts (id, item_id, name, type, balance, currency_code, credit_limit, available_credit_limit, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, now())
     on conflict (id) do update set
       name = excluded.name,
       type = excluded.type,
       balance = excluded.balance,
       currency_code = excluded.currency_code,
       credit_limit = excluded.credit_limit,
       available_credit_limit = excluded.available_credit_limit,
       updated_at = now()`,
    [
      account.id,
      itemId,
      account.name,
      account.type,
      account.balance,
      account.currencyCode,
      creditLimit,
      availableCreditLimit,
    ]
  );
}

async function upsertInvestment(inv, itemId) {
  const db = getPool();
  await db.query(
    `insert into openfinance.investments (id, item_id, name, type, subtype, balance, currency_code, status, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, now())
     on conflict (id) do update set
       name = excluded.name,
       type = excluded.type,
       subtype = excluded.subtype,
       balance = excluded.balance,
       currency_code = excluded.currency_code,
       status = excluded.status,
       updated_at = now()`,
    [inv.id, itemId, inv.name, inv.type, inv.subtype, inv.balance, inv.currencyCode, inv.status]
  );
}

async function upsertTransaction(t) {
  const db = getPool();
  const billForecastDate = t.creditCardMetadata?.billForecastDate ?? null;
  await db.query(
    `insert into openfinance.transactions (id, account_id, date, description, amount, currency_code, category, status, bill_forecast_date)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     on conflict (id) do update set
       description = excluded.description,
       amount = excluded.amount,
       category = excluded.category,
       status = excluded.status,
       bill_forecast_date = excluded.bill_forecast_date`,
    [
      t.id,
      t.accountId,
      t.date?.slice(0, 10),
      t.description,
      t.amount,
      t.currencyCode,
      t.category,
      t.status,
      billForecastDate,
    ]
  );
}

async function main() {
  console.log("Autenticando na Pluggy...");
  const apiKey = await authenticate();
  console.log("OK — apiKey obtido.\n");

  const itemIds = getItemIds();
  console.log(`Buscando ${itemIds.length} item(ns) configurado(s) em PLUGGY_ITEM_IDS...\n`);

  for (const itemId of itemIds) {
    const item = await getItem(apiKey, itemId);
    console.log(`--- Item: ${item.connector?.name || item.id} (status: ${item.status}) ---`);

    if (item.status !== "UPDATED") {
      console.log(
        `  Aviso: status "${item.status}" — pode ser que a conexão ainda esteja processando ou precise de reautenticação.`
      );
    }

    await upsertItem(item);

    const investments = await getInvestments(apiKey, item.id);
    for (const inv of investments) {
      await upsertInvestment(inv, item.id);
    }
    console.log(`  ${investments.length} investimento(s) encontrado(s)`);

    const accounts = await getAccounts(apiKey, item.id);

    for (const account of accounts) {
      console.log(
        `  Conta: ${account.name} | tipo: ${account.type} | saldo: ${account.balance} ${account.currencyCode}`
      );

      await upsertAccount(account, item.id);

      const transactions = await getTransactions(apiKey, account.id);
      console.log(`    ${transactions.length} transações recentes:`);

      for (const t of transactions) {
        await upsertTransaction(t);
      }

      transactions.slice(0, 5).forEach((t) => {
        console.log(
          `      ${t.date?.slice(0, 10)} | ${t.description} | ${t.amount} ${account.currencyCode}`
        );
      });
    }

    console.log("");
  }

  await getPool().end();
  console.log("Dados salvos no banco.");
}

main().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});