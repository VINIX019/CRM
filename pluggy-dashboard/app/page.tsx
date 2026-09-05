import { formatBRL } from "@/lib/db";
import {
  getAccounts,
  getInvestments,
  getCategorySpending,
  getAvailableMonths,
  getRecentTransactions,
  getLastSync,
} from "@/lib/queries";
import SyncButton from "./sync-button";
import MonthSelector from "./month-selector";

export const dynamic = "force-dynamic";

const INVESTMENT_TYPE_LABELS: Record<string, string> = {
  FIXED_INCOME: "Renda fixa",
  SECURITY: "Previdência",
  MUTUAL_FUND: "Fundos",
  EQUITY: "Ações",
  ETF: "ETF",
  COE: "COE",
};

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const months = await getAvailableMonths();
  const selectedMonth = params.month || months[0] || currentMonth();

  const [accounts, investments, categories, transactions, lastSync] =
    await Promise.all([
      getAccounts(),
      getInvestments(),
      getCategorySpending(selectedMonth),
      getRecentTransactions(),
      getLastSync(),
    ]);

  const bankAccounts = accounts.filter((a) => a.type === "BANK");
  const creditAccounts = accounts.filter((a) => a.type === "CREDIT");

  const saldoTotal = bankAccounts.reduce((s, a) => s + Number(a.balance), 0);
  const faturaTotal = creditAccounts.reduce((s, a) => s + Number(a.balance), 0);
  const limiteTotal = creditAccounts.reduce(
    (s, a) => s + (Number(a.credit_limit) || 0),
    0
  );

  const totalGastoMes = categories.reduce(
    (s, c) => s + Math.abs(Number(c.total)),
    0
  );

  const investmentTotal = investments.reduce((s, i) => s + Number(i.balance), 0);
  const investmentsByType = investments.reduce((acc, inv) => {
    const key = inv.type;
    if (!acc[key]) acc[key] = { total: 0, count: 0 };
    acc[key].total += Number(inv.balance);
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  return (
    <main className="page">
      <div className="masthead">
        <h1>Extrato</h1>
        <div style={{ textAlign: "right" }}>
          <div className="synced">
            {lastSync
              ? new Date(lastSync).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "sem sync"}
          </div>
          <SyncButton />
        </div>
      </div>

      <div className="totals-grid">
        <div className="card">
          <div className="label">Saldo em conta</div>
          <div className={`big-value ${saldoTotal >= 0 ? "lime" : "debit"}`}>
            {formatBRL(saldoTotal)}
          </div>
        </div>
        <div className="card">
          <div className="label">Fatura de cartões</div>
          <div className="big-value debit">{formatBRL(faturaTotal)}</div>
        </div>
      </div>

      <div className="card">
        <div className="label">Contas bancárias</div>
        <div className="account-list">
          {bankAccounts.map((a) => (
            <div className="account-row" key={a.id}>
              <div className="info">
                <div className="name">{a.name}</div>
                <div className="connector">{a.connector_name}</div>
              </div>
              <div className="amount">{formatBRL(Number(a.balance))}</div>
            </div>
          ))}
        </div>

        <div className="label" style={{ marginTop: 20 }}>
          Cartões de crédito
        </div>
        {limiteTotal > 0 && (
          <>
            <div className="sub-value" style={{ marginBottom: 8 }}>
              {((faturaTotal / limiteTotal) * 100).toFixed(0)}% utilizado ·
              limite {formatBRL(limiteTotal)}
            </div>
            <div className="segment-bar" style={{ marginBottom: 18 }}>
              <div
                className="seg"
                style={{
                  width: `${Math.min((faturaTotal / limiteTotal) * 100, 100)}%`,
                  background: "var(--debit)",
                }}
              />
            </div>
          </>
        )}
        <div className="account-list">
          {creditAccounts.map((a) => (
            <div className="account-row" key={a.id}>
              <div className="info">
                <div className="name">{a.name}</div>
                <div className="connector">{a.connector_name}</div>
              </div>
              <div className="amount">{formatBRL(Number(a.balance))}</div>
            </div>
          ))}
        </div>
      </div>

      {investments.length > 0 && (
        <div className="card">
          <div className="label">Investimentos</div>
          <div className="big-value lime">{formatBRL(investmentTotal)}</div>
          <div className="sub-value" style={{ marginBottom: 16 }}>
            {investments.length} ativo(s) · {Object.keys(investmentsByType).length}{" "}
            classe(s)
          </div>
          {Object.entries(investmentsByType).map(([type, data]) => {
            const pct = investmentTotal > 0 ? (data.total / investmentTotal) * 100 : 0;
            return (
              <div className="category-row" key={type}>
                <div className="dot">
                  {(INVESTMENT_TYPE_LABELS[type] || type).slice(0, 1)}
                </div>
                <div className="info">
                  <div className="name">{INVESTMENT_TYPE_LABELS[type] || type}</div>
                  <div className="pct">
                    {pct.toFixed(0)}% · {data.count} ativo(s)
                  </div>
                </div>
                <div className="value">{formatBRL(data.total)}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div className="label" style={{ marginBottom: 0 }}>
            Gastos por categoria
          </div>
          <MonthSelector months={months.length > 0 ? months : [currentMonth()]} />
        </div>
        <div className="big-value debit">{formatBRL(totalGastoMes)}</div>

        {categories.length === 0 ? (
          <p className="empty">Nenhum gasto registrado neste mês.</p>
        ) : (
          categories.map((c) => {
            const abs = Math.abs(Number(c.total));
            const pct = totalGastoMes > 0 ? (abs / totalGastoMes) * 100 : 0;
            return (
              <div className="category-row" key={c.category}>
                <div className="dot">{c.category.slice(0, 1).toUpperCase()}</div>
                <div className="info">
                  <div className="name">{c.category}</div>
                  <div className="pct">
                    {pct.toFixed(0)}% dos gastos · {c.qtd}x
                  </div>
                </div>
                <div className="value">{formatBRL(abs)}</div>
              </div>
            );
          })
        )}
      </div>

      <div className="card">
        <div className="label">Últimos lançamentos</div>
        {transactions.map((t, i) => {
          const amount = Number(t.amount);
          const isDebit =
            t.account_type === "CREDIT" ? amount > 0 : amount < 0;
          return (
            <div className="tx-row" key={i}>
              <div className="info">
                <div className="desc">{t.description}</div>
                <div className="meta">
                  {new Date(t.date).toLocaleDateString("pt-BR")} ·{" "}
                  {t.account_name}
                </div>
              </div>
              <div className={`amount ${isDebit ? "debit" : "credit"}`}>
                {formatBRL(amount)}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}