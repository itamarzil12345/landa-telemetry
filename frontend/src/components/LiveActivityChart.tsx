import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Point {
  ts: number;
  avg: number;
}

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

export function LiveActivityChart({ data }: { data: Point[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="liveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="ts" hide />
          <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(v) =>
              new Date(Number(v) * 1000).toLocaleTimeString()
            }
            formatter={(v: number) => v.toFixed(2)}
          />
          <Area
            type="monotone"
            dataKey="avg"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#liveGrad)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
