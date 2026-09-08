"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DistributionItem } from "./overviewTypes";
import {
  CHART_ANIMATION_MS,
  OverviewChartShell,
  chartAxisTick,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipStyle,
} from "./overviewChartShared";

type OverviewDistributionChartProps = {
  title: string;
  items: DistributionItem[];
  emptyText: string;
  loading?: boolean;
};

export default function OverviewDistributionChart({
  title,
  items,
  emptyText,
  loading = false,
}: OverviewDistributionChartProps) {
  const chartHeight = Math.max(180, items.length * 44 + 40);

  return (
    <OverviewChartShell
      title={title}
      loading={loading}
      empty={items.length === 0}
      emptyText={emptyText}
      minHeight={chartHeight}
    >
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          layout="vertical"
          data={items}
          margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
          barCategoryGap="28%"
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            horizontal={false}
          />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={chartAxisTick}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={88}
            tick={chartAxisTick}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-soft)", opacity: 0.55 }}
            contentStyle={chartTooltipStyle}
            labelStyle={chartTooltipLabelStyle}
            itemStyle={chartTooltipItemStyle}
            formatter={(value) => [value, "Count"]}
          />
          <Bar
            dataKey="value"
            radius={[0, 8, 8, 0]}
            isAnimationActive
            animationBegin={0}
            animationDuration={CHART_ANIMATION_MS}
          >
            {items.map((item) => (
              <Cell key={item.label} fill={item.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </OverviewChartShell>
  );
}
