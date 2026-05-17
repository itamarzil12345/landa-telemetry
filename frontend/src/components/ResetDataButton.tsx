import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/common/button";
import { useSystemEvents } from "@/hooks/useSystemEvents";
import { useTelemetry } from "@/hooks/useTelemetry";
import { resetAllData } from "@/services/api";

export function ResetDataButton() {
  const { reset: resetEvents } = useSystemEvents();
  const { reset: resetTelemetry } = useTelemetry();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        setError(null);
        try {
          await resetAllData();
          resetEvents();
          resetTelemetry();
        } catch (e) {
          setError(e instanceof Error ? e.message : "reset failed");
        } finally {
          setBusy(false);
        }
      }}
      title={error ?? "Clear Redis cache, Postgres rows, and local UI state"}
    >
      {busy ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RotateCcw className="mr-2 h-4 w-4" />
      )}
      Reset Data
    </Button>
  );
}
