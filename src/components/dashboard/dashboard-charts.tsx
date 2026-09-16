"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = {
  planned: "#94a3b8",
  completed: "#2563eb",
  normal: "#2563eb",
  overtime: "#f59e0b",
  pm: "#059669",
  cm: "#dc2626",
};

export function MaintenanceTrendChart({
  data,
}: {
  data: { label: string; planned: number; completed: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="planned" name="Planned" fill={COLORS.planned} radius={[4, 4, 0, 0]} />
        <Bar dataKey="completed" name="Completed" fill={COLORS.completed} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PmCmTrendChart({
  data,
}: {
  data: { label: string; pmCompleted: number; cmCompleted: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="pmCompleted" name="PM Completed" stroke={COLORS.pm} strokeWidth={2} />
        <Line type="monotone" dataKey="cmCompleted" name="CM Completed" stroke={COLORS.cm} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ManHourTrendChart({
  data,
}: {
  data: { label: string; normal: number; overtime: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="normal" name="Normal Hours" stackId="a" fill={COLORS.normal} radius={[0, 0, 0, 0]} />
        <Bar dataKey="overtime" name="Overtime Hours" stackId="a" fill={COLORS.overtime} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
