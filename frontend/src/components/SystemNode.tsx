import { Handle, Position } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NodeExpandedView } from "@/components/NodeExpandedView";
import { NodeLiveStat } from "@/components/NodeLiveStat";

export type SystemNodeData = {
  label: string;
  caption: string;
  icon: LucideIcon;
  badge?: string;
  active: boolean;
  focused?: boolean;
} & Record<string, unknown>;

const handleClass = "!h-2 !w-2 !border-0 !bg-transparent !opacity-0";

export function SystemNode({
  id,
  data,
}: {
  id: string;
  data: SystemNodeData;
}) {
  const expanded = data.focused === true;
  const Icon = data.icon;
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm",
        expanded
          ? "min-w-[260px] px-3 py-3 ring-2 ring-primary/40"
          : "min-w-[160px] px-3 py-2.5",
      )}
    >
      <Handle type="target" position={Position.Left} id="left-in" className={handleClass} />
      <Handle type="source" position={Position.Left} id="left-out" className={handleClass} />
      <Handle type="target" position={Position.Right} id="right-in" className={handleClass} />
      <Handle type="source" position={Position.Right} id="right-out" className={handleClass} />
      <Handle type="target" position={Position.Top} id="top-in" className={handleClass} />
      <Handle type="source" position={Position.Top} id="top-out" className={handleClass} />
      <Handle type="target" position={Position.Bottom} id="bottom-in" className={handleClass} />
      <Handle type="source" position={Position.Bottom} id="bottom-out" className={handleClass} />
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
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
      <NodeLiveStat nodeId={id} />
      {expanded && <NodeExpandedView nodeId={id} />}
    </div>
  );
}
