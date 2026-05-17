import { useEffect, useMemo, useState } from "react";
import { Pause, Play, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventRow } from "@/components/EventRow";
import { useSystemEvents } from "@/hooks/useSystemEvents";
import { LABELS } from "@/constants";
import type { SystemEvent } from "@/model";

export function LogPanelModal({ onClose }: { onClose: () => void }) {
  const { events } = useSystemEvents();
  const [filter, setFilter] = useState("");
  const [paused, setPaused] = useState(false);
  const [frozen, setFrozen] = useState<SystemEvent[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (paused) setFrozen(events);
  }, [paused, events]);

  const list = paused ? frozen : events;

  const filtered = useMemo(() => {
    if (!filter) return list;
    const q = filter.toLowerCase();
    return list.filter((e) =>
      [e.source, e.target, e.kind, e.sensorId ?? ""].some((f) =>
        f.toLowerCase().includes(q),
      ),
    );
  }, [list, filter]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-background/80 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b p-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{LABELS.logsTitle}</h2>
            <p className="text-xs text-muted-foreground">
              {filtered.length} of {list.length} events
              {paused ? " · paused" : " · live"}
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter source, target, sensor…"
              className="h-9 w-72 rounded-md border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Resume" : "Pause"}
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto font-mono">
          <ul className="divide-y divide-border/60">
            {filtered.map((e, idx) => (
              <EventRow
                key={`${e.receivedAt}-${idx}`}
                event={e}
                fresh={!paused && idx === 0}
                compact={false}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
