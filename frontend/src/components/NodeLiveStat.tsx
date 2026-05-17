import { useSystemEvents } from "@/hooks/useSystemEvents";
import { useTelemetry } from "@/hooks/useTelemetry";

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toString();
}

export function NodeLiveStat({ nodeId }: { nodeId: string }) {
  const { counters, lastSensorByKind } = useSystemEvents();
  const { latest } = useTelemetry();

  let count = 0;
  let lastSensorId: string | null = null;
  let withValue = false;

  switch (nodeId) {
    case "sensors": {
      count = Object.keys(latest).length;
      const arr = Object.values(latest);
      lastSensorId = arr.length
        ? arr.reduce((a, b) => (a.timestampUnix > b.timestampUnix ? a : b))
            .sensorId
        : null;
      break;
    }
    case "telemetry-service":
      count =
        (counters["redis_write"] ?? 0) + (counters["rabbit_publish"] ?? 0);
      lastSensorId =
        lastSensorByKind["rabbit_publish"] ??
        lastSensorByKind["redis_write"] ??
        null;
      break;
    case "redis":
      count = counters["redis_write"] ?? 0;
      lastSensorId = lastSensorByKind["redis_write"] ?? null;
      withValue = true;
      break;
    case "rabbitmq":
      count =
        (counters["rabbit_publish"] ?? 0) + (counters["rabbit_consume"] ?? 0);
      lastSensorId =
        lastSensorByKind["rabbit_consume"] ??
        lastSensorByKind["rabbit_publish"] ??
        null;
      break;
    case "rest-api":
      count = counters["signalr_push"] ?? 0;
      lastSensorId = lastSensorByKind["signalr_push"] ?? null;
      break;
    case "sql-service":
      count = counters["grpc_save"] ?? 0;
      lastSensorId = lastSensorByKind["grpc_save"] ?? null;
      break;
    case "postgres":
      count = counters["postgres_write"] ?? 0;
      lastSensorId = lastSensorByKind["postgres_write"] ?? null;
      withValue = true;
      break;
    case "frontend":
      count = counters["signalr_push"] ?? 0;
      lastSensorId = lastSensorByKind["signalr_push"] ?? null;
      break;
    default:
      return null;
  }

  if (count === 0 && !lastSensorId) {
    return (
      <div className="mt-1.5 border-t border-border/40 pt-1 text-[9px] text-muted-foreground">
        waiting…
      </div>
    );
  }

  const value =
    withValue && lastSensorId ? latest[lastSensorId]?.value : undefined;

  return (
    <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-border/40 pt-1 font-mono text-[9px]">
      <span className="truncate text-foreground/80">
        {lastSensorId ?? "—"}
        {value !== undefined && (
          <span className="text-primary"> · {value.toFixed(2)}</span>
        )}
      </span>
      <span className="shrink-0 text-muted-foreground">{fmt(count)}</span>
    </div>
  );
}
