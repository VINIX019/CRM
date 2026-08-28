import { formatBRL } from "@/lib/db";
import {
  getAccounts,
  getCategorySpending,
  getRecentTransactions,
  getLastSync,
} from "@/lib/queries";

export const dynamic = "force-dynamic"; // sempre busca dado fresco, nada de cache estático

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

  const maxCategoria = Math.max(
    0,
    ...categories.map((c) => Math.abs(Number(c.total)))
  );

  return (
    <main className="page">
      <div className="masthead">
        <h1>Extrato</h1>
        <div className="synced">
          {lastSync
            ? `Última sincronização: ${new Date(lastSync).toLocaleString("pt-BR")}`
            : "Ainda sem sincronização"}
        </div>
      </div>

      <div className="totals">
        <div className="total-block">
          <div className="label">Saldo em conta</div>
          <div className={`value ${saldoTotal >= 0 ? "credit" : "debit"}`}>
            {formatBRL(saldoTotal)}
          </div>
        </div>
        <div className="total-block">
          <div className="label">Fatura de cartões</div>
          <div className="value debit">{formatBRL(faturaTotal)}</div>
        </div>
      </div>

      <section>
        <h2>Contas</h2>
        {bankAccounts.map((a) => (
          <div className="account-row" key={a.id}>
            <span className="name">{a.name}</span>
            <span className="connector">{a.connector_name}</span>
            <span className="filler" />
            <span className="amount">{formatBRL(Number(a.balance))}</span>
          </div>
        ))}
      </section>

      <section>
        <h2>Cartões</h2>
        {creditAccounts.map((a) => (
          <div className="account-row" key={a.id}>
            <span className="name">{a.name}</span>
            <span className="connector">{a.connector_name}</span>
            <span className="filler" />
            <span className="amount">{formatBRL(Number(a.balance))}</span>
          </div>
        ))}
      </section>

      <section>
        <h2>Gastos por categoria · mês atual</h2>
        {categories.length === 0 ? (
          <p className="empty">Nenhum gasto registrado neste mês.</p>
        ) : (
          categories.map((c) => {
            const abs = Math.abs(Number(c.total));
            const pct = maxCategoria > 0 ? (abs / maxCategoria) * 100 : 0;
            return (
              <div className="category-row" key={c.category}>
                <div className="top">
                  <span className="cat-name">
                    {c.category} · {c.qtd}x
                  </span>
                  <span className="cat-value">{formatBRL(abs)}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        )}
      </section>

      <section>
        <h2>Últimos lançamentos</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Conta</th>
              <th>Descrição</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, i) => {
              const amount = Number(t.amount);
              return (
                <tr key={i}>
                  <td className="date">
                    {new Date(t.date).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="account">{t.account_name}</td>
                  <td>{t.description}</td>
                  <td className={`amount ${amount < 0 ? "debit" : "credit"}`}>
                    {formatBRL(amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}
