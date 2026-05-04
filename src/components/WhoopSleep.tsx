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

interface Sleep {
  id: string;
  date: string;
  start: string;
  end: string;
  score?: {
    stage_summary?: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
    };
    sleep_performance_percentage?: number;
    sleep_efficiency_percentage?: number;
    respiratory_rate?: number;
  };
}

function formatHours(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

export default function WhoopSleep({ sleeps }: { sleeps: Sleep[] }) {
  const chartData = useMemo(() => {
    return [...sleeps]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14) // last 14 nights
      .map((s) => {
        const summary = s.score?.stage_summary;
        const totalSleep = summary
          ? (summary.total_light_sleep_time_milli +
              summary.total_slow_wave_sleep_time_milli +
              summary.total_rem_sleep_time_milli) /
            3600000
          : 0;

        return {
          date: new Date(s.date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          }),
          hours: Math.round(totalSleep * 10) / 10,
          performance: s.score?.sleep_performance_percentage ?? 0,
        };
      });
  }, [sleeps]);

  const latest = sleeps[0];
  const latestSummary = latest?.score?.stage_summary;

  if (!latest) return null;

  const totalSleepMs = latestSummary
    ? latestSummary.total_light_sleep_time_milli +
      latestSummary.total_slow_wave_sleep_time_milli +
      latestSummary.total_rem_sleep_time_milli
    : 0;

  return (
    <div className="space-y-3">
      {/* Last night's sleep */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium text-gray-700">Sleep</h2>
          <span className="text-xs text-gray-400">Last night</span>
        </div>
        <div className="flex items-end gap-6">
          <div>
            <span className="text-3xl font-bold text-gray-900">
              {totalSleepMs > 0 ? formatHours(totalSleepMs) : "—"}
            </span>
          </div>
          <div className="flex gap-4 pb-1">
            {latest.score?.sleep_performance_percentage != null && (
              <div>
                <p className="text-xs text-gray-400">Performance</p>
                <p className="text-sm font-medium text-gray-800">
                  {Math.round(latest.score.sleep_performance_percentage)}%
                </p>
              </div>
            )}
            {latest.score?.sleep_efficiency_percentage != null && (
              <div>
                <p className="text-xs text-gray-400">Efficiency</p>
                <p className="text-sm font-medium text-gray-800">
                  {Math.round(latest.score.sleep_efficiency_percentage)}%
                </p>
              </div>
            )}
            {latest.score?.respiratory_rate != null && (
              <div>
                <p className="text-xs text-gray-400">Resp Rate</p>
                <p className="text-sm font-medium text-gray-800">
                  {latest.score.respiratory_rate.toFixed(1)} rpm
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sleep trend */}
      {chartData.length > 3 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Sleep Duration (Last 14 Nights)
          </h2>
          <ResponsiveContainer width="100%" height={160}>
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
                formatter={(value: any) => [`${value} hrs`, "Sleep"]}
              />
              <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
