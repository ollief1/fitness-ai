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

interface Recovery {
  date: string;
  recovery_score: number;
  resting_heart_rate: number;
  hrv_rmssd_milli: number;
}

function recoveryColor(score: number): string {
  if (score >= 67) return "#059669"; // green
  if (score >= 34) return "#d97706"; // amber
  return "#dc2626"; // red
}

export default function WhoopRecovery({
  recoveries,
}: {
  recoveries: Recovery[];
}) {
  const chartData = useMemo(() => {
    return [...recoveries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((r) => ({
        date: new Date(r.date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
        recovery: Math.round(r.recovery_score),
        hrv: Math.round(r.hrv_rmssd_milli),
        rhr: Math.round(r.resting_heart_rate),
      }));
  }, [recoveries]);

  const latest = recoveries[0];

  if (!latest) return null;

  return (
    <div className="space-y-3">
      {/* Today's recovery score */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium text-gray-700">
            Recovery
          </h2>
          <span className="text-xs text-gray-400">Today</span>
        </div>
        <div className="flex items-end gap-6">
          <div>
            <span
              className="text-3xl font-bold"
              style={{ color: recoveryColor(latest.recovery_score) }}
            >
              {Math.round(latest.recovery_score)}%
            </span>
          </div>
          <div className="flex gap-4 pb-1">
            <div>
              <p className="text-xs text-gray-400">HRV</p>
              <p className="text-sm font-medium text-gray-800">
                {Math.round(latest.hrv_rmssd_milli)} ms
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Resting HR</p>
              <p className="text-sm font-medium text-gray-800">
                {Math.round(latest.resting_heart_rate)} bpm
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recovery trend */}
      {chartData.length > 3 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Recovery Trend
          </h2>
          <ResponsiveContainer width="100%" height={160}>
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`${value}%`, "Recovery"]}
              />
              <defs>
                <linearGradient id="recoveryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="recovery"
                stroke="#059669"
                fill="url(#recoveryGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
