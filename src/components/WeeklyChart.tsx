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

interface Activity {
  type: string;
  start_date_local: string;
  moving_time: number;
}

export default function WeeklyChart({
  activities,
}: {
  activities: Activity[];
}) {
  const weekData = useMemo(() => {
    const now = new Date();
    const weeks: Record<string, { week: string; hours: number }> = {};

    // Last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const weekStart = new Date(d);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
      const key = weekStart.toISOString().slice(0, 10);
      const label = weekStart.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      weeks[key] = { week: label, hours: 0 };
    }

    for (const act of activities) {
      const d = new Date(act.start_date_local);
      const weekStart = new Date(d);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      const key = weekStart.toISOString().slice(0, 10);
      if (weeks[key]) {
        weeks[key].hours += act.moving_time / 3600;
      }
    }

    return Object.values(weeks).map((w) => ({
      ...w,
      hours: Math.round(w.hours * 10) / 10,
    }));
  }, [activities]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-sm font-medium text-gray-700 mb-4">
        Weekly Training Hours
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={weekData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${value} hrs`, "Training"]}
          />
          <Bar dataKey="hours" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
