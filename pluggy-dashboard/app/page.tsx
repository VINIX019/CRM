import { formatBRL } from "@/lib/db";
import {
  getAccounts,
  getCategorySpending,
  getRecentTransactions,
  getLastSync,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

const PALETTE = ["c1", "c2", "c3", "c4", "c5", "c6"];

export default async function Page() {
  const [accounts, categories, transactions, lastSync] = await Promise.all([
    getAccounts(),
    getCategorySpending(),
    getRecentTransactions(),
    getLastSync(),
  ]);

  const bankAccounts = accounts.filter((a) => a.type === "BANK");
  const creditAccounts = accounts.filter((a) => a.type === "CREDIT");

  const saldoTotal = bankAccounts.reduce((s, a) => s + Number(a.balance), 0);
  const faturaTotal = creditAccounts.reduce((s, a) => s + Number(a.balance), 0);

  const totalGastoMes = categories.reduce(
    (s, c) => s + Math.abs(Number(c.total)),
    0
  );

  return (
    <main className="page">
      <div className="masthead">
        <h1>Extrato</h1>
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
        <div className="label">Contas conectadas</div>
        <div className="account-list">
          {[...bankAccounts, ...creditAccounts].map((a) => (
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

      <div className="card">
        <div className="label">Gastos por categoria · mês atual</div>
        <div className="big-value debit">{formatBRL(totalGastoMes)}</div>

        {categories.length > 0 && (
          <div className="segment-bar" style={{ marginTop: 20 }}>
            {categories.map((c, i) => {
              const abs = Math.abs(Number(c.total));
              const pct = totalGastoMes > 0 ? (abs / totalGastoMes) * 100 : 0;
              return (
                <div
                  key={c.category}
                  className="seg"
                  style={{
                    width: `${pct}%`,
                    background: `var(--${PALETTE[i % PALETTE.length]})`,
                  }}
                />
              );
            })}
          </div>
        )}

        {categories.length === 0 ? (
          <p className="empty">Nenhum gasto registrado neste mês.</p>
        ) : (
          categories.map((c, i) => {
            const abs = Math.abs(Number(c.total));
            const pct = totalGastoMes > 0 ? (abs / totalGastoMes) * 100 : 0;
            const color = `var(--${PALETTE[i % PALETTE.length]})`;
            return (
              <div className="category-row" key={c.category}>
                <div className="dot" style={{ background: color }}>
                  {c.category.slice(0, 1).toUpperCase()}
                </div>
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
          return (
            <div className="tx-row" key={i}>
              <div className="info">
                <div className="desc">{t.description}</div>
                <div className="meta">
                  {new Date(t.date).toLocaleDateString("pt-BR")} ·{" "}
                  {t.account_name}
                </div>
              </div>
              <div className={`amount ${amount < 0 ? "debit" : "credit"}`}>
                {formatBRL(amount)}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}