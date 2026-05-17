import { useState } from "react";
import { Maximize2 } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { Button } from "@/components/common/button";
import { EventRow } from "@/components/EventRow";
import { LogPanelModal } from "@/components/LogPanelModal";
import { LABELS } from "@/constants";
import { useSystemEvents } from "@/hooks/useSystemEvents";

export function LogPanel() {
  const { events } = useSystemEvents();
  const [open, setOpen] = useState(false);
  const visible = events.slice(0, 50);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <CardTitle className="text-base">{LABELS.logsTitle}</CardTitle>
          <CardDescription>{LABELS.logsHint}</CardDescription>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setOpen(true)}
          aria-label="Expand"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <div className="min-h-0 flex-1 overflow-y-auto border-t font-mono">
        {visible.length === 0 ? (
          <div className="p-4 text-xs text-muted-foreground">
            {LABELS.logsEmpty}
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {visible.map((e, idx) => (
              <EventRow
                key={`${e.receivedAt}-${idx}`}
                event={e}
                fresh={idx === 0}
              />
            ))}
          </ul>
        )}
      </div>
      {open && <LogPanelModal onClose={() => setOpen(false)} />}
    </Card>
  );
}
