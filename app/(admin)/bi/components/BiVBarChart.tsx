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

type BiVBarChartProps = {
  title: string;
  subtitle?: string;
  items: BiChartSlice[];
  emptyText: string;
  loading?: boolean;
};

export default function BiVBarChart({
  title,
  subtitle,
  items,
  emptyText,
  loading = false,
}: BiVBarChartProps) {
  return (
    <BiChartShell
      title={title}
      subtitle={subtitle}
      loading={loading}
      empty={items.length === 0}
      emptyText={emptyText}
      minHeight={260}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={items}
          margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
          barCategoryGap="24%"
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={biAxisTick}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            allowDecimals={false}
            tick={biAxisTick}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-soft)", opacity: 0.55 }}
            contentStyle={biTooltipStyle}
            labelStyle={biTooltipLabelStyle}
            itemStyle={biTooltipItemStyle}
            formatter={(value) => [value, "Count"]}
          />
          <Bar
            dataKey="value"
            radius={[8, 8, 0, 0]}
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
