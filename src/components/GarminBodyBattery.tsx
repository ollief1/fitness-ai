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

interface DailySummary {
  date: string;
  body_battery_high?: number;
  body_battery_low?: number;
  avg_stress?: number;
  steps?: number;
  resting_hr?: number;
}

function batteryColor(value: number): string {
  if (value >= 60) return "#059669";
  if (value >= 30) return "#d97706";
  return "#dc2626";
}

export default function GarminBodyBattery({
  dailySummary,
}: {
  dailySummary: DailySummary[];
}) {
  const chartData = useMemo(() => {
    return [...dailySummary]
      .filter((d) => d.body_battery_high != null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        date: new Date(d.date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
        high: d.body_battery_high,
        low: d.body_battery_low,
      }));
  }, [dailySummary]);

  const latest = dailySummary.find(
    (d) => d.body_battery_high != null
  );
  if (!latest) return null;

  return (
    <div className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium text-gray-700">Body Battery</h2>
          <span className="text-xs text-gray-400">Today</span>
        </div>
        <div className="flex items-end gap-6">
          <div>
            <span
              className="text-3xl font-bold"
              style={{
                color: batteryColor(latest.body_battery_high || 0),
              }}
            >
              {latest.body_battery_high}
            </span>
            <span className="text-sm text-gray-400 ml-1">
              / {latest.body_battery_low} low
            </span>
          </div>
          <div className="flex gap-4 pb-1">
            {latest.avg_stress != null && (
              <div>
                <p className="text-xs text-gray-400">Stress</p>
                <p className="text-sm font-medium text-gray-800">
                  {latest.avg_stress}
                </p>
              </div>
            )}
            {latest.resting_hr != null && (
              <div>
                <p className="text-xs text-gray-400">Resting HR</p>
                <p className="text-sm font-medium text-gray-800">
                  {latest.resting_hr} bpm
                </p>
              </div>
            )}
            {latest.steps != null && (
              <div>
                <p className="text-xs text-gray-400">Steps</p>
                <p className="text-sm font-medium text-gray-800">
                  {latest.steps.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {chartData.length > 3 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Body Battery Trend
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
                domain={[0, 100]}
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
              />
              <defs>
                <linearGradient id="batteryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="high"
                stroke="#059669"
                fill="url(#batteryGrad)"
                strokeWidth={2}
                name="High"
              />
              <Area
                type="monotone"
                dataKey="low"
                stroke="#f59e0b"
                fill="none"
                strokeWidth={1}
                strokeDasharray="4 4"
                name="Low"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
