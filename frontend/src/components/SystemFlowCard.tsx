import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { Button } from "@/components/common/button";
import { SystemFlow } from "@/components/SystemFlow";
import { LABELS } from "@/constants";
import { cn } from "@/lib/utils";

interface Props {
  onNodeClick?: (nodeId: string) => void;
  height?: string;
}

export function SystemFlowCard({ onNodeClick, height = "h-[720px]" }: Props) {
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  return (
    <Card
      className={cn(
        "flex flex-col transition-all",
        full ? "fixed inset-4 z-40 shadow-2xl" : "min-h-0 flex-1",
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <CardTitle>{LABELS.systemFlowTitle}</CardTitle>
          <CardDescription>
            {LABELS.systemFlowHint} Scroll to zoom · click a node for details.
          </CardDescription>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setFull((f) => !f)}
          aria-label={full ? "Minimize" : "Expand"}
        >
          {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
        <div
          className={cn(
            "w-full",
            full ? "h-[calc(100vh-9rem)]" : height === "h-full" ? "min-h-0 flex-1" : height,
          )}
        >
          <SystemFlow onNodeClick={onNodeClick} />
        </div>
      </CardContent>
    </Card>
  );
}
