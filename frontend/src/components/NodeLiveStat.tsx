import { useSystemEvents } from "@/hooks/useSystemEvents";

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return n.toString();
}

export function NodeLiveStat({ nodeId }: { nodeId: string }) {
  const { redisRecords, postgresRecords } = useSystemEvents();

  if (nodeId !== "redis" && nodeId !== "postgres") return null;

  const records = nodeId === "redis" ? redisRecords : postgresRecords;
  const latest = records[0];

  return (
    <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-border/40 pt-1 font-mono text-[9px]">
      <span className="truncate text-foreground/80">
        {latest ? (
          <>
            {latest.sensorId}
            {latest.value !== undefined && (
              <span className="text-primary"> · {latest.value.toFixed(2)}</span>
            )}
          </>
        ) : (
          "—"
        )}
      </span>
      <span className="shrink-0 text-muted-foreground">{fmt(records.length)}</span>
    </div>
  );
}
