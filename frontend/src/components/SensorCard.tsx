import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/common/card";
import { Sparkline } from "@/components/Sparkline";
import type { TelemetryMessage } from "@/model";

interface Props {
  sensorId: string;
  current?: TelemetryMessage;
  history: TelemetryMessage[];
}

const formatTime = (unix?: number) =>
  unix ? new Date(unix * 1000).toLocaleTimeString() : "—";

export function SensorCard({ sensorId, current, history }: Props) {
  const live = Boolean(current);
  return (
    <Link to={`/sensor/${sensorId}`} className="group block">
      <Card className="transition-all group-hover:border-primary/50 group-hover:shadow-md group-hover:shadow-primary/5">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {sensorId}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${live ? "bg-success animate-pulse" : "bg-muted-foreground/40"}`}
              />
              <span className="text-[10px] text-muted-foreground">
                {formatTime(current?.timestampUnix)}
              </span>
            </div>
          </div>
          <div className="text-2xl font-semibold tabular-nums">
            {current ? current.value.toFixed(2) : "—"}
          </div>
          <Sparkline data={history} />
        </CardContent>
      </Card>
    </Link>
  );
}
