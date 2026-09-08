"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartSlice, StackedBarGroup } from "./overviewTypes";
import {
  CHART_ANIMATION_MS,
  OverviewChartShell,
  chartAxisTick,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipStyle,
} from "./overviewChartShared";

type OverviewStackedBarChartProps = {
  title: string;
  subtitle?: string;
  groups: StackedBarGroup[];
  legend: ChartSlice[];
  emptyText: string;
  loading?: boolean;
};

export default function OverviewStackedBarChart({
  title,
  subtitle,
  groups,
  legend,
  emptyText,
  loading = false,
}: OverviewStackedBarChartProps) {
  const hasData = groups.some((group) =>
    group.segments.some((segment) => segment.value > 0)
  );

  const chartData = useMemo(
    () =>
      groups.map((group) => {
        const row: Record<string, string | number> = { name: group.label };
        for (const segment of group.segments) {
          row[segment.label] = segment.value;
        }
        return row;
      }),
    [groups]
  );

  const series = useMemo(() => {
    const keys = new Map<string, string>();
    for (const group of groups) {
      for (const segment of group.segments) {
        keys.set(segment.label, segment.color);
      }
    }
    for (const item of legend) {
      if (!keys.has(item.label)) keys.set(item.label, item.color);
    }
    return Array.from(keys.entries()).map(([key, color]) => ({ key, color }));
  }, [groups, legend]);

  return (
    <OverviewChartShell
      title={title}
      subtitle={subtitle}
      loading={loading}
      empty={!hasData}
      emptyText={emptyText}
      minHeight={240}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
          barCategoryGap="28%"
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={chartAxisTick}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={chartAxisTick}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-soft)", opacity: 0.55 }}
            contentStyle={chartTooltipStyle}
            labelStyle={chartTooltipLabelStyle}
            itemStyle={chartTooltipItemStyle}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize: 12,
              color: "var(--text-secondary)",
              paddingBottom: 8,
            }}
          />
          {series.map((item, index) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              stackId="status"
              fill={item.color}
              radius={
                index === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
              }
              isAnimationActive
              animationBegin={index * 80}
              animationDuration={CHART_ANIMATION_MS}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </OverviewChartShell>
  );
}
