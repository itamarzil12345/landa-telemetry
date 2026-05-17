import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TelemetryMessage } from "@/model";

const formatTime = (u: number) => new Date(u * 1000).toLocaleTimeString();

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

export function DetailChart({ data }: { data: TelemetryMessage[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="timestampUnix"
            tickFormatter={formatTime}
            stroke="var(--muted-foreground)"
            fontSize={11}
            minTickGap={50}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={11}
            domain={["dataMin - 1", "dataMax + 1"]}
            width={36}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(v) => formatTime(Number(v))}
            formatter={(v: number) => v.toFixed(2)}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
