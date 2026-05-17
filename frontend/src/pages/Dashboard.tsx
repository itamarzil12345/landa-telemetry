import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KpiRow } from "@/components/KpiRow";
import { SensorCard } from "@/components/SensorCard";
import { LiveActivityChart } from "@/components/LiveActivityChart";
import { SystemFlowCard } from "@/components/SystemFlowCard";
import { LogPanel } from "@/components/LogPanel";
import { NodeDetailDrawer } from "@/components/NodeDetailDrawer";
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
        buckets.set(t.timestampUnix, [...(buckets.get(t.timestampUnix) ?? []), t.value]);
    return [...buckets.entries()]
      .sort(([a], [b]) => a - b)
      .slice(-30)
      .map(([ts, vs]) => ({ ts, avg: vs.reduce((s, v) => s + v, 0) / vs.length }));
  }, [history]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          {LABELS.overviewTitle}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {LABELS.overviewHint}
        </p>
      </header>

      <KpiRow total={sensors.length} active={active} avg={avg} peak={max} />

      <SystemFlowCard onNodeClick={setDrawerNode} />

      <div className="h-[360px]">
        <LogPanel />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{LABELS.liveActivity}</CardTitle>
          <CardDescription>{LABELS.liveActivityHint}</CardDescription>
        </CardHeader>
        <CardContent>
          <LiveActivityChart data={aggregate} />
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{LABELS.sensorsHeading}</h2>
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
      </section>

      {drawerNode && (
        <NodeDetailDrawer
          nodeId={drawerNode}
          onClose={() => setDrawerNode(null)}
        />
      )}
    </div>
  );
}
