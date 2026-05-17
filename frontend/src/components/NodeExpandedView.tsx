import { useMemo } from "react";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useSystemEvents } from "@/hooks/useSystemEvents";
import type { SystemEvent } from "@/model";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour12: false });
}

function Shell({
  heading,
  count,
  children,
}: {
  heading: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-2 max-h-[180px] overflow-y-auto rounded-md bg-muted/30 p-1.5">
      <div className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">
        {heading} · {count}
      </div>
      {children}
    </div>
  );
}

function EventList({ events }: { events: SystemEvent[] }) {
  if (events.length === 0) {
    return <div className="text-[10px] text-muted-foreground">no events</div>;
  }
  return (
    <ul className="space-y-0.5 font-mono text-[10px]">
      {events.map((e, idx) => (
        <li
          key={`${e.receivedAt}-${idx}`}
          className="flex items-baseline gap-1.5 truncate rounded bg-background/60 px-1.5 py-0.5"
        >
          <span className="shrink-0 text-muted-foreground">
            {formatTime(e.receivedAt)}
          </span>
          <span className="truncate text-foreground/80">
            {e.kind}
            {e.sensorId ? ` · ${e.sensorId}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function NodeExpandedView({ nodeId }: { nodeId: string }) {
  const { latest } = useTelemetry();
  const { events } = useSystemEvents();

  const filtered = useMemo(() => {
    switch (nodeId) {
      case "sensors":
        return events.filter((e) => e.source === "sensors").slice(0, 8);
      case "telemetry-service":
        return events
          .filter(
            (e) =>
              e.source === "telemetry-service" || e.target === "telemetry-service",
          )
          .slice(0, 8);
      case "redis":
        return events.filter((e) => e.kind === "redis_write").slice(0, 8);
      case "rabbitmq":
        return events
          .filter(
            (e) => e.kind === "rabbit_publish" || e.kind === "rabbit_consume",
          )
          .slice(0, 8);
      case "rest-api":
        return events
          .filter((e) => e.source === "rest-api" || e.target === "rest-api")
          .slice(0, 8);
      case "sql-service":
        return events
          .filter(
            (e) => e.source === "sql-service" || e.target === "sql-service",
          )
          .slice(0, 8);
      case "postgres":
        return events.filter((e) => e.kind === "postgres_write").slice(0, 8);
      case "frontend":
        return events.filter((e) => e.kind === "signalr_push").slice(0, 8);
      default:
        return events.slice(0, 8);
    }
  }, [events, nodeId]);

  if (nodeId === "sensors") {
    const values = Object.values(latest).sort((a, b) =>
      a.sensorId.localeCompare(b.sensorId),
    );
    return (
      <Shell heading="Current readings" count={values.length}>
        <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
          {values.map((v) => (
            <div
              key={v.sensorId}
              className="flex items-center justify-between rounded bg-background/60 px-1.5 py-0.5"
            >
              <span className="text-muted-foreground">{v.sensorId}</span>
              <span className="tabular-nums">{v.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </Shell>
    );
  }

  if (nodeId === "redis") {
    const values = Object.values(latest).sort((a, b) =>
      a.sensorId.localeCompare(b.sensorId),
    );
    return (
      <>
        <Shell heading="Cached keys" count={values.length}>
          <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
            {values.slice(0, 12).map((v) => (
              <div
                key={v.sensorId}
                className="flex items-center justify-between rounded bg-background/60 px-1.5 py-0.5"
              >
                <span className="text-muted-foreground truncate">
                  sensor:{v.sensorId}
                </span>
                <span className="tabular-nums">{v.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Shell>
        <Shell heading="Recent writes" count={filtered.length}>
          <EventList events={filtered} />
        </Shell>
      </>
    );
  }

  const labelByNode: Record<string, string> = {
    "telemetry-service": "Recent emits",
    rabbitmq: "Recent messages",
    "rest-api": "Recent requests",
    "sql-service": "Recent gRPC saves",
    postgres: "Recent writes",
    frontend: "Recent SignalR pushes",
  };

  return (
    <Shell heading={labelByNode[nodeId] ?? "Recent activity"} count={filtered.length}>
      <EventList events={filtered} />
    </Shell>
  );
}
