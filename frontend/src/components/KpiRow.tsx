import { Activity, Gauge, TrendingUp, Waves } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { LABELS } from "@/constants";

interface Props {
  total: number;
  active: number;
  avg: number;
  peak: number;
}

export function KpiRow({ total, active, avg, peak }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label={LABELS.totalSensors}
        value={total}
        icon={<Gauge className="h-5 w-5" />}
      />
      <KpiCard
        label={LABELS.activeNow}
        value={active}
        hint={LABELS.reporting.replace("{count}", String(total))}
        icon={<Activity className="h-5 w-5" />}
      />
      <KpiCard
        label={LABELS.avgValue}
        value={avg.toFixed(2)}
        icon={<Waves className="h-5 w-5" />}
      />
      <KpiCard
        label={LABELS.peak}
        value={peak.toFixed(2)}
        icon={<TrendingUp className="h-5 w-5" />}
      />
    </div>
  );
}
