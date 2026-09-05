"use client";

import { useRouter, useSearchParams } from "next/navigation";

function formatMonthLabel(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default function MonthSelector({ months }: { months: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("month") || months[0];

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(`?month=${e.target.value}`);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      style={{
        background: "var(--surface-2)",
        color: "var(--ink)",
        border: "none",
        borderRadius: 999,
        padding: "6px 12px",
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {months.map((m) => (
        <option key={m} value={m}>
          {formatMonthLabel(m)}
        </option>
      ))}
    </select>
  );
}