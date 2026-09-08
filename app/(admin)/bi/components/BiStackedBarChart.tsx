"use client";

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
import { CHART_TONE } from "@/app/lib/uiTone";
import {
  BI_CHART_ANIMATION_MS,
  BiChartShell,
  biAxisTick,
  biTooltipItemStyle,
  biTooltipLabelStyle,
  biTooltipStyle,
} from "./biChartShared";

type ActiveInactiveRow = {
  name: string;
  Active: number;
  Inactive: number;
};

type BiStackedBarChartProps = {
  title: string;
  subtitle?: string;
  rows: ActiveInactiveRow[];
  emptyText: string;
  loading?: boolean;
};

export default function BiStackedBarChart({
  title,
  subtitle,
  rows,
  emptyText,
  loading = false,
}: BiStackedBarChartProps) {
  const hasData = rows.some((row) => row.Active + row.Inactive > 0);

  return (
    <BiChartShell
      title={title}
      subtitle={subtitle}
      loading={loading}
      empty={!hasData}
      emptyText={emptyText}
      minHeight={260}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={rows}
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
            tick={biAxisTick}
            axisLine={false}
            tickLine={false}
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
          <Bar
            dataKey="Active"
            stackId="status"
            fill={CHART_TONE.active}
            radius={[0, 0, 0, 0]}
            isAnimationActive
            animationDuration={BI_CHART_ANIMATION_MS}
          />
          <Bar
            dataKey="Inactive"
            stackId="status"
            fill={CHART_TONE.inactive}
            radius={[4, 4, 0, 0]}
            isAnimationActive
            animationBegin={80}
            animationDuration={BI_CHART_ANIMATION_MS}
          />
        </BarChart>
      </ResponsiveContainer>
    </BiChartShell>
  );
}
