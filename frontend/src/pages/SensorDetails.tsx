import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/card";
import { DetailChart } from "@/components/DetailChart";
import { fetchSensorHistory } from "@/services/api";
import { useTelemetry } from "@/hooks/useTelemetry";
import { LABELS } from "@/constants";
import type { TelemetryMessage } from "@/model";

export default function SensorDetails() {
  const { sensorId = "" } = useParams();
  const navigate = useNavigate();
  const { sensors, latest, history: live } = useTelemetry();
  const [stored, setStored] = useState<TelemetryMessage[]>([]);

  useEffect(() => {
    if (!sensorId) return;
    fetchSensorHistory(sensorId, 50).then(setStored).catch(console.error);
  }, [sensorId]);

  const series = useMemo(() => {
    const merged = [...stored.slice().reverse(), ...(live[sensorId] ?? [])];
    const seen = new Set<number>();
    return merged.filter(
      (m) => !seen.has(m.timestampUnix) && seen.add(m.timestampUnix),
    );
  }, [stored, live, sensorId]);

  const values = series.map((s) => s.value);
  const stats = [
    { label: LABELS.currentValue, value: latest[sensorId]?.value },
    { label: LABELS.min, value: values.length ? Math.min(...values) : undefined },
    { label: LABELS.max, value: values.length ? Math.max(...values) : undefined },
    {
      label: LABELS.avg,
      value: values.length
        ? values.reduce((s, v) => s + v, 0) / values.length
        : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {LABELS.sensorLabel}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{sensorId}</h1>
        </div>
        <select
          value={sensorId}
          onChange={(e) => navigate(`/sensor/${e.target.value}`)}
          className="h-9 rounded-md border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {sensors.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {s.value !== undefined ? s.value.toFixed(2) : "—"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{LABELS.detailChartTitle}</CardTitle>
          <CardDescription>{LABELS.detailChartHint}</CardDescription>
        </CardHeader>
        <CardContent>
          <DetailChart data={series} />
        </CardContent>
      </Card>
    </div>
  );
}
