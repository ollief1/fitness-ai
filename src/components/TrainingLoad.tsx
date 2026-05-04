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
  Legend,
} from "recharts";

interface Activity {
  type: string;
  start_date_local: string;
  moving_time: number;
  average_heartrate?: number;
  suffer_score?: number;
}

/**
 * Estimate training load per activity.
 * Uses Strava's suffer score if available, otherwise estimates from
 * duration and average HR (simplified TRIMP).
 */
function estimateLoad(act: Activity): number {
  if (act.suffer_score && act.suffer_score > 0) {
    return act.suffer_score;
  }
  // Simplified: duration in minutes × intensity factor
  const minutes = act.moving_time / 60;
  const hrFactor = act.average_heartrate
    ? Math.max(0.5, (act.average_heartrate - 60) / 100)
    : 0.7; // default moderate intensity
  return Math.round(minutes * hrFactor);
}

export default function TrainingLoad({
  activities,
}: {
  activities: Activity[];
}) {
  const chartData = useMemo(() => {
    // Build daily load for the last 28 days
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Need 28 extra days before window for chronic load calculation
    const extendedStart = new Date(now);
    extendedStart.setDate(extendedStart.getDate() - 56);

    // Map activities to daily load
    const dailyLoad: Record<string, number> = {};
    for (const act of activities) {
      const d = new Date(act.start_date_local);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      dailyLoad[key] = (dailyLoad[key] || 0) + estimateLoad(act);
    }

    // Generate day-by-day data with rolling averages
    const days: Array<{
      date: string;
      dateLabel: string;
      dailyLoad: number;
      acute: number;
      chronic: number;
      balance: number;
    }> = [];

    // Build all days from extendedStart to now
    const allDays: Array<{ key: string; load: number }> = [];
    const cursor = new Date(extendedStart);
    while (cursor <= now) {
      const key = cursor.toISOString().slice(0, 10);
      allDays.push({ key, load: dailyLoad[key] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Calculate rolling averages — only output the last 28 days
    for (let i = 0; i < allDays.length; i++) {
      // Acute load: 7-day rolling average
      const acuteWindow = allDays.slice(Math.max(0, i - 6), i + 1);
      const acute =
        acuteWindow.reduce((s, d) => s + d.load, 0) / acuteWindow.length;

      // Chronic load: 28-day rolling average
      const chronicWindow = allDays.slice(Math.max(0, i - 27), i + 1);
      const chronic =
        chronicWindow.reduce((s, d) => s + d.load, 0) / chronicWindow.length;

      // Only include the display window (last 28 days)
      const daysFromEnd = allDays.length - 1 - i;
      if (daysFromEnd < 28) {
        const d = new Date(allDays[i].key);
        days.push({
          date: allDays[i].key,
          dateLabel: d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          }),
          dailyLoad: allDays[i].load,
          acute: Math.round(acute),
          chronic: Math.round(chronic),
          balance: Math.round(acute - chronic),
        });
      }
    }

    return days;
  }, [activities]);

  const latestAcute = chartData[chartData.length - 1]?.acute || 0;
  const latestChronic = chartData[chartData.length - 1]?.chronic || 0;
  const balance = latestAcute - latestChronic;

  function balanceLabel(b: number): { text: string; color: string } {
    if (b > 15) return { text: "High load — watch fatigue", color: "#dc2626" };
    if (b > 5) return { text: "Building fitness", color: "#d97706" };
    if (b >= -5) return { text: "Maintaining", color: "#059669" };
    return { text: "Deloading / tapering", color: "#6366f1" };
  }

  const status = balanceLabel(balance);

  if (chartData.length < 3) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-700">Training Load</h2>
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-gray-400">Acute (7d): </span>
            <span className="font-medium text-gray-700">{latestAcute}</span>
          </div>
          <div>
            <span className="text-gray-400">Chronic (28d): </span>
            <span className="font-medium text-gray-700">{latestChronic}</span>
          </div>
          <span className="font-medium" style={{ color: status.color }}>
            {status.text}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
            interval={6}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          />
          <Legend
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: "#6b7280" }}
          />
          <defs>
            <linearGradient id="acuteGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="chronicGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="acute"
            stroke="#f59e0b"
            fill="url(#acuteGrad)"
            strokeWidth={2}
            name="Acute (7d)"
          />
          <Area
            type="monotone"
            dataKey="chronic"
            stroke="#2563eb"
            fill="url(#chronicGrad)"
            strokeWidth={2}
            name="Chronic (28d)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
