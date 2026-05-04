"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface HRVData {
  date: string;
  weekly_avg?: number;
  last_night?: number;
  last_night_avg?: number;
  baseline_low?: number;
  baseline_high?: number;
  status?: string;
}

function statusColor(status?: string): string {
  switch (status) {
    case "BALANCED":
      return "#059669";
    case "LOW":
      return "#d97706";
    case "POOR":
      return "#dc2626";
    default:
      return "#6b7280";
  }
}

function statusLabel(status?: string): string {
  switch (status) {
    case "BALANCED":
      return "Balanced";
    case "LOW":
      return "Low";
    case "POOR":
      return "Poor";
    case "UNBALANCED":
      return "Unbalanced";
    default:
      return status || "—";
  }
}

export default function GarminHRVPanel({ hrvData }: { hrvData: HRVData[] }) {
  const chartData = useMemo(() => {
    return [...hrvData]
      .filter((h) => h.last_night != null || h.last_night_avg != null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((h) => ({
        date: new Date(h.date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
        hrv: h.last_night_avg ?? h.last_night ?? 0,
        weeklyAvg: h.weekly_avg,
      }));
  }, [hrvData]);

  const latest = hrvData.find(
    (h) => h.last_night != null || h.last_night_avg != null
  );
  if (!latest) return null;

  const hrvValue = Math.round(latest.last_night_avg ?? latest.last_night ?? 0);

  return (
    <div className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium text-gray-700">HRV</h2>
          <span className="text-xs text-gray-400">Last Night</span>
        </div>
        <div className="flex items-end gap-6">
          <div>
            <span className="text-3xl font-bold text-gray-900">
              {hrvValue}
            </span>
            <span className="text-sm text-gray-400 ml-1">ms</span>
          </div>
          <div className="flex gap-4 pb-1">
            {latest.status && (
              <div>
                <p className="text-xs text-gray-400">Status</p>
                <p
                  className="text-sm font-medium"
                  style={{ color: statusColor(latest.status) }}
                >
                  {statusLabel(latest.status)}
                </p>
              </div>
            )}
            {latest.weekly_avg != null && (
              <div>
                <p className="text-xs text-gray-400">7-day Avg</p>
                <p className="text-sm font-medium text-gray-800">
                  {Math.round(latest.weekly_avg)} ms
                </p>
              </div>
            )}
            {latest.baseline_low != null && latest.baseline_high != null && (
              <div>
                <p className="text-xs text-gray-400">Baseline</p>
                <p className="text-sm font-medium text-gray-800">
                  {Math.round(latest.baseline_low)}–
                  {Math.round(latest.baseline_high)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {chartData.length > 3 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            HRV Trend
          </h2>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => [
                  `${Math.round(value)} ms`,
                  name === "weeklyAvg" ? "7-day Avg" : "HRV",
                ]}
              />
              <defs>
                <linearGradient id="hrvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="hrv"
                stroke="#6366f1"
                fill="url(#hrvGrad)"
                strokeWidth={2}
                name="HRV"
              />
              <Area
                type="monotone"
                dataKey="weeklyAvg"
                stroke="#9ca3af"
                fill="none"
                strokeWidth={1}
                strokeDasharray="4 4"
                name="weeklyAvg"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
