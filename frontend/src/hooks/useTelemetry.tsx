import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  HubConnectionBuilder,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr";
import { API_BASE_URL, HISTORY_WINDOW, HUB_EVENT, HUB_PATH } from "@/constants";
import { fetchSensors } from "@/services/api";
import type { TelemetryMessage } from "@/model";

type ConnState = "connecting" | "connected" | "disconnected";

interface TelemetryContextValue {
  sensors: string[];
  latest: Record<string, TelemetryMessage>;
  history: Record<string, TelemetryMessage[]>;
  connection: ConnState;
  reset: () => void;
}

const Ctx = createContext<TelemetryContextValue | null>(null);

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const [sensors, setSensors] = useState<string[]>([]);
  const [latest, setLatest] = useState<Record<string, TelemetryMessage>>({});
  const [history, setHistory] = useState<Record<string, TelemetryMessage[]>>(
    {},
  );
  const [connection, setConnection] = useState<ConnState>("connecting");

  useEffect(() => {
    fetchSensors().then(setSensors).catch(console.error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | null = null;
    const hub: HubConnection = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}${HUB_PATH}`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    hub.on(HUB_EVENT, (update: TelemetryMessage) => {
      setLatest((prev) => ({ ...prev, [update.sensorId]: update }));
      setHistory((prev) => ({
        ...prev,
        [update.sensorId]: [...(prev[update.sensorId] ?? []), update].slice(
          -HISTORY_WINDOW,
        ),
      }));
    });
    hub.onreconnecting(() => setConnection("connecting"));
    hub.onreconnected(() => setConnection("connected"));
    hub.onclose(() => setConnection("disconnected"));

    const tryStart = () => {
      if (cancelled) return;
      hub
        .start()
        .then(() => !cancelled && setConnection("connected"))
        .catch(() => {
          if (cancelled) return;
          setConnection("disconnected");
          retry = setTimeout(tryStart, 3000);
        });
    };
    tryStart();

    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
      hub.stop().catch(() => undefined);
    };
  }, []);

  const reset = useCallback(() => {
    setLatest({});
    setHistory({});
  }, []);

  const value = useMemo(
    () => ({ sensors, latest, history, connection, reset }),
    [sensors, latest, history, connection, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTelemetry() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTelemetry must be inside TelemetryProvider");
  return ctx;
}
