import { useEffect, useState } from "react";
import { Cpu, Database, Network, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthCard } from "@/components/HealthCard";
import { fetchHealth } from "@/services/api";
import { COMPONENT_INFO, LABELS } from "@/constants";
import type { HealthStatus } from "@/model";

export default function SystemStatus() {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchHealth()
      .then(setStatus)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {LABELS.health}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {LABELS.healthHint}
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          {LABELS.refresh}
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {!status && loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)
        ) : status ? (
          <>
            <HealthCard
              {...COMPONENT_INFO.redis}
              healthy={status.redis}
              icon={Cpu}
            />
            <HealthCard
              {...COMPONENT_INFO.sql}
              healthy={status.sql}
              icon={Database}
            />
            <HealthCard
              {...COMPONENT_INFO.rabbit}
              healthy={status.rabbitMQ}
              icon={Network}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
