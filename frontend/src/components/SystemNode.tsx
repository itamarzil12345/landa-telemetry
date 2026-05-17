import { Handle, Position, useStore } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NodeExpandedView } from "@/components/NodeExpandedView";

export type SystemNodeData = {
  label: string;
  caption: string;
  icon: LucideIcon;
  badge?: string;
  active: boolean;
} & Record<string, unknown>;

const handleClass = "!h-2 !w-2 !border-0 !bg-border";
const EXPAND_ZOOM = 1.35;

export function SystemNode({
  id,
  data,
}: {
  id: string;
  data: SystemNodeData;
}) {
  const zoom = useStore((s) => s.transform[2]);
  const expanded = zoom >= EXPAND_ZOOM;
  const Icon = data.icon;
  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-sm transition-all duration-300",
        expanded ? "min-w-[260px] px-3 py-3" : "min-w-[160px] px-3 py-2.5",
        data.active
          ? "border-primary/70 shadow-[0_0_22px_-2px_var(--primary)]"
          : "border-border",
      )}
    >
      <Handle type="target" position={Position.Left} id="left" className={handleClass} />
      <Handle type="target" position={Position.Top} id="top" className={handleClass} />
      <Handle type="source" position={Position.Right} id="right" className={handleClass} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={handleClass} />
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "grid h-9 w-9 place-items-center rounded-md text-primary transition-colors",
            data.active ? "bg-primary/25" : "bg-primary/10",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{data.label}</p>
          <p className="text-[10px] text-muted-foreground">{data.caption}</p>
        </div>
        {data.badge && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            {data.badge}
          </span>
        )}
      </div>
      {expanded && <NodeExpandedView nodeId={id} />}
    </div>
  );
}
