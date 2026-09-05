"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";

type Slice = { label: string; value: number };

export default function DonutChart({ data }: { data: Slice[] }) {
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0) return null;

  return (
    <div style={{ width: "100%", height: 180, marginBottom: 8 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={filtered}
            dataKey="value"
            nameKey="label"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            stroke="none"
          >
            {filtered.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}