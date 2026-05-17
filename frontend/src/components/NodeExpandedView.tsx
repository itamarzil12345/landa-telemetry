import { useSystemEvents, type StoredRecord } from "@/hooks/useSystemEvents";
import { SensorGrid } from "@/components/SensorGrid";

function formatTime(ts: number) {
  const d = new Date(ts);
  return (
    d.toLocaleTimeString(undefined, { hour12: false }) +
    "." +
    String(d.getMilliseconds()).padStart(3, "0").slice(0, 2)
  );
}

function RecordsTable({
  heading,
  records,
}: {
  heading: string;
  records: StoredRecord[];
}) {
  return (
    <div className="mt-2 max-h-[220px] overflow-y-auto rounded-md border border-border/40 bg-muted/30">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-muted/80 px-2 py-1 text-[9px] uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
        <span>{heading}</span>
        <span className="tabular-nums">{records.length}</span>
      </div>
      {records.length === 0 ? (
        <div className="px-2 py-3 text-center text-[10px] text-muted-foreground">
          waiting for first packet…
        </div>
      ) : (
        <table className="w-full font-mono text-[10px]">
          <thead className="text-[9px] uppercase text-muted-foreground/70">
            <tr>
              <th className="px-2 py-1 text-left font-normal">sensor</th>
              <th className="px-2 py-1 text-right font-normal">value</th>
              <th className="px-2 py-1 text-right font-normal">stored</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, idx) => (
              <tr
                key={`${r.storedAt}-${idx}`}
                className="border-t border-border/20 hover:bg-background/40"
              >
                <td className="truncate px-2 py-0.5 text-foreground/80">
                  {r.sensorId}
                </td>
                <td className="px-2 py-0.5 text-right tabular-nums text-primary">
                  {r.value !== undefined ? r.value.toFixed(2) : "—"}
                </td>
                <td className="px-2 py-0.5 text-right tabular-nums text-muted-foreground">
                  {formatTime(r.storedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function NodeExpandedView({ nodeId }: { nodeId: string }) {
  const { redisRecords, postgresRecords } = useSystemEvents();

  if (nodeId === "sensors") {
    return <SensorGrid />;
  }
  if (nodeId === "redis") {
    return <RecordsTable heading="cached rows" records={redisRecords} />;
  }
  if (nodeId === "postgres") {
    return <RecordsTable heading="rows persisted" records={postgresRecords} />;
  }
  return null;
}
