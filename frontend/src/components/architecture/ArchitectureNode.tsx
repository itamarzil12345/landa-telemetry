import { Handle, Position } from "@xyflow/react";
import { ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArchNodeData, ArchNodeType } from "./architectureData";

const handleClass = "!h-2 !w-2 !border-0 !bg-transparent !opacity-0";

interface TypeStyle {
  badge: string;
  badgeClass: string;
  ringClass: string;
  headerClass: string;
}

function getTypeStyle(nodeId: string, type: ArchNodeType): TypeStyle {
  if (type === "client") {
    return {
      badge: "CLIENT",
      badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30",
      ringClass: "ring-1 ring-sky-500/30",
      headerClass: "bg-sky-500/8",
    };
  }
  if (type === "service") {
    return {
      badge: "SERVICE",
      badgeClass: "bg-primary/15 text-primary border-primary/30",
      ringClass: "ring-1 ring-primary/40",
      headerClass: "bg-primary/8",
    };
  }
  if (nodeId === "redis") {
    return {
      badge: "CACHE",
      badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30",
      ringClass: "ring-1 ring-rose-500/30",
      headerClass: "bg-rose-500/8",
    };
  }
  if (nodeId === "postgres") {
    return {
      badge: "DATABASE",
      badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",
      ringClass: "ring-1 ring-amber-500/30",
      headerClass: "bg-amber-500/8",
    };
  }
  return {
    badge: "MESSAGE BUS",
    badgeClass: "bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30",
    ringClass: "ring-1 ring-violet-500/30",
    headerClass: "bg-violet-500/8",
  };
}

function Handles() {
  return (
    <>
      <Handle type="target" position={Position.Left} id="left-in" className={handleClass} />
      <Handle type="source" position={Position.Left} id="left-out" className={handleClass} />
      <Handle type="target" position={Position.Right} id="right-in" className={handleClass} />
      <Handle type="source" position={Position.Right} id="right-out" className={handleClass} />
      <Handle type="target" position={Position.Top} id="top-in" className={handleClass} />
      <Handle type="source" position={Position.Top} id="top-out" className={handleClass} />
      <Handle type="target" position={Position.Bottom} id="bottom-in" className={handleClass} />
      <Handle type="source" position={Position.Bottom} id="bottom-out" className={handleClass} />
    </>
  );
}

function NodeHeader({
  data,
  style,
}: {
  data: ArchNodeData;
  style: TypeStyle;
}) {
  const Icon = data.icon;
  return (
    <div className={cn("flex items-start gap-2 px-3 py-2.5", style.headerClass)}>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-background text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold leading-tight">{data.label}</p>
          <span
            className={cn(
              "shrink-0 rounded border px-1 py-px text-[8px] font-semibold uppercase tracking-wider",
              style.badgeClass,
            )}
          >
            {style.badge}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{data.tagline}</p>
      </div>
    </div>
  );
}

export function ArchitectureNode({
  data,
}: {
  data: ArchNodeData & {
    selected?: boolean;
    focused?: boolean;
    onSnippetClick?: (nodeId: string, snippetTitle: string) => void;
  };
}) {
  const style = getTypeStyle(data.id, data.type);
  const selected = data.selected === true;
  const expanded = data.focused === true || selected;

  if (!expanded) {
    // Compact card: header only, narrower, with a zoom hint
    return (
      <div
        className={cn(
          "w-[220px] overflow-hidden rounded-xl border border-border bg-card shadow-sm",
          style.ringClass,
        )}
      >
        <Handles />
        <NodeHeader data={data} style={style} />
        <div className="flex items-center gap-1 border-t border-border/40 px-3 py-1 text-[9px] text-muted-foreground">
          <ZoomIn className="h-2.5 w-2.5" />
          <span>zoom in for details</span>
        </div>
      </div>
    );
  }

  // Expanded card: full content (focused or selected)
  return (
    <div
      className={cn(
        "w-[300px] overflow-hidden rounded-xl border border-border bg-card shadow-md",
        style.ringClass,
        selected && "ring-2 ring-primary",
      )}
    >
      <Handles />
      <NodeHeader data={data} style={style} />

      <div className="flex flex-wrap gap-1 border-t border-border/40 px-3 py-1.5">
        {data.tech.slice(0, 4).map((t) => (
          <span
            key={t}
            className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground"
          >
            {t}
          </span>
        ))}
        {data.tech.length > 4 && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
            +{data.tech.length - 4}
          </span>
        )}
      </div>

      <div className="border-t border-border/40 px-3 py-2">
        <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Does
        </div>
        <ul className="space-y-1 text-[11px] leading-snug text-foreground/85">
          {data.responsibilities.slice(0, 3).map((r) => (
            <li key={r} className="flex gap-1.5">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {data.snippets.length > 0 && (
        <div className="border-t border-border/40 px-3 py-2">
          <div className="mb-1 flex items-center justify-between text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Key code</span>
            <span className="font-mono text-foreground/60">{data.snippets.length}</span>
          </div>
          <ul className="space-y-0.5">
            {data.snippets.map((s) => (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onSnippetClick?.(data.id, s.title);
                  }}
                  className="group flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] text-foreground/80 hover:bg-primary/10 hover:text-primary"
                >
                  <ChevronRight className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
                  <span className="truncate">{s.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
