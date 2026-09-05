const BASE_URL = "https://api.pluggy.ai";

export async function authenticate() {
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
    throw new Error(`Falha na autenticação (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data.apiKey as string;
}

export function getItemIds() {
  const raw = process.env.PLUGGY_ITEM_IDS;
  if (!raw) {
    throw new Error("Falta PLUGGY_ITEM_IDS nas variáveis de ambiente.");
  }
  return raw.split(",").map((id) => id.trim()).filter(Boolean);
}

export async function getItem(apiKey: string, itemId: string) {
  const res = await fetch(`${BASE_URL}/items/${itemId}`, {
    headers: { "X-API-KEY": apiKey },
  });
  if (!res.ok) {
    throw new Error(`Falha ao buscar item ${itemId} (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

export async function getAccounts(apiKey: string, itemId: string) {
  const res = await fetch(`${BASE_URL}/accounts?itemId=${itemId}`, {
    headers: { "X-API-KEY": apiKey },
  });
  if (!res.ok) {
    throw new Error(`Falha ao buscar contas (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.results || [];
}

export async function getTransactions(apiKey: string, accountId: string) {
  const res = await fetch(`${BASE_URL}/v2/transactions?accountId=${accountId}`, {
    headers: { "X-API-KEY": apiKey },
  });
  if (!res.ok) {
    throw new Error(`Falha ao buscar transações (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.results || [];
}

export async function getInvestments(apiKey: string, itemId: string) {
  const res = await fetch(`${BASE_URL}/investments?itemId=${itemId}`, {
    headers: { "X-API-KEY": apiKey },
  });
  if (!res.ok) {
    throw new Error(`Falha ao buscar investimentos (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.results || [];
}