"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ChartSlice } from "./overviewTypes";
import {
  CHART_ANIMATION_MS,
  OverviewChartShell,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipStyle,
} from "./overviewChartShared";

type OverviewDonutChartProps = {
  title: string;
  subtitle?: string;
  items: ChartSlice[];
  emptyText: string;
  loading?: boolean;
  centerLabel?: string;
};

export default function OverviewDonutChart({
  title,
  subtitle,
  items,
  emptyText,
  loading = false,
  centerLabel = "Total",
}: OverviewDonutChartProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <OverviewChartShell
      title={title}
      subtitle={subtitle}
      loading={loading}
      empty={items.length === 0 || total === 0}
      emptyText={emptyText}
      minHeight={220}
    >
      <div className="flex h-full min-h-[220px] flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="relative h-[200px] w-full max-w-[220px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={items}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={82}
                paddingAngle={items.length > 1 ? 2 : 0}
                stroke="none"
                isAnimationActive
                animationBegin={0}
                animationDuration={CHART_ANIMATION_MS}
              >
                {items.map((item) => (
                  <Cell key={item.label} fill={item.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={chartTooltipStyle}
                labelStyle={chartTooltipLabelStyle}
                itemStyle={chartTooltipItemStyle}
                formatter={(value, name) => {
                  const numeric = typeof value === "number" ? value : Number(value);
                  const percent =
                    total > 0 && Number.isFinite(numeric)
                      ? Math.round((numeric / total) * 100)
                      : 0;
                  return [`${numeric} (${percent}%)`, String(name)];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {centerLabel}
            </p>
            <p className="text-[24px] font-bold leading-none text-[var(--text-primary)]">
              {total}
            </p>
          </div>
        </div>

        <ul className="w-full min-w-0 space-y-2.5 sm:max-w-[180px]">
          {items.map((item) => {
            const percent =
              total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <li
                key={item.label}
                className="flex items-center justify-between gap-3 text-[13px]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate font-medium text-[var(--text-secondary)]">
                    {item.label}
                  </span>
                </span>
                <span className="shrink-0 font-bold text-[var(--text-primary)]">
                  {item.value}
                  <span className="ml-1 font-medium text-[var(--text-muted)]">
                    ({percent}%)
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </OverviewChartShell>
  );
}
