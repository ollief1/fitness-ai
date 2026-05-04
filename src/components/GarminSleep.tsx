"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface GarminSleep {
  date: string;
  total_sleep_seconds: number;
  deep_sleep_seconds: number;
  light_sleep_seconds: number;
  rem_sleep_seconds: number;
  awake_seconds: number;
  score?: number;
  quality?: string;
  avg_respiration?: number;
}

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function scoreColor(score: number): string {
  if (score >= 80) return "#059669";
  if (score >= 60) return "#d97706";
  return "#dc2626";
}

export default function GarminSleepPanel({
  sleeps,
}: {
  sleeps: GarminSleep[];
}) {
  const chartData = useMemo(() => {
    return [...sleeps]
      .filter((s) => s.total_sleep_seconds > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map((s) => ({
        date: new Date(s.date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
        hours: +(s.total_sleep_seconds / 3600).toFixed(1),
      }));
  }, [sleeps]);

  const latest = sleeps.find((s) => s.total_sleep_seconds > 0);
  if (!latest) return null;

  return (
    <div className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium text-gray-700">Sleep</h2>
          <span className="text-xs text-gray-400">Last Night</span>
        </div>
        <div className="flex items-end gap-6">
          <div>
            <span className="text-3xl font-bold text-gray-900">
              {formatHours(latest.total_sleep_seconds)}
            </span>
          </div>
          <div className="flex gap-4 pb-1">
            {latest.score != null && (
              <div>
                <p className="text-xs text-gray-400">Score</p>
                <p
                  className="text-sm font-medium"
                  style={{ color: scoreColor(latest.score) }}
                >
                  {latest.score}
                </p>
              </div>
            )}
            {latest.deep_sleep_seconds > 0 && (
              <div>
                <p className="text-xs text-gray-400">Deep</p>
                <p className="text-sm font-medium text-gray-800">
                  {formatHours(latest.deep_sleep_seconds)}
                </p>
              </div>
            )}
            {latest.rem_sleep_seconds > 0 && (
              <div>
                <p className="text-xs text-gray-400">REM</p>
                <p className="text-sm font-medium text-gray-800">
                  {formatHours(latest.rem_sleep_seconds)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {chartData.length > 3 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Sleep Duration
          </h2>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData}>
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
                width={28}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`${value}h`, "Sleep"]}
              />
              <Bar dataKey="hours" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
