import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/common/badge";
import { KIND_LABELS } from "@/constants";
import type { SystemEvent } from "@/model";

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return (
    d.toLocaleTimeString(undefined, { hour12: false }) +
    "." +
    String(d.getMilliseconds()).padStart(3, "0").slice(0, 2)
  );
};

const levelTone = (l: SystemEvent["level"]) =>
  l === "error"
    ? "text-destructive"
    : l === "warn"
      ? "text-warning"
      : "text-primary";

interface Props {
  event: SystemEvent;
  fresh?: boolean;
  compact?: boolean;
}

export function EventRow({ event, fresh, compact = true }: Props) {
  const baseLi = cn(
    "flex items-baseline gap-2 border-l-2",
    compact ? "px-3 py-1.5 text-[11px]" : "px-4 py-2.5 text-[13px]",
    fresh ? "border-primary/60" : "border-transparent",
  );

  if (compact) {
    return (
      <li className={baseLi}>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {formatTime(event.receivedAt)}
        </span>
        <span className={cn("shrink-0 font-semibold", levelTone(event.level))}>
          {event.source}
        </span>
        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="shrink-0 text-foreground/80">{event.target}</span>
        <span className="truncate text-muted-foreground">
          {KIND_LABELS[event.kind] ?? event.kind}
          {event.sensorId ? ` · ${event.sensorId}` : ""}
        </span>
      </li>
    );
  }

  return (
    <li className={baseLi}>
      <span className="w-[88px] shrink-0 tabular-nums text-muted-foreground">
        {formatTime(event.receivedAt)}
      </span>
      <span
        className={cn(
          "w-[36px] shrink-0 text-center text-[10px] uppercase tracking-wider",
          levelTone(event.level),
        )}
      >
        {event.level}
      </span>
      <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
        {event.source}
      </span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground/80">
        {event.target}
      </span>
      <span className="shrink-0 text-muted-foreground">
        {KIND_LABELS[event.kind] ?? event.kind}
      </span>
      {event.sensorId && (
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {event.sensorId}
        </Badge>
      )}
      {event.message && (
        <span className="truncate text-xs text-muted-foreground">
          {event.message}
        </span>
      )}
    </li>
  );
}
