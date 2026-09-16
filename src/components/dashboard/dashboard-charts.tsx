"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = {
  planned: "#94a3b8",
  completed: "#4f46e5",
  normal: "#4f46e5",
  overtime: "#f59e0b",
  pm: "#059669",
  cm: "#dc2626",
};

const AXIS_TICK = { fontSize: 12, fill: "var(--ink-muted)" };
const GRID_STROKE = "var(--line)";

export function MaintenanceTrendChart({
  data,
}: {
  data: { label: string; planned: number; completed: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis dataKey="label" tick={AXIS_TICK} />
        <YAxis tick={AXIS_TICK} allowDecimals={false} />
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
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis dataKey="label" tick={AXIS_TICK} />
        <YAxis tick={AXIS_TICK} allowDecimals={false} />
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
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis dataKey="label" tick={AXIS_TICK} />
        <YAxis tick={AXIS_TICK} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="normal" name="Normal Hours" stackId="a" fill={COLORS.normal} radius={[0, 0, 0, 0]} />
        <Bar dataKey="overtime" name="Overtime Hours" stackId="a" fill={COLORS.overtime} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PIE_PALETTE = ["#4f46e5", "#059669", "#f59e0b", "#dc2626", "#7c3aed", "#0d9488", "#64748b", "#0891b2"];

export function SimplePieChart({ data }: { data: { name: string; value: number }[] }) {
  const nonZero = data.filter((d) => d.value > 0);

  if (nonZero.length === 0) {
    return <p className="flex h-[220px] items-center justify-center text-sm text-ink-faint">No data for this selection.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={nonZero} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
          {nonZero.map((entry, i) => (
            <Cell key={entry.name} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
