import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import type { TelemetryMessage } from "@/model";

interface Props {
  data: TelemetryMessage[];
  stroke?: string;
}

export function Sparkline({ data, stroke = "var(--primary)" }: Props) {
  if (!data?.length) {
    return <div className="h-12 w-full rounded-md bg-muted/40" />;
  }
  return (
    <div className="h-12 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
