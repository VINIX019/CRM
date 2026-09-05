"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/format";

type Tx = {
  date: string;
  description: string;
  amount: string;
  account_name: string;
  account_type: "BANK" | "CREDIT";
};

export default function TransactionList({ transactions }: { transactions: Tx[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? transactions : transactions.slice(0, 5);

  return (
    <>
      {visible.map((t, i) => {
        const amount = Number(t.amount);
        const isDebit = t.account_type === "CREDIT" ? amount > 0 : amount < 0;
        return (
          <div className="tx-row" key={i}>
            <div className="info">
              <div className="desc">{t.description}</div>
              <div className="meta">
                {new Date(t.date).toLocaleDateString("pt-BR")} · {t.account_name}
              </div>
            </div>
            <div className={`amount ${isDebit ? "debit" : "credit"}`}>
              {formatBRL(amount)}
            </div>
          </div>
        );
      })}

      {transactions.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--ink-muted)",
            fontSize: 12,
            cursor: "pointer",
            padding: "10px 0 0",
            width: "100%",
            textAlign: "center",
          }}
        >
          {expanded ? "Ver menos" : `Ver mais ${transactions.length - 5}`}
        </button>
      )}
    </>
  );
}