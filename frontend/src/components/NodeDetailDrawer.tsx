import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/common/button";
import { EventRow } from "@/components/EventRow";
import { NODES } from "@/components/systemTopology";
import { useSystemEvents } from "@/hooks/useSystemEvents";
import { useTelemetry } from "@/hooks/useTelemetry";

const SHOWS_LATEST = new Set([
  "sensors",
  "telemetry-service",
  "redis",
  "frontend",
]);

export function NodeDetailDrawer({
  nodeId,
  onClose,
}: {
  nodeId: string;
  onClose: () => void;
}) {
  const node = NODES.find((n) => n.id === nodeId);
  const { events } = useSystemEvents();
  const { latest } = useTelemetry();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const nodeEvents = useMemo(
    () => events.filter((e) => e.source === nodeId || e.target === nodeId).slice(0, 40),
    [events, nodeId],
  );
  const latestValues = useMemo(
    () => Object.values(latest).sort((a, b) => a.sensorId.localeCompare(b.sensorId)),
    [latest],
  );

  if (!node) return null;
  const Icon = node.icon;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <aside
        className="relative flex h-full w-full max-w-md flex-col overflow-hidden border-l bg-card shadow-2xl [animation:slide-in-right_220ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b p-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold leading-tight">{node.label}</h2>
            <p className="text-xs text-muted-foreground">{node.caption}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {SHOWS_LATEST.has(nodeId) && (
            <section className="border-b p-4">
              <h3 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                Current values ({latestValues.length})
              </h3>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                {latestValues.map((v) => (
                  <div
                    key={v.sensorId}
                    className="flex items-center justify-between rounded bg-muted/40 px-2 py-1"
                  >
                    <span className="text-muted-foreground">{v.sensorId}</span>
                    <span className="tabular-nums">{v.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="p-4">
            <h3 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
              Recent activity ({nodeEvents.length})
            </h3>
            <ul className="divide-y divide-border/60 font-mono">
              {nodeEvents.map((e, idx) => (
                <EventRow key={`${e.receivedAt}-${idx}`} event={e} fresh={idx === 0} />
              ))}
              {nodeEvents.length === 0 && (
                <li className="py-2 text-xs text-muted-foreground">No events yet</li>
              )}
            </ul>
          </section>
        </div>
      </aside>
    </div>
  );
}
