"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BiTrendPoint } from "./biTypes";
import {
  BI_CHART_ANIMATION_MS,
  BiChartShell,
  biAxisTick,
  biTooltipItemStyle,
  biTooltipLabelStyle,
  biTooltipStyle,
} from "./biChartShared";

type BiActivityAreaChartProps = {
  title: string;
  subtitle?: string;
  points: BiTrendPoint[];
  emptyText: string;
  loading?: boolean;
};

export default function BiActivityAreaChart({
  title,
  subtitle,
  points,
  emptyText,
  loading = false,
}: BiActivityAreaChartProps) {
  const hasData = points.some((point) => point.total > 0);

  return (
    <BiChartShell
      title={title}
      subtitle={subtitle}
      loading={loading}
      empty={!hasData}
      emptyText={emptyText}
      minHeight={280}
    >
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart
          data={points}
          margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
        >
          <defs>
            <linearGradient id="biTotalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5b86ff" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#5b86ff" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="biMutateFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            allowDecimals={false}
            tick={biAxisTick}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
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
          <Area
            type="monotone"
            dataKey="total"
            name="Total"
            stroke="#5b86ff"
            fill="url(#biTotalFill)"
            strokeWidth={2}
            isAnimationActive
            animationDuration={BI_CHART_ANIMATION_MS}
          />
          <Area
            type="monotone"
            dataKey="mutate"
            name="Mutations"
            stroke="#fbbf24"
            fill="url(#biMutateFill)"
            strokeWidth={2}
            isAnimationActive
            animationBegin={80}
            animationDuration={BI_CHART_ANIMATION_MS}
          />
        </AreaChart>
      </ResponsiveContainer>
    </BiChartShell>
  );
}
