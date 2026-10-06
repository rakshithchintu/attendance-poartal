import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import { DailyTrendItem } from '../types/index.js';

interface AttendanceTrendChartProps {
  data: DailyTrendItem[];
  threshold?: number;
  className?: string;
}

export const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({
  data,
  threshold = 75,
  className,
}) => {
  return (
    <div className={`h-72 w-full ${className || ''}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
          <XAxis
            dataKey="formattedDate"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
          />
          <YAxis
            domain={[40, 100]}
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            unit="%"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as DailyTrendItem;
                return (
                  <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md text-xs">
                    <div className="font-semibold text-white mb-1.5">{item.date} {item.notes ? `(${item.notes})` : ''}</div>
                    <div className="flex items-center justify-between gap-4 text-indigo-400 font-bold text-sm mb-2">
                      <span>Attendance Rate:</span>
                      <span>{item.attendanceRate}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300">
                      <div>Present: <span className="font-medium text-emerald-400">{item.present}</span></div>
                      <div>Late: <span className="font-medium text-amber-400">{item.late}</span></div>
                      <div>Absent: <span className="font-medium text-rose-400">{item.absent}</span></div>
                      <div>Excused: <span className="font-medium text-indigo-400">{item.excused}</span></div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine
            y={threshold}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{
              value: `Threshold (${threshold}%)`,
              fill: '#ef4444',
              fontSize: 10,
              position: 'insideTopLeft',
            }}
          />
          <Area
            type="monotone"
            dataKey="attendanceRate"
            stroke="#6366f1"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#attendanceGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface DayOfWeekBarChartProps {
  dayTotals: Record<string, number>;
  className?: string;
}

export const DayOfWeekBarChart: React.FC<DayOfWeekBarChartProps> = ({
  dayTotals,
  className,
}) => {
  const chartData = Object.entries(dayTotals).map(([day, absences]) => ({
    day: day.substring(0, 3),
    absences,
    isPeak: absences >= 4,
  }));

  return (
    <div className={`h-64 w-full ${className || ''}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
          <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#334155' }} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#334155' }} allowDecimals={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs shadow-lg text-white">
                    <span className="font-bold">{item.day}:</span> {item.absences} cumulative absences
                    {item.isPeak && <div className="text-[10px] text-rose-400 font-semibold mt-1">High absenteeism day</div>}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="absences"
            radius={[4, 4, 0, 0]}
            fill="#f43f5e"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
