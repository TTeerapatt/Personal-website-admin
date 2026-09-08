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
import type { BiChartSlice } from "./biTypes";
import {
  BI_CHART_ANIMATION_MS,
  BiChartShell,
  biAxisTick,
  biTooltipItemStyle,
  biTooltipLabelStyle,
  biTooltipStyle,
} from "./biChartShared";

type BiHBarChartProps = {
  title: string;
  subtitle?: string;
  items: BiChartSlice[];
  emptyText: string;
  loading?: boolean;
  valueLabel?: string;
};

export default function BiHBarChart({
  title,
  subtitle,
  items,
  emptyText,
  loading = false,
  valueLabel = "Count",
}: BiHBarChartProps) {
  const chartHeight = Math.max(200, items.length * 44 + 40);

  return (
    <BiChartShell
      title={title}
      subtitle={subtitle}
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
            tick={biAxisTick}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={96}
            tick={biAxisTick}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-soft)", opacity: 0.55 }}
            contentStyle={biTooltipStyle}
            labelStyle={biTooltipLabelStyle}
            itemStyle={biTooltipItemStyle}
            formatter={(value) => [value, valueLabel]}
          />
          <Bar
            dataKey="value"
            radius={[0, 8, 8, 0]}
            isAnimationActive
            animationDuration={BI_CHART_ANIMATION_MS}
          >
            {items.map((item) => (
              <Cell key={item.label} fill={item.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </BiChartShell>
  );
}
