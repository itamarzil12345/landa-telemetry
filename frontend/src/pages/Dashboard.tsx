import { useMemo, useState } from "react";
import { KpiRow } from "@/components/KpiRow";
import { LiveActivityChart } from "@/components/LiveActivityChart";
import { SystemFlowCard } from "@/components/SystemFlowCard";
import { LogPanel } from "@/components/LogPanel";
import { NodeDetailDrawer } from "@/components/NodeDetailDrawer";
import { ThemeSelector } from "@/components/ThemeSelector";
import { ResetDataButton } from "@/components/ResetDataButton";
import { Tabs } from "@/components/common/tabs";
import { SensorCard } from "@/components/SensorCard";
import { ArchitectureFlow } from "@/components/architecture/ArchitectureFlow";
import { useTelemetry } from "@/hooks/useTelemetry";
import { LABELS } from "@/constants";

export default function Dashboard() {
  const { sensors, latest, history } = useTelemetry();
  const [drawerNode, setDrawerNode] = useState<string | null>(null);
  const values = Object.values(latest);
  const active = values.length;
  const avg = active ? values.reduce((s, t) => s + t.value, 0) / active : 0;
  const max = active ? Math.max(...values.map((t) => t.value)) : 0;

  const aggregate = useMemo(() => {
    const buckets = new Map<number, number[]>();
    for (const arr of Object.values(history))
      for (const t of arr)
        buckets.set(t.timestampUnix, [
          ...(buckets.get(t.timestampUnix) ?? []),
          t.value,
        ]);
    return [...buckets.entries()]
      .sort(([a], [b]) => a - b)
      .slice(-30)
      .map(([ts, vs]) => ({
        ts,
        avg: vs.reduce((s, v) => s + v, 0) / vs.length,
      }));
  }, [history]);

  const tabs = [
    {
      id: "system-activity",
      label: "System Activity",
      content: (
        <div className="flex min-h-0 flex-1 flex-col">
          <SystemFlowCard onNodeClick={setDrawerNode} height="h-full" />
        </div>
      ),
    },
    {
      id: "event-stream",
      label: "Event Stream",
      content: (
        <div className="flex min-h-0 flex-1 flex-col">
          <LogPanel />
        </div>
      ),
    },
    {
      id: "live-activity",
      label: "Live Activity",
      content: (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          <KpiRow total={sensors.length} active={active} avg={avg} peak={max} />
          <div className="rounded-xl border bg-card p-4">
            <p className="mb-1 text-sm font-semibold">{LABELS.liveActivity}</p>
            <p className="mb-3 text-xs text-muted-foreground">
              {LABELS.liveActivityHint}
            </p>
            <LiveActivityChart data={aggregate} />
          </div>
          <div>
            <h2 className="mb-2 text-sm font-semibold">
              {LABELS.sensorsHeading}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {sensors.map((id) => (
                <SensorCard
                  key={id}
                  sensorId={id}
                  current={latest[id]}
                  history={history[id] ?? []}
                />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "system-architecture",
      label: "System Architecture",
      content: (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
          <ArchitectureFlow />
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Tabs
        tabs={tabs}
        defaultTabId="system-activity"
        rightSlot={
          <div className="flex items-center gap-2">
            <ResetDataButton />
            <ThemeSelector />
          </div>
        }
      />
      {drawerNode && (
        <NodeDetailDrawer
          nodeId={drawerNode}
          onClose={() => setDrawerNode(null)}
        />
      )}
    </div>
  );
}
