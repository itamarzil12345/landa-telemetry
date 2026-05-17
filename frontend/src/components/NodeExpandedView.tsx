import { useTelemetry } from "@/hooks/useTelemetry";
import { useSystemEvents } from "@/hooks/useSystemEvents";

const SHOWS_LATEST = new Set([
  "sensors",
  "telemetry-service",
  "redis",
  "frontend",
]);

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour12: false });
}

export function NodeExpandedView({ nodeId }: { nodeId: string }) {
  const { latest } = useTelemetry();
  const { events } = useSystemEvents();

  if (SHOWS_LATEST.has(nodeId)) {
    const values = Object.values(latest).sort((a, b) =>
      a.sensorId.localeCompare(b.sensorId),
    );
    return (
      <div className="mt-2 max-h-[160px] overflow-y-auto rounded-md bg-muted/30 p-1.5">
        <div className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">
          Cached values · {values.length}
        </div>
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
      </div>
    );
  }

  const nodeEvents = events
    .filter((e) => e.source === nodeId || e.target === nodeId)
    .slice(0, 8);
  return (
    <div className="mt-2 max-h-[160px] overflow-y-auto rounded-md bg-muted/30 p-1.5">
      <div className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground">
        Recent · {nodeEvents.length}
      </div>
      <ul className="space-y-0.5 font-mono text-[10px]">
        {nodeEvents.map((e, idx) => (
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
        {nodeEvents.length === 0 && (
          <li className="text-[10px] text-muted-foreground">no events</li>
        )}
      </ul>
    </div>
  );
}
