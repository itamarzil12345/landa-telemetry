import { useEffect, useState } from "react";
import { useTelemetry } from "@/hooks/useTelemetry";
import { cn } from "@/lib/utils";

const COLS = 5;
const ROWS = 4;
const TOTAL = COLS * ROWS;

// A reading is "live" if it arrived within the last LIVE_WINDOW_MS.
const LIVE_WINDOW_MS = 1500;

function SensorCell({
  index,
  sensorId,
  value,
  ageMs,
}: {
  index: number;
  sensorId: string | undefined;
  value: number | undefined;
  ageMs: number;
}) {
  const num = String(index + 1).padStart(2, "0");
  const hasReading = value !== undefined;
  const live = hasReading && ageMs >= 0 && ageMs < LIVE_WINDOW_MS;

  return (
    <div
      title={sensorId}
      className={cn(
        "relative flex h-[42px] flex-col items-center justify-center rounded-md border bg-background px-1 font-mono",
        live
          ? "border-primary/70 bg-primary/15 text-primary"
          : hasReading
            ? "border-border text-foreground/70"
            : "border-border/40 text-muted-foreground/40",
      )}
    >
      <span
        className={cn(
          "absolute right-1 top-1 h-1.5 w-1.5 rounded-full",
          live
            ? "bg-primary shadow-[0_0_6px_var(--primary)]"
            : hasReading
              ? "bg-muted-foreground/40"
              : "bg-border",
        )}
      />
      <span className="text-[8px] font-semibold uppercase tracking-wide opacity-80">
        S{num}
      </span>
      <span className="text-[11px] tabular-nums leading-none">
        {hasReading ? value!.toFixed(1) : "----"}
      </span>
    </div>
  );
}

export function SensorGrid() {
  const { latest, sensors } = useTelemetry();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const ids =
    sensors.length === TOTAL
      ? sensors
      : Array.from({ length: TOTAL }, (_, i) => `sensor-${String(i + 1).padStart(2, "0")}`);

  return (
    <div className="mt-2 rounded-md border border-border/40 bg-muted/30 p-1.5">
      <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-wider text-muted-foreground">
        <span>field probes</span>
        <span className="tabular-nums">{TOTAL}</span>
      </div>
      <div className={`grid grid-cols-${COLS} gap-1`} style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
        {ids.slice(0, TOTAL).map((id, idx) => {
          const reading = latest[id];
          const ageMs = reading ? now - reading.timestampUnix * 1000 : Infinity;
          return (
            <SensorCell
              key={id}
              index={idx}
              sensorId={id}
              value={reading?.value}
              ageMs={ageMs}
            />
          );
        })}
      </div>
    </div>
  );
}
