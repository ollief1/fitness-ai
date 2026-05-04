"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Cycle {
  id: string;
  date: string;
  strain?: number;
  kilojoule?: number;
  average_heart_rate?: number;
  max_heart_rate?: number;
}

function strainColor(strain: number): string {
  if (strain >= 18) return "#dc2626"; // red — very high
  if (strain >= 14) return "#d97706"; // amber — high
  if (strain >= 10) return "#2563eb"; // blue — moderate
  return "#6b7280"; // gray — light
}

export default function WhoopStrain({ cycles }: { cycles: Cycle[] }) {
  const chartData = useMemo(() => {
    return [...cycles]
      .filter((c) => c.strain != null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14)
      .map((c) => ({
        date: new Date(c.date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
        strain: Math.round((c.strain ?? 0) * 10) / 10,
      }));
  }, [cycles]);

  const latest = cycles.find((c) => c.strain != null);

  if (!latest || latest.strain == null) return null;

  return (
    <div className="space-y-3">
      {/* Today's strain */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium text-gray-700">Strain</h2>
          <span className="text-xs text-gray-400">Today</span>
        </div>
        <div className="flex items-end gap-6">
          <div>
            <span
              className="text-3xl font-bold"
              style={{ color: strainColor(latest.strain) }}
            >
              {latest.strain.toFixed(1)}
            </span>
            <span className="text-sm text-gray-400 ml-1">/ 21</span>
          </div>
          <div className="flex gap-4 pb-1">
            {latest.average_heart_rate != null && (
              <div>
                <p className="text-xs text-gray-400">Avg HR</p>
                <p className="text-sm font-medium text-gray-800">
                  {Math.round(latest.average_heart_rate)} bpm
                </p>
              </div>
            )}
            {latest.kilojoule != null && (
              <div>
                <p className="text-xs text-gray-400">Calories</p>
                <p className="text-sm font-medium text-gray-800">
                  {Math.round(latest.kilojoule * 0.239)} kcal
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Strain trend */}
      {chartData.length > 3 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Daily Strain Trend
          </h2>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                domain={[0, 21]}
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
                formatter={(value: any) => [value, "Strain"]}
              />
              <Line
                type="monotone"
                dataKey="strain"
                stroke="#d97706"
                strokeWidth={2}
                dot={{ r: 3, fill: "#d97706" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
