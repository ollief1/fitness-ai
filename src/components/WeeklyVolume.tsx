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
  Legend,
} from "recharts";

interface Activity {
  type: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
}

type Discipline = "swim" | "bike" | "run" | "other";

function classifyActivity(type: string): Discipline {
  if (type === "Swim") return "swim";
  if (type === "Ride" || type === "VirtualRide" || type === "EBikeRide")
    return "bike";
  if (type === "Run" || type === "Trail Run") return "run";
  return "other";
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatKm(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

interface WeekRow {
  weekLabel: string;
  weekKey: string;
  swim: number;
  bike: number;
  run: number;
  other: number;
  total: number;
  swimDist: number;
  bikeDist: number;
  runDist: number;
  swimCount: number;
  bikeCount: number;
  runCount: number;
}

export default function WeeklyVolume({
  activities,
}: {
  activities: Activity[];
}) {
  const weeks = useMemo(() => {
    const now = new Date();
    const result: Record<string, WeekRow> = {};

    // Build last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const monday = getMonday(d);
      const key = monday.toISOString().slice(0, 10);
      const label = monday.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      result[key] = {
        weekLabel: label,
        weekKey: key,
        swim: 0, bike: 0, run: 0, other: 0, total: 0,
        swimDist: 0, bikeDist: 0, runDist: 0,
        swimCount: 0, bikeCount: 0, runCount: 0,
      };
    }

    // Bucket activities
    for (const act of activities) {
      const d = new Date(act.start_date_local);
      const monday = getMonday(d);
      const key = monday.toISOString().slice(0, 10);
      if (!result[key]) continue;

      const disc = classifyActivity(act.type);
      const hours = act.moving_time / 3600;
      result[key][disc] += hours;
      result[key].total += hours;

      if (disc === "swim") {
        result[key].swimDist += act.distance;
        result[key].swimCount++;
      } else if (disc === "bike") {
        result[key].bikeDist += act.distance;
        result[key].bikeCount++;
      } else if (disc === "run") {
        result[key].runDist += act.distance;
        result[key].runCount++;
      }
    }

    return Object.values(result).map((w) => ({
      ...w,
      swim: Math.round(w.swim * 10) / 10,
      bike: Math.round(w.bike * 10) / 10,
      run: Math.round(w.run * 10) / 10,
      other: Math.round(w.other * 10) / 10,
      total: Math.round(w.total * 10) / 10,
    }));
  }, [activities]);

  const chartData = weeks.map((w) => ({
    week: w.weekLabel,
    Swim: w.swim,
    Bike: w.bike,
    Run: w.run,
  }));

  return (
    <div className="space-y-3">
      {/* Stacked bar chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-4">
          Weekly Volume by Discipline
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
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
              label={{
                value: "hrs",
                position: "insideTopLeft",
                offset: -5,
                style: { fontSize: 10, fill: "#9ca3af" },
              }}
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
                `${value} hrs`,
                name,
              ]}
            />
            <Legend
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: "#6b7280" }}
            />
            <Bar dataKey="Swim" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Bike" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Run" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly breakdown table */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">
          Weekly Breakdown
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left py-2 font-medium">Week</th>
                <th className="text-right py-2 font-medium">
                  <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 mr-1" />
                  Swim
                </th>
                <th className="text-right py-2 font-medium">
                  <span className="inline-block w-2 h-2 rounded-full bg-violet-500 mr-1" />
                  Bike
                </th>
                <th className="text-right py-2 font-medium">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />
                  Run
                </th>
                <th className="text-right py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.weekKey} className="border-b border-gray-50">
                  <td className="py-2 text-gray-700 font-medium">
                    {w.weekLabel}
                  </td>
                  <td className="py-2 text-right text-gray-600">
                    {w.swimCount > 0 ? (
                      <span>
                        {formatHours(w.swim * 3600)}
                        <span className="text-gray-400 ml-1">
                          ({formatKm(w.swimDist)})
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-2 text-right text-gray-600">
                    {w.bikeCount > 0 ? (
                      <span>
                        {formatHours(w.bike * 3600)}
                        <span className="text-gray-400 ml-1">
                          ({formatKm(w.bikeDist)})
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-2 text-right text-gray-600">
                    {w.runCount > 0 ? (
                      <span>
                        {formatHours(w.run * 3600)}
                        <span className="text-gray-400 ml-1">
                          ({formatKm(w.runDist)})
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-2 text-right text-gray-900 font-medium">
                    {formatHours(w.total * 3600)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
